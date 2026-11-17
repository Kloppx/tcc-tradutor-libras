"""REST API for authentication and patient CRUD.

This module is mounted into the existing FastAPI app used by the WebSocket
translation server, so the mobile app can talk to one backend for auth,
patient intake, triage, and medical notes.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable, Dict, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field, field_validator


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.getenv("INTERPRETARTE_DATA_DIR", BASE_DIR / "data"))
DB_PATH = DATA_DIR / "backend.db"

router = APIRouter(prefix="/api", tags=["api"])
bearer_scheme = HTTPBearer(auto_error=False)

PASSWORD_ITERATIONS = 600_000
TOKEN_TTL_HOURS = 8
VALID_ROLES = {"Medico", "Enfermeiro"}


class LoginPayload(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("E-mail inválido")
        return value


class RegisterPayload(LoginPayload):
    name: str
    role: Literal["Medico", "Enfermeiro"]
    councilNumber: str

    @field_validator("name", "councilNumber")
    @classmethod
    def require_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Campo obrigatório")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("A senha deve ter pelo menos 8 caracteres")
        return value


class PatientLookupPayload(BaseModel):
    cpf: Optional[str] = None
    sus: Optional[str] = None

    @field_validator("cpf", "sus")
    @classmethod
    def digits_only(cls, value: Optional[str]) -> Optional[str]:
        return re.sub(r"\D", "", value) if value else None


class ActivationPayload(BaseModel):
    active: bool


class PatientCreatePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nome: str = Field(min_length=3, max_length=120)
    idade: Optional[int] = Field(default=None, ge=0, le=130)
    cpf: Optional[str] = None
    sus: Optional[str] = None
    rg: Optional[str] = Field(default=None, max_length=20)
    dataNascimento: Optional[str] = Field(default=None, max_length=20)
    estadoCivil: Optional[str] = Field(default=None, max_length=40)
    endereco: Optional[str] = Field(default=None, max_length=250)
    triagem: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("nome", "rg", "dataNascimento", "estadoCivil", "endereco")
    @classmethod
    def normalize_optional_text(cls, value: Optional[str]) -> Optional[str]:
        return value.strip() if value else value

    @field_validator("cpf")
    @classmethod
    def validate_cpf_length(cls, value: Optional[str]) -> Optional[str]:
        digits = re.sub(r"\D", "", value) if value else None
        if digits and len(digits) != 11:
            raise ValueError("CPF deve conter 11 dígitos")
        return digits

    @field_validator("sus")
    @classmethod
    def validate_sus_length(cls, value: Optional[str]) -> Optional[str]:
        digits = re.sub(r"\D", "", value) if value else None
        if digits and len(digits) != 15:
            raise ValueError("Cartão SUS deve conter 15 dígitos")
        return digits
def _now() -> str:
    return datetime.utcnow().isoformat()


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"


def _verify_password(password: str, stored_hash: str) -> bool:
    if stored_hash.startswith("pbkdf2_sha256$"):
        try:
            _, iterations, salt_hex, digest_hex = stored_hash.split("$", 3)
            candidate = hashlib.pbkdf2_hmac(
                "sha256",
                password.encode("utf-8"),
                bytes.fromhex(salt_hex),
                int(iterations),
            )
            return hmac.compare_digest(candidate.hex(), digest_hex)
        except (ValueError, TypeError):
            return False

    # Migração transparente dos hashes SHA-256 usados nas versões anteriores.
    legacy_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return hmac.compare_digest(legacy_hash, stored_hash)


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _base64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _token_secret() -> bytes:
    configured_secret = os.getenv("INTERPRETARTE_SECRET_KEY")
    if configured_secret:
        return configured_secret.encode("utf-8")

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    secret_path = DATA_DIR / ".api_secret"
    if not secret_path.exists():
        secret_path.write_text(secrets.token_urlsafe(48), encoding="utf-8")
    return secret_path.read_text(encoding="utf-8").strip().encode("utf-8")


def _create_access_token(user: sqlite3.Row) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user["id"],
        "role": user["role"],
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=TOKEN_TTL_HOURS)).timestamp()),
        "iss": "interpretarte-api",
    }
    header_segment = _base64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode("utf-8"))
    payload_segment = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
    signature = hmac.new(_token_secret(), signing_input, hashlib.sha256).digest()
    return f"{header_segment}.{payload_segment}.{_base64url_encode(signature)}"


def _decode_access_token(token: str) -> Dict[str, Any]:
    try:
        header_segment, payload_segment, signature_segment = token.split(".")
        signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
        expected_signature = hmac.new(_token_secret(), signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(expected_signature, _base64url_decode(signature_segment)):
            raise ValueError("invalid signature")
        payload = json.loads(_base64url_decode(payload_segment))
        if payload.get("iss") != "interpretarte-api":
            raise ValueError("invalid issuer")
        if int(payload.get("exp", 0)) <= int(datetime.now(timezone.utc).timestamp()):
            raise ValueError("expired token")
        return payload
    except (ValueError, TypeError, json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação necessária",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_payload = _decode_access_token(credentials.credentials)
    connection = _connect()
    try:
        row = connection.execute(
            "SELECT * FROM users WHERE id = ? AND is_active = 1",
            (token_payload.get("sub"),),
        ).fetchone()
    finally:
        connection.close()

    if row is None:
        raise HTTPException(status_code=401, detail="Usuário inativo ou inexistente")
    return _row_to_user(row)


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[Dict[str, Any]]:
    if credentials is None:
        return None
    return get_current_user(credentials)


def require_roles(*roles: str) -> Callable[..., Dict[str, Any]]:
    def role_dependency(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        if current_user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Acesso não autorizado para esta função")
        return current_user

    return role_dependency


def _connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    return connection


def _create_tables(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            council_number TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        )
        """
    )

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            idade INTEGER,
            senha TEXT NOT NULL,
            risco TEXT DEFAULT 'Verde',
            especialidade TEXT DEFAULT 'Clínico Geral',
            cpf TEXT,
            sus TEXT,
            rg TEXT,
            birth_date TEXT,
            civil_status TEXT,
            address TEXT,
            status TEXT NOT NULL DEFAULT 'waiting',
            triage_json TEXT NOT NULL DEFAULT '{}',
            clinical_note TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )

    user_columns = {row["name"] for row in connection.execute("PRAGMA table_info(users)").fetchall()}
    if "is_active" not in user_columns:
        connection.execute("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1")

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS counters (
            name TEXT PRIMARY KEY,
            value INTEGER NOT NULL
        )
        """
    )
    connection.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_senha_unique ON patients(senha)")


def _seed_defaults(connection: sqlite3.Connection) -> None:
    users_total = connection.execute("SELECT COUNT(*) AS total FROM users").fetchone()["total"]

    if users_total == 0:
        created_at = _now()
        demo_users = [
            {
                "name": "Medico Demonstracao",
                "email": "medico@ubs.com",
                "password": "123",
                "role": "Medico",
                "council_number": "DEMO-CRM",
            },
            {
                "name": "Enfermeiro Demonstracao",
                "email": "enfermeiro@ubs.com",
                "password": "123",
                "role": "Enfermeiro",
                "council_number": "DEMO-COREN",
            },
        ]

        for user in demo_users:
            connection.execute(
                """
                INSERT INTO users (
                    id, name, email, password_hash, role, council_number, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid.uuid4()),
                    user["name"],
                    user["email"],
                    _hash_password(user["password"]),
                    user["role"],
                    user["council_number"],
                    created_at,
                ),
            )

    patients_total = connection.execute("SELECT COUNT(*) AS total FROM patients").fetchone()["total"]

    if patients_total == 0:
        created_at_anchor = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
        seed_patients = [
            {
                "nome": "Ana Paula Souza",
                "idade": 22,
                "senha": "N-45",
                "risco": "Verde",
                "triagem": {"pa": "118/76", "temp": "36.4", "spo2": "98", "peso": "62", "queixa": "Dor de garganta"},
            },
            {
                "nome": "Ricardo Alencar",
                "idade": 45,
                "senha": "N-46",
                "risco": "Amarelo",
                "triagem": {"pa": "142/92", "temp": "37.1", "spo2": "96", "peso": "84", "queixa": "Dor no peito leve"},
            },
            {
                "nome": "Beatriz Lins",
                "idade": 31,
                "senha": "N-47",
                "risco": "Verde",
                "triagem": {"pa": "120/80", "temp": "36.8", "spo2": "99", "peso": "68", "queixa": "Cefaleia"},
            },
            {
                "nome": "Carlos Andrade",
                "idade": 56,
                "senha": "N-48",
                "risco": "Amarelo",
                "triagem": {"pa": "150/95", "temp": "37.3", "spo2": "95", "peso": "90", "queixa": "Tontura"},
            },
            {
                "nome": "João da Silva",
                "senha": "H-01",
                "risco": "Verde",
                "especialidade": "Clínico Geral",
                "status": "triaged",
                "triagem": {"pa": "120/80", "temp": "36.5", "spo2": "98", "peso": "75", "queixa": "Dor de cabeça constante"},
            },
            {
                "nome": "Maria Oliveira",
                "senha": "H-02",
                "risco": "Amarelo",
                "especialidade": "Clínico Geral",
                "status": "triaged",
                "triagem": {"pa": "145/90", "temp": "37.2", "spo2": "96", "peso": "70", "queixa": "Dor torácica leve"},
            },
            {
                "nome": "José Santos",
                "senha": "H-03",
                "risco": "Vermelho",
                "especialidade": "Urgência",
                "status": "triaged",
                "triagem": {"pa": "170/105", "temp": "38.1", "spo2": "91", "peso": "82", "queixa": "Dispneia e dor no peito"},
            },
        ]

        for index, seed_patient in enumerate(seed_patients):
            triage = seed_patient.pop("triagem", {})
            created_at = (created_at_anchor - timedelta(hours=(len(seed_patients) - 1 - index))).isoformat()
            connection.execute(
                """
                INSERT INTO patients (
                    id, nome, idade, senha, risco, especialidade,
                    cpf, sus, rg, birth_date, civil_status, address,
                    status, triage_json, clinical_note, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid.uuid4()),
                    seed_patient.get("nome"),
                    seed_patient.get("idade"),
                    seed_patient.get("senha"),
                    seed_patient.get("risco", "Verde"),
                    seed_patient.get("especialidade", "Clínico Geral"),
                    None,
                    None,
                    None,
                    None,
                    None,
                    None,
                    seed_patient.get("status", "waiting"),
                    json.dumps(triage, ensure_ascii=False),
                    "",
                    created_at,
                    created_at,
                ),
            )


def _initialize_ticket_counter(connection: sqlite3.Connection) -> None:
    highest_ticket = connection.execute(
        """
        SELECT COALESCE(MAX(CAST(SUBSTR(senha, 3) AS INTEGER)), 0) AS value
        FROM patients
        WHERE senha GLOB 'N-[0-9]*'
        """
    ).fetchone()["value"]
    connection.execute(
        "INSERT OR IGNORE INTO counters (name, value) VALUES ('patient_ticket', ?)",
        (highest_ticket,),
    )


def _next_ticket(connection: sqlite3.Connection) -> str:
    connection.execute("UPDATE counters SET value = value + 1 WHERE name = 'patient_ticket'")
    value = connection.execute(
        "SELECT value FROM counters WHERE name = 'patient_ticket'"
    ).fetchone()["value"]
    return f"N-{value:03d}"


def init_db() -> None:
    connection = _connect()
    try:
        _create_tables(connection)
        _seed_defaults(connection)
        _initialize_ticket_counter(connection)
        connection.commit()
    finally:
        connection.close()


def _row_to_patient(row: sqlite3.Row) -> Dict[str, Any]:
    triage_payload = {}
    if row["triage_json"]:
        try:
            triage_payload = json.loads(row["triage_json"])
        except json.JSONDecodeError:
            triage_payload = {}

    return {
        "id": row["id"],
        "nome": row["nome"],
        "idade": row["idade"],
        "senha": row["senha"],
        "risco": row["risco"],
        "especialidade": row["especialidade"],
        "cpf": row["cpf"],
        "sus": row["sus"],
        "rg": row["rg"],
        "birthDate": row["birth_date"],
        "estadoCivil": row["civil_status"],
        "endereco": row["address"],
        "status": row["status"],
        "triagem": triage_payload,
        "clinicalNote": row["clinical_note"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def _get_patient_row(connection: sqlite3.Connection, patient_id: str) -> sqlite3.Row:
    row = connection.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return row


def _parse_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(str(value).replace(",", "."))
    except ValueError:
        return None


def _row_to_user(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
        "councilNumber": row["council_number"],
        "active": bool(row["is_active"]),
        "createdAt": row["created_at"],
    }


def _parse_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        cleaned = str(value).replace("/", " ").replace(",", " ").split()[0]
        return int(float(cleaned))
    except ValueError:
        return None


def _calculate_risk(payload: Dict[str, Any]) -> str:
    temperatura = _parse_float(payload.get("temp") or payload.get("temperatura"))
    saturacao = _parse_int(payload.get("spo2") or payload.get("saturacao"))
    sistolica = None
    pressao = payload.get("pa") or payload.get("pressao")
    if isinstance(pressao, str) and "/" in pressao:
        sistolica = _parse_int(pressao.split("/")[0])
    pulso = _parse_int(payload.get("pulso"))
    glasgow = _parse_int(payload.get("glasgow"))

    sinais_vermelhos = [
        _parse_bool(payload.get("dispneia")),
        _parse_bool(payload.get("sangramento")),
        _parse_bool(payload.get("taquicardia")),
        temperatura is not None and temperatura >= 39.0,
        saturacao is not None and saturacao < 92,
        sistolica is not None and sistolica >= 180,
        glasgow is not None and glasgow < 13,
    ]
    if any(bool(item) for item in sinais_vermelhos):
        return "Vermelho"

    sinais_amarelos = [
        temperatura is not None and temperatura >= 37.8,
        saturacao is not None and saturacao < 95,
        sistolica is not None and sistolica >= 140,
        pulso is not None and pulso >= 110,
        _parse_bool(payload.get("has")),
        _parse_bool(payload.get("dm")),
        _parse_bool(payload.get("gravidez")),
        _parse_bool(payload.get("temAlergia")),
    ]
    if any(sinais_amarelos):
        return "Amarelo"

    return "Verde"


def _parse_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value == 1
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "1", "sim", "yes"}:
            return True
        if normalized in {"false", "0", "nao", "não", "no", ""}:
            return False
    return False


def _parse_iso_datetime(value: str) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


@router.get("/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok"}


@router.post("/auth/login")
def login(payload: LoginPayload) -> Dict[str, Any]:
    connection = _connect()
    try:
        row = connection.execute(
            "SELECT * FROM users WHERE email = ?",
            (payload.email,),
        ).fetchone()
        if row is None or not _verify_password(payload.password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        if not row["is_active"]:
            raise HTTPException(status_code=403, detail="Cadastro aguardando aprovação")

        if not row["password_hash"].startswith("pbkdf2_sha256$"):
            connection.execute(
                "UPDATE users SET password_hash = ? WHERE id = ?",
                (_hash_password(payload.password), row["id"]),
            )
            connection.commit()

        return {
            "user": _row_to_user(row),
            "accessToken": _create_access_token(row),
            "tokenType": "bearer",
            "expiresIn": TOKEN_TTL_HOURS * 60 * 60,
        }
    finally:
        connection.close()


@router.post("/auth/register")
def register(
    payload: RegisterPayload,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user),
) -> Dict[str, Any]:
    activate_immediately = bool(current_user and current_user["role"] == "Medico")
    connection = _connect()
    try:
        existing = connection.execute("SELECT id FROM users WHERE email = ?", (payload.email,)).fetchone()
        if existing is not None:
            raise HTTPException(status_code=409, detail="E-mail já cadastrado")

        user_id = str(uuid.uuid4())
        connection.execute(
            """
            INSERT INTO users (id, name, email, password_hash, role, council_number, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                payload.name,
                payload.email,
                _hash_password(payload.password),
                payload.role,
                payload.councilNumber,
                1 if activate_immediately else 0,
                _now(),
            ),
        )
        connection.commit()
    finally:
        connection.close()

    return {
        "user": {
            "id": user_id,
            "name": payload.name,
            "email": payload.email,
            "role": payload.role,
            "councilNumber": payload.councilNumber,
            "active": activate_immediately,
        },
        "message": "Profissional cadastrado" if activate_immediately else "Cadastro enviado para aprovação",
    }


