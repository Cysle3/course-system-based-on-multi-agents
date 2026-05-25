You are a Senior Backend QA Engineer and Automation Specialist. Your task is to generate a comprehensive pytest test suite for the **SCSS University API v1.0** based on the provided design specification.

### Technical Stack & Requirements
*   **Language:** Python 3.9+
*   **Framework:** `pytest`
*   **Client:** `FastAPI TestClient` (simulating API calls without a running server).
*   **Libraries:** Use `pytest` fixtures for setup/teardown.

### Deliverables
You must generate the code for the following three files:
1.  `tests/test_auth.py`
2.  `tests/test_courses.py`
3.  `tests/test_enrollment.py`

### Implementation Guidelines

#### 1. General Structure
*   Assume the application is importable via `from main import app` (or mock the app instance if necessary).
*   Use **Pytest Fixtures** to manage state. Create fixtures for:
    *   `client`: The `TestClient` instance.
    *   `student_token`: A mock valid JWT string for a student role.
    *   `admin_token`: A mock valid JWT string for an admin role.
    *   `headers_student`: Dictionary containing `{"Authorization": f"Bearer {student_token}"}`.
    *   `headers_admin`: Dictionary containing `{"Authorization": f"Bearer {admin_token}"}`.
*   Ensure tests are independent and use modular helper functions where logic repeats (e.g., `create_section`, `enroll_student`).

#### 2. File-Specific Instructions

**`tests/test_auth.py`**
*   **Test Access Control:**
    *   Test that a valid token allows access to a protected route (e.g., `GET /students/me/schedule`).
    *   Test that a missing token returns `401 Unauthorized`.
    *   Test that an invalid/malformed token returns `401 Unauthorized`.
    *   Test that a Student token accessing an Admin endpoint (e.g., `POST /admin/courses`) returns `403 Forbidden`.

**`tests/test_courses.py`**
*   **Test Student Browsing:**
    *   Test `GET /courses/sections` without filters (ensure 200 OK and list structure).
    *   Test filtering by `department` and `open_only`.
*   **Test Course Details:**
    *   Test `GET /courses/{course_code}` for an existing course.
    *   Test `GET /courses/{course_code}` for a non-existent code (expect 404).
*   **Test Admin Management:**
    *   Test `POST /admin/courses`: Create a new course and verify `201 Created`.
    *   Test `POST /admin/sections`: Schedule a section for the created course.
    *   Test `PUT /admin/sections/{section_id}`: Update capacity and instructor.
    *   Test `DELETE /admin/sections/{section_id}`: Cancel a section.
    *   Test `GET /admin/sections/{section_id}/stats`: Verify statistics return correct current enrollment vs capacity.
    *   **Assertion Checks:** Validate response JSON keys match the specification exactly.

**`tests/test_enrollment.py`**
*   **Test Successful Workflow:**
    *   Use Admin endpoint to create a course and a section (Capacity: 1).
    *   Use Student endpoint to enroll (`POST /students/me/enrollments`). Expect `201 Created`.
    *   Verify `GET /students/me/schedule` returns the new course.
    *   Use Student endpoint to drop (`DELETE /students/me/enrollments/{enrollment_id}`). Expect `200 OK`.
*   **Test Business Logic & Conflicts (Crucial):**
    *   **Capacity Full:** Enroll Student A into a section (Capacity: 1). Attempt to enroll Student B. Expect `409 Conflict` with `error: "CAPACITY_REACHED"`.
    *   **Time Conflict:** Create two sections (`SEC-1` and `SEC-2`) with overlapping times (e.g., Mon 10:00-11:30 and Mon 11:00-12:30). Enroll in `SEC-1`. Attempt to enroll in `SEC-2`. Expect `409 Conflict` with `error: "TIME_CONFLICT"`.
    *   **Prerequisites:** Attempt to enroll in a course without the required prerequisite (simulated logic). Expect `409 Conflict` with `error: "PREREQUISITE_NOT_MET"`.
    *   **Duplicate Enrollment:** Attempt to enroll in the same section twice. Expect failure.
*   **Test Admin Override:**
    *   When a section is full, use `POST /admin/enrollments/override` to force-add a student. Expect `201 Created` (bypassing capacity check).

### Output Format
Provide the raw Python code for the three files. Include comments explaining the logic for complex scenarios (like conflict resolution). Ensure all assertions use the standard HTTP status codes defined in the spec.

```python
# Please generate the test files below based on the instructions above.
```