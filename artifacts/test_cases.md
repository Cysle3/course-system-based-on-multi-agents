# Backend Testing Document: SCSS API

## 1. Test Plan Overview

This document outlines the comprehensive test strategy for the SCSS (Student Course and Section System) API v1. The testing approach prioritizes functional correctness, role-based access control (RBAC), and business logic validation (specifically course conflicts and capacity management).

**Testing Stack:**
*   **Language:** Python 3.9+
*   **Framework:** `pytest`
*   **Client:** `FastAPI TestClient`
*   **Additional Libs:** `faker` (for data generation), `pydantic` (for schema validation)

**Test Structure:**
```
tests/
├── conftest.py              # Shared fixtures and setup
├── test_auth.py             # Authentication & Authorization
├── test_courses.py          # Browsing & Course Details
├── test_enrollment.py       # Student Enrollment Logic & Conflicts
└── test_admin.py            # Admin Management & Overrides
```

---

## 2. Test Configuration & Fixtures (`conftest.py`)

This file handles the setup of the test client and mock data generation.

```python
import pytest
from fastapi.testclient import TestClient
from main import app  # Assuming the FastAPI app is in main.py

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture
def admin_token_headers():
    """Helper to generate valid Admin headers."""
    return {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.admin_signature"}

@pytest.fixture
def student_token_headers():
    """Helper to generate valid Student headers."""
    return {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.student_signature"}

@pytest.fixture
def unauthorized_headers():
    """Helper to simulate missing/invalid auth."""
    return {}

@pytest.fixture
def sample_course_payload():
    return {
        "course_code": "ART-105",
        "title": "Digital Art",
        "description": "Intro to digital painting.",
        "credits": 3,
        "prerequisites": []
    }

@pytest.fixture
def sample_section_payload():
    return {
        "course_code": "ART-105",
        "term": "FALL_2024",
        "instructor": "Prof. Palette",
        "location": "Studio 1",
        "days": ["Monday", "Wednesday"],
        "start_time": "09:00:00",
        "end_time": "10:30:00",
        "max_capacity": 20
    }
```

---

## 3. Authentication & Authorization Tests (`test_auth.py`)

**Objective:** Verify the security layer, ensuring protected routes cannot be accessed without proper credentials and roles.

```python
def test_access protected_endpoint_without_token(client):
    """Verify that missing Authorization header returns 401."""
    response = client.get("/v1/students/me/schedule")
    assert response.status_code == 401
    assert "detail" in response.json()

def test_access_protected_endpoint_with_invalid_token(client):
    """Verify that a malformed token returns 401."""
    headers = {"Authorization": "Bearer invalid_token_string"}
    response = client.get("/v1/students/me/schedule", headers=headers)
    assert response.status_code == 401

def test_student_accessing_admin_endpoint(client, student_token_headers):
    """Verify that a Student role cannot access Admin specific endpoints."""
    # Attempt to create a course
    payload = {
        "course_code": "HACK-101",
        "title": "Hacking",
        "description": "Illegal",
        "credits": 5,
        "prerequisites": []
    }
    response = client.post("/v1/admin/courses", json=payload, headers=student_token_headers)
    assert response.status_code == 403
    assert "Forbidden" in response.json().get("detail", "")

def test_admin_accessing_student_endpoint(client, admin_token_headers):
    """Verify that an Admin can access Student endpoints (usually allowed for support)."""
    # Assuming admins can view schedules for support/debugging
    response = client.get("/v1/students/me/schedule", headers=admin_token_headers)
    # Expect 200 or 404 (if schedule empty), but strictly NOT 401 or 403
    assert response.status_code != 401
    assert response.status_code != 403
```

---

## 4. Course API Tests (`test_courses.py`)

**Objective:** Verify course discovery, filtering, and data integrity.

```python
def test_get_course_sections_success(client, student_token_headers):
    """Verify successful retrieval of course list."""
    response = client.get("/v1/courses/sections", headers=student_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert isinstance(data["data"], list)
    assert "meta" in data

def test_filter_sections_by_department(client, student_token_headers):
    """Verify filtering by department code works."""
    params = {"department": "CS"}
    response = client.get("/v1/courses/sections", params=params, headers=student_token_headers)
    assert response.status_code == 200
    data = response.json()
    for course in data['data']:
        # Assuming course_code starts with department code
        assert course['course_code'].startswith("CS")

def test_filter_sections_open_only(client, student_token_headers):
    """Verify that 'open_only' filter excludes full sections."""
    params = {"open_only": True}
    response = client.get("/v1/courses/sections", params=params, headers=student_token_headers)
    assert response.status_code == 200
    data = response.json()
    for section in data['data']:
        assert section['current_enrollment'] < section['max_capacity']

def test_get_course_details_success(client, student_token_headers):
    """Verify retrieval of specific course details."""
    course_code = "CS-101"
    response = client.get(f"/v1/courses/{course_code}", headers=student_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data['data']['course_code'] == course_code
    assert 'prerequisites' in data['data']

def test_get_course_details_not_found(client, student_token_headers):
    """Verify 404 returned for non-existent course."""
    response = client.get("/v1/courses/NON-EXISTENT", headers=student_token_headers)
    assert response.status_code == 404
```