@router.get("/professionals")
def list_professionals(
    role: Optional[str] = None,
    _: Dict[str, Any] = Depends(require_roles("Medico")),
) -> Dict[str, Any]:
    connection = _connect()
    try:
        if role:
            rows = connection.execute(
                "SELECT * FROM users WHERE role = ? ORDER BY created_at DESC",
                (role,),
            ).fetchall()
        else:
            rows = connection.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
        professionals = [_row_to_user(row) for row in rows]
    finally:
        connection.close()

    return {"professionals": professionals}


@router.delete("/professionals/{professional_id}")
def delete_professional(
    professional_id: str,
    current_user: Dict[str, Any] = Depends(require_roles("Medico")),
) -> Dict[str, str]:
    if professional_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Você não pode excluir o próprio acesso")
    connection = _connect()
    try:
        row = connection.execute("SELECT id FROM users WHERE id = ?", (professional_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Profissional não encontrado")

        connection.execute("DELETE FROM users WHERE id = ?", (professional_id,))
        connection.commit()
    finally:
        connection.close()

    return {"status": "deleted"}


@router.put("/professionals/{professional_id}/activation")
def set_professional_activation(
    professional_id: str,
    payload: ActivationPayload,
    current_user: Dict[str, Any] = Depends(require_roles("Medico")),
) -> Dict[str, Any]:
    if professional_id == current_user["id"] and not payload.active:
        raise HTTPException(status_code=400, detail="Você não pode desativar o próprio acesso")

    connection = _connect()
    try:
        row = connection.execute("SELECT * FROM users WHERE id = ?", (professional_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Profissional não encontrado")
        connection.execute(
            "UPDATE users SET is_active = ? WHERE id = ?",
            (1 if payload.active else 0, professional_id),
        )
        connection.commit()
        updated = connection.execute("SELECT * FROM users WHERE id = ?", (professional_id,)).fetchone()
        return {"user": _row_to_user(updated)}
    finally:
        connection.close()


@router.get("/patients")
def list_patients(
    status: Optional[str] = None,
    _: Dict[str, Any] = Depends(require_roles("Medico", "Enfermeiro")),
) -> Dict[str, Any]:
    connection = _connect()
    try:
        if status:
            rows = connection.execute(
                "SELECT * FROM patients WHERE status = ? ORDER BY updated_at DESC",
                (status,),
            ).fetchall()
        else:
            rows = connection.execute("SELECT * FROM patients ORDER BY updated_at DESC").fetchall()
        patients = [_row_to_patient(row) for row in rows]
    finally:
        connection.close()

    return {"patients": patients}


@router.get("/metrics/attendances-hourly")
def attendances_hourly(
    window_hours: int = 6,
    _: Dict[str, Any] = Depends(require_roles("Medico", "Enfermeiro")),
) -> Dict[str, Any]:
    window_hours = max(1, min(window_hours, 24))
    connection = _connect()
    try:
        anchor_row = connection.execute("SELECT MAX(created_at) AS latest FROM patients").fetchone()
        latest_created_at = _parse_iso_datetime(anchor_row["latest"] or "") if anchor_row else None

        rows = connection.execute("SELECT created_at FROM patients").fetchall()
    finally:
        connection.close()

    now = (latest_created_at or datetime.utcnow()).replace(minute=0, second=0, microsecond=0)
    start = now - timedelta(hours=window_hours - 1)

    slots = []
    counts = []
    for offset in range(window_hours):
        slot = start + timedelta(hours=offset)
        slots.append(slot)
        counts.append(0)

    index_by_slot = {slot.strftime("%Y-%m-%d %H"): idx for idx, slot in enumerate(slots)}

    for row in rows:
        created_at = _parse_iso_datetime(row["created_at"])
        if created_at is None:
            continue

        created_at_hour = created_at.replace(minute=0, second=0, microsecond=0)
        key = created_at_hour.strftime("%Y-%m-%d %H")
        idx = index_by_slot.get(key)
        if idx is not None:
            counts[idx] += 1

    labels = [slot.strftime("%Hh") for slot in slots]
    return {
        "windowHours": window_hours,
        "labels": labels,
        "values": counts,
        "generatedAt": _now(),
    }


@router.post("/patients/lookup")
def lookup_patient(payload: PatientLookupPayload) -> Dict[str, Any]:
    if (not payload.cpf or len(payload.cpf) != 11) and (not payload.sus or len(payload.sus) != 15):
        raise HTTPException(status_code=400, detail="Informe CPF ou Cartão SUS válido")

    conditions = []
    values = []
    if payload.cpf and len(payload.cpf) == 11:
        conditions.append("cpf = ?")
        values.append(payload.cpf)
    if payload.sus and len(payload.sus) == 15:
        conditions.append("sus = ?")
        values.append(payload.sus)

    connection = _connect()
    try:
        row = connection.execute(
            f"SELECT id, nome, senha, status FROM patients WHERE {' OR '.join(conditions)} LIMIT 1",
            values,
        ).fetchone()
    finally:
        connection.close()

    if row is None:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return {
        "patient": {
            "id": row["id"],
            "nome": row["nome"].split()[0],
            "senha": row["senha"],
            "status": row["status"],
        }
    }


@router.get("/patients/{patient_id}")
def get_patient(
    patient_id: str,
    _: Dict[str, Any] = Depends(require_roles("Medico", "Enfermeiro")),
) -> Dict[str, Any]:
    connection = _connect()
    try:
        row = _get_patient_row(connection, patient_id)
        patient = _row_to_patient(row)
    finally:
        connection.close()
    return {"patient": patient}


@router.get("/patients/{patient_id}/status")
def get_patient_status(patient_id: str) -> Dict[str, Any]:
    connection = _connect()
    try:
        row = _get_patient_row(connection, patient_id)
        return {
            "patient": {
                "id": row["id"],
                "senha": row["senha"],
                "status": row["status"],
                "updatedAt": row["updated_at"],
            }
        }
    finally:
        connection.close()


@router.post("/patients")
def create_patient(payload: PatientCreatePayload) -> Dict[str, Any]:
    patient_data = payload.model_dump()
    connection = _connect()
    try:
        connection.execute("BEGIN IMMEDIATE")
        identifiers = []
        identifier_values = []
        if payload.cpf:
            identifiers.append("cpf = ?")
            identifier_values.append(payload.cpf)
        if payload.sus:
            identifiers.append("sus = ?")
            identifier_values.append(payload.sus)
        if identifiers:
            existing = connection.execute(
                f"SELECT id FROM patients WHERE {' OR '.join(identifiers)} LIMIT 1",
                identifier_values,
            ).fetchone()
            if existing is not None:
                raise HTTPException(status_code=409, detail="Paciente já cadastrado; use a opção Já Tenho Cadastro")

        patient_id = str(uuid.uuid4())
        senha = _next_ticket(connection)
        triage_payload = patient_data["triagem"]

        connection.execute(
            """
            INSERT INTO patients (
                id, nome, idade, senha, risco, especialidade,
                cpf, sus, rg, birth_date, civil_status, address,
                status, triage_json, clinical_note, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                patient_id,
                payload.nome,
                payload.idade,
                senha,
                "Verde",
                "Clínico Geral",
                payload.cpf,
                payload.sus,
                payload.rg,
                payload.dataNascimento,
                payload.estadoCivil,
                payload.endereco,
                "waiting",
                json.dumps(triage_payload, ensure_ascii=False),
                "",
                _now(),
                _now(),
            ),
        )
        connection.commit()
        row = _get_patient_row(connection, patient_id)
        patient = _row_to_patient(row)
    finally:
        connection.close()

    return {"patient": patient}


@router.put("/patients/{patient_id}")
def update_patient(
    patient_id: str,
    payload: Dict[str, Any],
    _: Dict[str, Any] = Depends(require_roles("Medico", "Enfermeiro")),
) -> Dict[str, Any]:
    allowed_fields = {
        "nome": "nome",
        "idade": "idade",
        "senha": "senha",
        "risco": "risco",
        "especialidade": "especialidade",
        "cpf": "cpf",
        "sus": "sus",
        "rg": "rg",
        "birthDate": "birth_date",
        "estadoCivil": "civil_status",
        "endereco": "address",
        "status": "status",
        "clinicalNote": "clinical_note",
    }

    updates = []
    values = []

    for payload_key, column_name in allowed_fields.items():
        if payload_key in payload and payload[payload_key] is not None:
            updates.append(f"{column_name} = ?")
            values.append(payload[payload_key])

    if "triagem" in payload and payload["triagem"] is not None:
        updates.append("triage_json = ?")
        values.append(json.dumps(payload["triagem"], ensure_ascii=False))

    if not updates:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")

    updates.append("updated_at = ?")
    values.append(_now())
    values.append(patient_id)

    connection = _connect()
    try:
        _get_patient_row(connection, patient_id)
        connection.execute(
            f"UPDATE patients SET {', '.join(updates)} WHERE id = ?",
            values,
        )
        connection.commit()
        row = _get_patient_row(connection, patient_id)
        patient = _row_to_patient(row)
    finally:
        connection.close()

    return {"patient": patient}


@router.delete("/patients/{patient_id}")
def delete_patient(
    patient_id: str,
    _: Dict[str, Any] = Depends(require_roles("Medico", "Enfermeiro")),
) -> Dict[str, str]:
    connection = _connect()
    try:
        _get_patient_row(connection, patient_id)
        connection.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
        connection.commit()
    finally:
        connection.close()

    return {"status": "deleted"}


@router.put("/patients/{patient_id}/triage")
def save_triage(
    patient_id: str,
    payload: Dict[str, Any],
    _: Dict[str, Any] = Depends(require_roles("Enfermeiro")),
) -> Dict[str, Any]:
    triage_payload = dict(payload)
    risk = triage_payload.get("risco") or _calculate_risk(triage_payload)
    triage_payload["risco"] = risk

    connection = _connect()
    try:
        _get_patient_row(connection, patient_id)
        connection.execute(
            """
            UPDATE patients
            SET triage_json = ?, risco = ?, status = ?, updated_at = ?
            WHERE id = ?
            """,
            (json.dumps(triage_payload, ensure_ascii=False), risk, "triaged", _now(), patient_id),
        )
        connection.commit()
        row = _get_patient_row(connection, patient_id)
        patient = _row_to_patient(row)
    finally:
        connection.close()

    return {"patient": patient}


@router.put("/patients/{patient_id}/clinical-note")
def finalize_clinical_note(
    patient_id: str,
    payload: Dict[str, Any],
    _: Dict[str, Any] = Depends(require_roles("Medico")),
) -> Dict[str, Any]:
    note_payload = {
        "anamnese": payload.get("anamnese") or "",
        "conduta": payload.get("conduta") or "",
    }

    connection = _connect()
    try:
        _get_patient_row(connection, patient_id)
        connection.execute(
            """
            UPDATE patients
            SET clinical_note = ?, status = ?, updated_at = ?
            WHERE id = ?
            """,
            (json.dumps(note_payload, ensure_ascii=False), payload.get("status", "done"), _now(), patient_id),
        )
        connection.commit()
        row = _get_patient_row(connection, patient_id)
        patient = _row_to_patient(row)
    finally:
        connection.close()

    return {"patient": patient}


init_db()
