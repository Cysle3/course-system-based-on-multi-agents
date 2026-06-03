import importlib
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
BACKEND_MODULES = ["main", "database", "models", "schemas", "auth", "crud"]


def _load_app(tmp_path, monkeypatch):
    """Import the backend with cwd pointed at tmp_path so SQLite is isolated."""
    monkeypatch.chdir(tmp_path)
    sys.path.insert(0, str(BACKEND_DIR))
    for module_name in BACKEND_MODULES:
        sys.modules.pop(module_name, None)
    return importlib.import_module("main")


@pytest.fixture()
def app_module(tmp_path, monkeypatch):
    module = _load_app(tmp_path, monkeypatch)
    yield module
    module.app.dependency_overrides.clear()
    for module_name in BACKEND_MODULES:
        sys.modules.pop(module_name, None)


@pytest.fixture()
def client(app_module):
    with TestClient(app_module.app) as test_client:
        yield test_client


def _login(client, user_id, password):
    response = client.post("/auth/login", json={"id": user_id, "password": password})
    assert response.status_code == 200, response.text
    body = response.json()
    assert set(body.keys()) == {"token", "tokenType", "user"}
    assert body["tokenType"] == "bearer"
    return body["token"]


@pytest.fixture()
def student_token(client):
    return _login(client, "student", "student")


@pytest.fixture()
def admin_token(client):
    return _login(client, "admin", "admin")


@pytest.fixture()
def headers_student(student_token):
    return {"Authorization": f"Bearer {student_token}"}


@pytest.fixture()
def headers_admin(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def test_login_success_returns_token_and_user(client):
    response = client.post("/auth/login", json={"id": "student", "password": "student"})

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"token", "tokenType", "user"}
    assert body["tokenType"] == "bearer"
    assert set(body["user"].keys()) == {"id", "name", "role"}
    assert body["user"]["id"] == "student"
    assert body["user"]["role"] == "STUDENT"
    assert body["token"]


@pytest.mark.parametrize("user_id", ["student2", "student3"])
def test_seeded_additional_student_login_success(client, user_id):
    response = client.post("/auth/login", json={"id": user_id, "password": user_id})

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["id"] == user_id
    assert body["user"]["role"] == "STUDENT"
    assert body["token"]


def test_valid_student_token_allows_protected_schedule_access(client, headers_student):
    response = client.get("/students/me/schedule", headers=headers_student)

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"studentId", "totalCredits", "registrations"}
    assert body["studentId"] == "student"
    assert body["totalCredits"] == 0
    assert body["registrations"] == []


def test_missing_token_returns_401(client):
    response = client.get("/students/me/schedule")

    assert response.status_code == 401


def test_invalid_token_returns_401(client):
    response = client.get(
        "/students/me/schedule",
        headers={"Authorization": "Bearer not-a-valid-jwt"},
    )

    assert response.status_code == 401


def test_student_token_cannot_access_admin_endpoint(client, headers_student):
    response = client.post(
        "/admin/courses",
        headers=headers_student,
        json={
            "code": "QA403",
            "name": "Forbidden Admin Course",
            "department": "Quality Assurance",
            "credits": 3,
            "description": "Students must not be able to create courses.",
            "prerequisites": [],
        },
    )

    assert response.status_code == 403


def test_student_token_cannot_access_admin_students_endpoint(client, headers_student):
    response = client.get("/admin/students", headers=headers_student)

    assert response.status_code == 403


def test_admin_student_list_includes_seeded_students(client, headers_admin):
    response = client.get("/admin/students", headers=headers_admin)

    assert response.status_code == 200
    usernames = {student["username"] for student in response.json()}
    assert {"student", "student2", "student3"}.issubset(usernames)
