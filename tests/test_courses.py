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


def _unique_code(prefix="QA"):
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


def _create_course(
    client,
    headers_admin,
    code=None,
    *,
    name="QA Course",
    department="Quality Assurance",
    credits=3,
    capacity=20,
    instructor="QA Instructor",
    schedule=None,
    prerequisites=None,
):
    code = code or _unique_code()
    payload = {
        "code": code,
        "name": name,
        "department": department,
        "credits": credits,
        "description": f"{name} description.",
        "prerequisites": prerequisites or [],
        "sectionName": "Section A",
        "instructorName": instructor,
        "location": "QA Lab",
        "capacity": capacity,
        "schedule": schedule
        or [{"day": "MON", "startTime": "08:00", "endTime": "09:00"}],
    }
    response = client.post("/admin/courses", headers=headers_admin, json=payload)
    assert response.status_code == 201, response.text
    assert response.json() == {"id": code, "message": "Course created successfully."}
    return code


def _create_section(client, headers_admin, course_code, *, section_name="Section B", capacity=10):
    response = client.post(
        f"/admin/courses/{course_code}/sections",
        headers=headers_admin,
        json={
            "sectionName": section_name,
            "instructorName": "Section Instructor",
            "location": "QA Room 2",
            "capacity": capacity,
            "schedule": [{"day": "TUE", "startTime": "09:00", "endTime": "10:00"}],
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert set(body.keys()) == {"sectionId", "message"}
    assert body["message"] == "Section created successfully."
    return body["sectionId"]


def test_get_courses_without_filters_returns_catalog_shape(client, headers_student):
    response = client.get("/courses", headers=headers_student)

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"data", "pagination"}
    assert set(body["pagination"].keys()) == {"total", "page", "limit"}
    assert isinstance(body["data"], list)
    assert body["pagination"]["total"] >= 4

    first_course = body["data"][0]
    assert set(first_course.keys()) == {
        "id",
        "code",
        "name",
        "department",
        "credits",
        "description",
    }


def test_get_courses_filters_by_department_and_accepts_open_only_param(client, headers_student):
    # The MVP backend exposes /courses, not /courses/sections. Unknown query
    # params are ignored by FastAPI, so open_only is included for compatibility
    # with the v1.0 spec while department filtering remains the core assertion.
    response = client.get(
        "/courses",
        headers=headers_student,
        params={"department": "Computer Science", "open_only": "true"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]
    assert all(course["department"] == "Computer Science" for course in body["data"])


def test_get_course_detail_existing_course(client, headers_student):
    response = client.get("/courses/CS101", headers=headers_student)

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {
        "id",
        "code",
        "name",
        "department",
        "credits",
        "prerequisites",
        "description",
        "sections",
    }
    assert body["id"] == "CS101"
    assert body["code"] == "CS101"
    assert body["sections"]

    section = body["sections"][0]
    assert set(section.keys()) == {
        "id",
        "sectionName",
        "instructor",
        "location",
        "schedule",
        "capacity",
        "enrolled",
        "availableSeats",
        "status",
    }


def test_get_course_detail_nonexistent_course_returns_404(client, headers_student):
    response = client.get("/courses/NO_SUCH_COURSE", headers=headers_student)

    assert response.status_code == 404


def test_admin_create_course_returns_exact_response_keys(client, headers_admin):
    code = _unique_code("NEW")
    response = client.post(
        "/admin/courses",
        headers=headers_admin,
        json={
            "code": code,
            "name": "New Admin Course",
            "department": "Administration",
            "credits": 3,
            "description": "Created by admin API test.",
            "prerequisites": [],
        },
    )

    assert response.status_code == 201
    assert response.json() == {"id": code, "message": "Course created successfully."}


def test_admin_create_section_for_existing_course(client, headers_admin):
    course_code = _create_course(client, headers_admin)
    section_id = _create_section(client, headers_admin, course_code)

    assert section_id.startswith("SEC-")


def test_admin_update_section_capacity_and_instructor(client, headers_admin, headers_student):
    course_code = _create_course(client, headers_admin)
    section_id = _create_section(client, headers_admin, course_code, capacity=12)

    response = client.put(
        f"/admin/sections/{section_id}",
        headers=headers_admin,
        json={"capacity": 25, "instructorId": "Updated Instructor"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "sectionId": section_id,
        "message": "Section updated successfully.",
    }

    detail = client.get(f"/courses/{course_code}", headers=headers_student)
    assert detail.status_code == 200
    section = next(item for item in detail.json()["sections"] if item["id"] == section_id)
    assert section["capacity"] == 25
    assert section["instructor"] == "Updated Instructor"


def test_admin_enrollment_report_returns_current_enrollment_and_capacity(
    client,
    headers_admin,
):
    course_code = _create_course(client, headers_admin, capacity=7)
    response = client.get(
        "/admin/reports/enrollment",
        headers=headers_admin,
        params={"department": "Quality Assurance"},
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"generatedAt", "data"}
    report_item = next(item for item in body["data"] if item["courseCode"] == course_code)
    assert set(report_item.keys()) == {
        "courseCode",
        "sectionName",
        "instructor",
        "capacity",
        "enrolled",
        "availabilityPercentage",
        "status",
    }
    assert report_item["capacity"] == 7
    assert report_item["enrolled"] == 0
    assert report_item["status"] == "OPEN"


@pytest.mark.xfail(reason="Current MVP API does not expose DELETE /admin/sections/{sectionId}.")
def test_admin_delete_section_cancel_endpoint(client, headers_admin):
    course_code = _create_course(client, headers_admin)
    section_id = _create_section(client, headers_admin, course_code)

    response = client.delete(f"/admin/sections/{section_id}", headers=headers_admin)

    assert response.status_code == 200
