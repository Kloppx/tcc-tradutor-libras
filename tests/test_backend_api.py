import os
import tempfile
import unittest
from pathlib import Path

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials


_TEMP_DATA = tempfile.TemporaryDirectory(prefix="interpretarte-backend-tests-")
os.environ["INTERPRETARTE_DATA_DIR"] = _TEMP_DATA.name

from src import backend_api as api  # noqa: E402


class BackendApiTests(unittest.TestCase):
    def setUp(self):
        database_path = Path(_TEMP_DATA.name) / "backend.db"
        if database_path.exists():
            database_path.unlink()
        api.init_db()

    def _login(self, email: str, password: str):
        response = api.login(api.LoginPayload(email=email, password=password))
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=response["accessToken"],
        )
        return response, api.get_current_user(credentials)

    def test_login_creates_valid_token_and_rejects_missing_token(self):
        response, user = self._login("medico@ubs.com", "123")
        self.assertEqual("bearer", response["tokenType"])
        self.assertEqual("Medico", user["role"])

        with self.assertRaises(HTTPException) as context:
            api.get_current_user(None)
        self.assertEqual(401, context.exception.status_code)

    def test_new_professional_requires_approval(self):
        registered = api.register(
            api.RegisterPayload(
                name="Profissional Teste",
                email="novo@ubs.com",
                password="senha-segura",
                role="Enfermeiro",
                councilNumber="123456-AL",
            ),
            None,
        )
        self.assertFalse(registered["user"]["active"])

        with self.assertRaises(HTTPException) as context:
            api.login(api.LoginPayload(email="novo@ubs.com", password="senha-segura"))
        self.assertEqual(403, context.exception.status_code)

    def test_doctor_can_create_active_professional(self):
        _, doctor = self._login("medico@ubs.com", "123")
        registered = api.register(
            api.RegisterPayload(
                name="Enfermeira Aprovada",
                email="aprovada@ubs.com",
                password="senha-segura",
                role="Enfermeiro",
                councilNumber="654321-AL",
            ),
            doctor,
        )
        self.assertTrue(registered["user"]["active"])
        login = api.login(api.LoginPayload(email="aprovada@ubs.com", password="senha-segura"))
        self.assertTrue(login["accessToken"])

    def test_ticket_sequence_does_not_repeat_after_deletion(self):
        _, nurse = self._login("enfermeiro@ubs.com", "123")
        first = api.create_patient(api.PatientCreatePayload(nome="Paciente A"))["patient"]
        existing = api.list_patients(_=nurse)["patients"][0]
        api.delete_patient(existing["id"], nurse)
        second = api.create_patient(api.PatientCreatePayload(nome="Paciente B"))["patient"]

        self.assertNotEqual(first["senha"], second["senha"])
        self.assertEqual("N-049", first["senha"])
        self.assertEqual("N-050", second["senha"])

    def test_lookup_returns_only_minimum_patient_data(self):
        created = api.create_patient(
            api.PatientCreatePayload(
                nome="Maria de Teste",
                cpf="12345678901",
                sus="123456789012345",
            )
        )["patient"]
        found = api.lookup_patient(api.PatientLookupPayload(cpf="123.456.789-01"))["patient"]

        self.assertEqual(created["id"], found["id"])
        self.assertEqual({"id", "nome", "senha", "status"}, set(found))

    def test_string_false_does_not_raise_risk(self):
        self.assertEqual("Verde", api._calculate_risk({"has": "false", "dispneia": "false"}))

    def test_role_dependency_rejects_wrong_profession(self):
        _, doctor = self._login("medico@ubs.com", "123")
        nurse_only = api.require_roles("Enfermeiro")
        with self.assertRaises(HTTPException) as context:
            nurse_only(doctor)
        self.assertEqual(403, context.exception.status_code)


if __name__ == "__main__":
    unittest.main()