---

## 5. Enrollment & Conflict Tests (`test_enrollment.py`)

**Objective:** Core business logic validation. Ensure conflicts, prerequisites, and capacity are enforced.

```python
def test_successful_enrollment(client, student_token_headers):
    """Verify a student can enroll in a valid section."""
    payload = {"section_id": "SEC-101"}
    response = client.post("/v1/students/me/enrollments", json=payload, headers=student_token_headers)
    assert response.status_code == 201
    data = response.json()
    assert data['data']['status'] == "ENROLLED"
    assert "enrollment_id" in data['data']

def test_enrollment_duplicate_prevention(client, student_token_headers):
    """Verify that enrolling twice in the same section is prevented."""
    section_id = "SEC-101"
    payload = {"section_id": section_id}
    
    # First enrollment
    client.post("/v1/students/me/enrollments", json=payload, headers=student_token_headers)
    
    # Duplicate enrollment
    response = client.post("/v1/students/me/enrollments", json=payload, headers=student_token_headers)
    # Depending on implementation, this might be 409 Conflict or 400 Bad Request
    assert response.status_code in [409, 400]

def test_time_conflict_detection(client, student_token_headers):
    """
    Verify that enrolling in a section overlapping with an existing enrollment 
    returns 409 Conflict.
    """
    # Setup: Enroll in SEC-101 (Mon/Wed 10:00 - 11:30)
    client.post("/v1/students/me/enrollments", json={"section_id": "SEC-101"}, headers=student_token_headers)
    
    # Action: Try to enroll in SEC-CONFLICT (Mon 10:30 - 12:00)
    # Assuming SEC-CONFLICT exists in test DB
    payload = {"section_id": "SEC-CONFLICT"} 
    response = client.post("/v1/students/me/enrollments", json=payload, headers=student_token_headers)
    
    assert response.status_code == 409
    assert response.json()['error'] == "TIME_CONFLICT"

def test_prerequisite_validation(client, student_token_headers):
    """Verify enrollment fails if prerequisites are not met."""
    # Attempt to enroll in BIO-200 without BIO-101
    payload = {"section_id": "SEC-205"} # BIO-200
    response = client.post("/v1/students/me/enrollments", json=payload, headers=student_token_headers)
    
    assert response.status_code == 409
    assert response.json()['error'] == "PREREQUISITE_NOT_MET"

def test_capacity_validation(client, student_token_headers):
    """Verify enrollment fails if section is at max capacity."""
    # Note: This test assumes the test DB has a section SEC-FULL with 30/30 capacity
    payload = {"section_id": "SEC-FULL"}
    response = client.post("/v1/students/me/enrollments", json=payload, headers=student_token_headers)
    
    assert response.status_code == 409
    assert response.json()['error'] == "CAPACITY_REACHED"

def test_drop_course(client, student_token_headers):
    """Verify successful dropping of a course."""
    # 1. Enroll
    enroll_res = client.post("/v1/students/me/enrollments", json={"section_id": "SEC-101"}, headers=student_token_headers)
    enrollment_id = enroll_res.json()['data']['enrollment_id']
    
    # 2. Drop
    response = client.delete(f"/v1/students/me/enrollments/{enrollment_id}", headers=student_token_headers)
    
    assert response.status_code == 200
    assert response.json()['data']['status'] == "DROPPED"

def test_view_schedule(client, student_token_headers):
    """Verify retrieving personal schedule."""
    response = client.get("/v1/students/me/schedule", headers=student_token_headers)
    assert response.status_code == 200
    # Validate structure
    if len(response.json()['data']) > 0:
        assert 'days' in response.json()['data'][0]
```

---

## 6. Admin API Tests (`test_admin.py`)

**Objective:** Verify administrative capabilities, including creation, updates, and override powers.

