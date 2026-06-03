"""REST API for authentication and patient CRUD.

This module is mounted into the existing FastAPI app used by the WebSocket
translation server, so the mobile app can talk to one backend for auth,
patient intake, triage, and medical notes.
"""

from __future__ import annotations

import hashlib
import json
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "backend.db"

router = APIRouter(prefix="/api", tags=["api"])


def _now() -> str:
    return datetime.utcnow().isoformat()


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


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


def _seed_defaults(connection: sqlite3.Connection) -> None:
    users_total = connection.execute("SELECT COUNT(*) AS total FROM users").fetchone()["total"]
    patients_total = connection.execute("SELECT COUNT(*) AS total FROM patients").fetchone()["total"]

    if users_total == 0:
        seed_users = [
            ("Dr. Roberto", "medico@ubs.com", "123", "Medico", None),
            ("Enf. Márcia", "enfermeiro@ubs.com", "123", "Enfermeiro", None),
        ]
        for name, email, password, role, council in seed_users:
            connection.execute(
                """
                INSERT INTO users (id, name, email, password_hash, role, council_number, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid.uuid4()),
                    name,
                    email,
                    _hash_password(password),
                    role,
                    council,
                    _now(),
                ),
            )

    if patients_total == 0:
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

        for seed_patient in seed_patients:
            triage = seed_patient.pop("triagem", {})
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
                    _now(),
                    _now(),
                ),
            )


def init_db() -> None:
    connection = _connect()
    try:
        _create_tables(connection)
        _seed_defaults(connection)
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
        payload.get("dispneia"),
        payload.get("sangramento"),
        payload.get("taquicardia"),
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
        bool(payload.get("has")),
        bool(payload.get("dm")),
        bool(payload.get("gravidez")),
        bool(payload.get("temAlergia")),
    ]
    if any(sinais_amarelos):
        return "Amarelo"

    return "Verde"


@router.get("/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok"}


@router.post("/auth/login")
def login(payload: Dict[str, Any]) -> Dict[str, Any]:
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or payload.get("senha") or ""

    if not email or not password:
        raise HTTPException(status_code=400, detail="E-mail e senha são obrigatórios")

    connection = _connect()
    try:
        row = connection.execute(
            "SELECT * FROM users WHERE email = ? AND password_hash = ?",
            (email, _hash_password(password)),
        ).fetchone()
    finally:
        connection.close()

    if row is None:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    return {
        "user": {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "role": row["role"],
            "councilNumber": row["council_number"],
        }
    }


@router.post("/auth/register")
def register(payload: Dict[str, Any]) -> Dict[str, Any]:
    name = (payload.get("name") or payload.get("nome") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or payload.get("senha") or ""
    role = payload.get("role") or payload.get("cargo") or "Profissional"
    council_number = payload.get("councilNumber") or payload.get("conselho")

    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="Nome, e-mail e senha são obrigatórios")

    connection = _connect()
    try:
        existing = connection.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing is not None:
            raise HTTPException(status_code=409, detail="E-mail já cadastrado")

        user_id = str(uuid.uuid4())
        connection.execute(
            """
            INSERT INTO users (id, name, email, password_hash, role, council_number, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, name, email, _hash_password(password), role, council_number, _now()),
        )
        connection.commit()
    finally:
        connection.close()

    return {"user": {"id": user_id, "name": name, "email": email, "role": role, "councilNumber": council_number}}


@router.get("/patients")
def list_patients(status: Optional[str] = None) -> Dict[str, Any]:
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


@router.get("/patients/{patient_id}")
def get_patient(patient_id: str) -> Dict[str, Any]:
    connection = _connect()
    try:
        row = _get_patient_row(connection, patient_id)
        patient = _row_to_patient(row)
    finally:
        connection.close()
    return {"patient": patient}


@router.post("/patients")
def create_patient(payload: Dict[str, Any]) -> Dict[str, Any]:
    name = (payload.get("nome") or payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Nome do paciente é obrigatório")

    connection = _connect()
    try:
        current_total = connection.execute("SELECT COUNT(*) AS total FROM patients").fetchone()["total"]
        patient_id = str(uuid.uuid4())
        senha = payload.get("senha") or f"N-{current_total + 1:03d}"
        triage_payload = payload.get("triagem") or {}
        status = payload.get("status") or "waiting"

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
                name,
                payload.get("idade"),
                senha,
                payload.get("risco", "Verde"),
                payload.get("especialidade", "Clínico Geral"),
                payload.get("cpf"),
                payload.get("sus"),
                payload.get("rg"),
                payload.get("birthDate") or payload.get("dataNascimento"),
                payload.get("estadoCivil"),
                payload.get("endereco"),
                status,
                json.dumps(triage_payload, ensure_ascii=False),
                payload.get("clinicalNote", ""),
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
def update_patient(patient_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
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
def delete_patient(patient_id: str) -> Dict[str, str]:
    connection = _connect()
    try:
        _get_patient_row(connection, patient_id)
        connection.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
        connection.commit()
    finally:
        connection.close()

    return {"status": "deleted"}


@router.put("/patients/{patient_id}/triage")
def save_triage(patient_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
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
def finalize_clinical_note(patient_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
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
