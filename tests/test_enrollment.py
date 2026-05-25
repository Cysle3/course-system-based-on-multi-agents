import importlib
import sys
import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
BACKEND_MODULES = ["main", "database", "models", "schemas", "auth", "crud"]


def _load_app(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    sys.path.insert(0, str(BACKEND_DIR))
    for module_name in BACKEND_MODULES:
        sys.modules.pop(module_name, None)
    return importlib.import_module("main")


def _unique_code(prefix="ENR"):
    return f"{prefix}{uuid.uuid4().int % 100000:05d}"


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
    return response.json()["token"]


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


def _headers_for_token(token):
    return {"Authorization": f"Bearer {token}"}


def _create_student(app_module, code, password="student", max_credits=18):
    db = app_module.SessionLocal()
    try:
        user = app_module.Student(
            student_code=code,
            password_hash=app_module.get_password_hash(password),
            full_name=f"{code} Test Student",
            email=f"{code}@example.edu",
            max_credits=max_credits,
            role="STUDENT",
        )
        db.add(user)
        db.commit()
    finally:
        db.close()
    return app_module.create_access_token({"sub": code, "role": "STUDENT"})


def _create_course(
    client,
    headers_admin,
    *,
    code=None,
    name=None,
    capacity=10,
    schedule=None,
    prerequisites=None,
):
    code = code or _unique_code()
    payload = {
        "code": code,
        "name": name or f"{code} Course",
        "department": "Enrollment QA",
        "credits": 3,
        "description": f"{code} enrollment test course.",
        "prerequisites": prerequisites or [],
        "sectionName": "Section A",
        "instructorName": "Enrollment Instructor",
        "location": "Enrollment Lab",
        "capacity": capacity,
        "schedule": schedule
        or [{"day": "MON", "startTime": "08:00", "endTime": "09:00"}],
    }
    response = client.post("/admin/courses", headers=headers_admin, json=payload)
    assert response.status_code == 201, response.text
    return code


def _get_first_section_id(client, headers_student, course_code):
    response = client.get(f"/courses/{course_code}", headers=headers_student)
    assert response.status_code == 200, response.text
    sections = response.json()["sections"]
    assert sections
    return sections[0]["id"]


def _enroll_student(client, headers_student, section_id):
    return client.post(
        "/students/me/schedule",
        headers=headers_student,
        json={"sectionId": section_id},
    )


def _drop_student_section(client, headers_student, section_id):
    # The current MVP API drops by sectionId. The v1.0 prompt mentions
    # enrollment_id, but the schedule response does not expose one.
    return client.delete(f"/students/me/schedule/{section_id}", headers=headers_student)


def _error_code(response):
    body = response.json()
    return body.get("error") or body.get("errorCode") or body.get("detail")


def test_successful_enrollment_schedule_and_drop_workflow(
    client,
    headers_admin,
    headers_student,
):
    course_code = _create_course(client, headers_admin, capacity=1)
    section_id = _get_first_section_id(client, headers_student, course_code)

    enroll_response = _enroll_student(client, headers_student, section_id)
    assert enroll_response.status_code == 201, enroll_response.text
    enroll_body = enroll_response.json()
    assert set(enroll_body.keys()) == {"message", "registration"}
    assert enroll_body["registration"]["sectionId"] == section_id
    assert enroll_body["registration"]["courseCode"] == course_code

    schedule_response = client.get("/students/me/schedule", headers=headers_student)
    assert schedule_response.status_code == 200
    schedule = schedule_response.json()
    assert schedule["totalCredits"] == 3
    assert any(
        registration["course"]["code"] == course_code
        for registration in schedule["registrations"]
    )

    drop_response = _drop_student_section(client, headers_student, section_id)
    assert drop_response.status_code == 200, drop_response.text
    assert "Successfully dropped" in drop_response.json()["message"]

    final_schedule = client.get("/students/me/schedule", headers=headers_student).json()
    assert final_schedule["totalCredits"] == 0
    assert final_schedule["registrations"] == []


def test_capacity_full_conflict_for_second_student(
    client,
    app_module,
    headers_admin,
    headers_student,
):
    course_code = _create_course(client, headers_admin, capacity=1)
    section_id = _get_first_section_id(client, headers_student, course_code)

    first_response = _enroll_student(client, headers_student, section_id)
    assert first_response.status_code == 201, first_response.text

    second_token = _create_student(app_module, "student_b_capacity")
    second_response = _enroll_student(client, _headers_for_token(second_token), section_id)

    assert second_response.status_code == 409
    assert _error_code(second_response) in {"SECTION_FULL", "CAPACITY_REACHED"}


def test_time_conflict_for_overlapping_sections(client, headers_admin, headers_student):
    first_course = _create_course(
        client,
        headers_admin,
        schedule=[{"day": "MON", "startTime": "10:00", "endTime": "11:30"}],
    )
    second_course = _create_course(
        client,
        headers_admin,
        schedule=[{"day": "MON", "startTime": "11:00", "endTime": "12:30"}],
    )
    first_section = _get_first_section_id(client, headers_student, first_course)
    second_section = _get_first_section_id(client, headers_student, second_course)

    first_response = _enroll_student(client, headers_student, first_section)
    assert first_response.status_code == 201, first_response.text

    # The overlap from 11:00 to 11:30 must block the second registration.
    conflict_response = _enroll_student(client, headers_student, second_section)

    assert conflict_response.status_code == 409
    assert _error_code(conflict_response) == "TIME_CONFLICT"


def test_prerequisite_not_met_blocks_enrollment(client, headers_admin, headers_student):
    course_code = _create_course(
        client,
        headers_admin,
        prerequisites=["CS999"],
        schedule=[{"day": "FRI", "startTime": "15:00", "endTime": "16:00"}],
    )
    section_id = _get_first_section_id(client, headers_student, course_code)

    response = _enroll_student(client, headers_student, section_id)

    assert response.status_code in {400, 409}
    assert _error_code(response) == "PREREQUISITE_NOT_MET"


def test_duplicate_enrollment_is_rejected(client, headers_admin, headers_student):
    course_code = _create_course(
        client,
        headers_admin,
        schedule=[{"day": "THU", "startTime": "16:00", "endTime": "17:00"}],
    )
    section_id = _get_first_section_id(client, headers_student, course_code)

    first_response = _enroll_student(client, headers_student, section_id)
    assert first_response.status_code == 201, first_response.text

    duplicate_response = _enroll_student(client, headers_student, section_id)

    assert duplicate_response.status_code == 409
    assert _error_code(duplicate_response) in {"DUPLICATE_ENROLLMENT", "DUPLICATE_COURSE"}


@pytest.mark.xfail(reason="Current MVP API does not expose POST /admin/enrollments/override.")
def test_admin_override_can_force_add_when_section_is_full(
    client,
    app_module,
    headers_admin,
    headers_student,
):
    course_code = _create_course(client, headers_admin, capacity=1)
    section_id = _get_first_section_id(client, headers_student, course_code)
    first_response = _enroll_student(client, headers_student, section_id)
    assert first_response.status_code == 201, first_response.text

    second_token = _create_student(app_module, "student_b_override")
    override_response = client.post(
        "/admin/enrollments/override",
        headers=headers_admin,
        json={"studentId": "student_b_override", "sectionId": section_id},
    )

    assert second_token
    assert override_response.status_code == 201