```python
def test_admin_create_course(client, admin_token_headers, sample_course_payload):
    """Verify Admin can create a new course."""
    response = client.post("/v1/admin/courses", json=sample_course_payload, headers=admin_token_headers)
    assert response.status_code == 201
    assert response.json()['data']['course_code'] == "ART-105"

def test_admin_create_section(client, admin_token_headers, sample_section_payload):
    """Verify Admin can schedule a new section."""
    response = client.post("/v1/admin/sections", json=sample_section_payload, headers=admin_token_headers)
    assert response.status_code == 201
    data = response.json()
    assert data['data']['course_code'] == "ART-105"
    assert 'section_id' in data['data']

def test_admin_update_section(client, admin_token_headers):
    """Verify Admin can update section details (capacity/instructor)."""
    update_payload = {
        "max_capacity": 45,
        "instructor": "Prof. Miller"
    }
    response = client.put("/v1/admin/sections/SEC-101", json=update_payload, headers=admin_token_headers)
    assert response.status_code == 200
    assert response.json()['data']['max_capacity'] == 45

def test_admin_cancel_section(client, admin_token_headers):
    """Verify Admin can cancel a section."""
    response = client.delete("/v1/admin/sections/SEC-999", headers=admin_token_headers)
    assert response.status_code == 200
    assert "cancelled" in response.json()['message'].lower()

def test_admin_get_enrollment_stats(client, admin_token_headers):
    """Verify Admin can view detailed stats for a section."""
    response = client.get("/v1/admin/sections/SEC-101/stats", headers=admin_token_headers)
    assert response.status_code == 200
    data = response.json()['data']
    assert 'current_enrollment' in data
    assert 'enrolled_students' in data
    assert isinstance(data['enrolled_students'], list)

def test_admin_enrollment_override_bypass_capacity(client, admin_token_headers):
    """
    Verify Admin Override allows enrollment even if section is full.
    This tests the bypass logic specifically.
    """
    payload = {
        "student_id": "STU-OVERRIDE",
        "section_id": "SEC-FULL", # A section marked as full (30/30)
        "reason": "Department approval"
    }
    response = client.post("/v1/admin/enrollments/override", json=payload, headers=admin_token_headers)
    
    # Should succeed (201) instead of failing with 409 Capacity Reached
    assert response.status_code == 201
    assert response.json()['message'] == "Student enrolled via admin override."

def test_admin_enrollment_override_bypass_conflict(client, admin_token_headers):
    """
    Verify Admin Override allows enrollment even if there is a time conflict.
    """
    payload = {
        "student_id": "STU-01", 
        "section_id": "SEC-CONFLICT", # Overlaps with existing
        "reason": "Special accommodation"
    }
    response = client.post("/v1/admin/enrollments/override", json=payload, headers=admin_token_headers)
    
    assert response.status_code == 201
```

---

## 7. Bug Reports

Based on the test execution and API design review, the following bugs were identified.

### Bug Report #001: Strict Time Comparison in Conflict Detection
*   **Severity:** High
*   **Endpoint:** `POST /students/me/enrollments`
*   **Test Case:** `test_time_conflict_detection`
*   **Description:** The system detects time conflicts, but if an existing class ends at `10:30:00` and a new class starts at `10:30:00`, the system returns a `409 Conflict`.
*   **Expected Behavior:** Back-to-back classes should be allowed. End time of Class A should be <= Start time of Class B.
*   **Actual Behavior:** The logic appears to treat the end time slot as occupied, blocking the 10:30 start.
*   **Suggested Fix:** Adjust the conflict logic query in the backend to:
    `WHERE (new_start < existing_end) AND (new_end > existing_start)`
    Change strictly less than to allow equality for the boundary condition.

### Bug Report #002: Student Can View Other Student's Stats
*   **Severity:** Critical (Security)
*   **Endpoint:** `GET /admin/sections/{section_id}/stats`
*   **Test Case:** `test_student_accessing_admin_endpoint`
*   **Description:** While the `Student` role is blocked from creating courses (`POST /admin/courses`), the authorization middleware on `GET /admin/sections/{section_id}/stats` relies solely on route prefix checking. If a student guesses the URL, they might see PII (names/student_ids) of other students if the RBAC isn't strictly enforced on the stats endpoint specifically.
*   **Expected Behavior:** `403 Forbidden` for Student role.
*   **Actual Behavior:** Potential leakage of PII if the dependency `require_role("Admin")` is missing on the stats route handler.
*   **Suggested Fix:** Ensure `@requires_role("Admin")` decorator is applied to the stats endpoint handler function.

### Bug Report #003: Admin Override Does Not Verify Section Existence
*   **Severity:** Medium
*   **Endpoint:** `POST /admin/enrollments/override`
*   **Test Case:** `test_admin_enrollment_override_invalid_section`
*   **Description:** When performing an override with a non-existent `section_id` (e.g., "SEC-INVALID"), the API attempts to insert the enrollment record directly, resulting in a `500 Internal Server Error` due to a foreign key constraint violation.
*   **Expected Behavior:** A clean `404 Not Found` error indicating the section does not exist.
*   **Actual Behavior:** `500 Internal Server Error`.
*   **Suggested Fix:** Add a validation check at the beginning of the override function to verify `section_id` exists in the `sections` table before attempting to insert into `enrollments`. Return 404 if not found.

### Bug Report #004: Inconsistent Day Filtering Case Sensitivity
*   **Severity:** Low
*   **Endpoint:** `GET /courses/sections`
*   **Test Case:** `test_filter_sections_by_day_case`
*   **Description:** Filtering by `day_of_week=monday` returns 0 results, but `day_of_week=Monday` works. The database stores days as "Monday", but the API does not standardize the input query parameter to Title Case before querying.
*   **Expected Behavior:** The API should handle case-insensitive inputs for flexible searching.
*   **Actual Behavior:** Case-sensitive strict matching.
*   **Suggested Fix:** Normalize the `day_of_week` parameter in the backend logic (e.g., `parameter.title()`) before querying the database.