# Backend Development Prompt: SCSS Course Selection System

## Role & Objective
You are a Senior Backend Engineer specializing in **FastAPI** and **SQLAlchemy**. Your task is to implement the backend for the **SCSS (Student Course Selection System)** based on the provided API Design Specification v1.0.

You must build a robust, modular, and clean backend service that handles course selection, administrative management, and conflict detection logic.

---

## Technology Stack
*   **Framework:** FastAPI
*   **Database:** SQLite (via SQLAlchemy ORM)
*   **Validation:** Pydantic
*   **Server:** Uvicorn

---

## Project Structure
You must generate the following files inside a `backend/` directory. Ensure strict adherence to this structure:

1.  `main.py`: Application entry point, API routers, and dependency injection.
2.  `database.py`: Database connection setup and session management.
3.  `models.py`: SQLAlchemy ORM models.
4.  `schemas.py`: Pydantic models for request/response validation.
5.  `crud.py`: All database interaction logic (Create, Read, Update, Delete).
6.  `requirements.txt`: List of dependencies.

---

## Database Schema & Modeling
**Important:** While the general logic is provided, you must refine the database schema to accurately support the API requirement of distinguishing between **Courses** (catalog definitions) and **Sections** (scheduled instances).

Define the following models in `models.py`:

1.  **Student**: `student_id` (PK), `first_name`, `last_name`, `email`.
2.  **Course**: `course_code` (PK), `title`, `description`, `credits`, `prerequisites` (JSON/Text list of course codes).
3.  **Section**: `section_id` (PK), `course_code` (FK), `term`, `instructor`, `location`, `days` (JSON list), `start_time`, `end_time`, `max_capacity`, `current_enrollment`.
4.  **Enrollment**: `enrollment_id` (PK), `student_id` (FK), `section_id` (FK), `status`, `enrollment_date`.

Ensure proper foreign key relationships are defined in SQLAlchemy.

---

## API Implementation Requirements

### General
*   **Base Path:** All routes must be prefixed with `/v1`.
*   **Authentication:** Implement a mock authentication dependency. Extract a `user_id` and `role` ('Student' or 'Admin') from the `Authorization` header (Assume a Bearer token format is sent, but for this backend task, you may mock the decoding or simply accept a header value for demonstration).
*   **Error Handling:** Return standard HTTP status codes (400, 401, 403, 404, 409, 500) with JSON error messages as defined in the spec.

### Student Endpoints (`/v1/students/me/...`, `/v1/courses/...`)
1.  `GET /courses/sections`: Query with filters (`department`, `course_code`, `day_of_week`, `open_only`).
2.  `GET /courses/{course_code}`: Retrieve course details and prerequisites.
3.  `GET /students/me/schedule`: Retrieve the authenticated student's enrolled sections.
4.  `POST /students/me/enrollments`:
    *   Input: `section_id`.
    *   **Logic:** Check for Capacity (`current_enrollment < max_capacity`), Prerequisites (Student must have completed prereqs - assume this data exists or mock the check logic based on previous enrollments), and **Time Conflicts**.
    *   **Time Conflict Logic:** Compare the new section's days/times with all existing enrollments for the student. If overlap is detected, return `409 Conflict`.
5.  `DELETE /students/me/enrollments/{enrollment_id}`: Remove enrollment and decrement section capacity.

### Admin Endpoints (`/v1/admin/...`)
1.  `POST /admin/courses`: Create a new course definition.
2.  `POST /admin/sections`: Create a new section for a specific term/course.
3.  `PUT /admin/sections/{section_id}`: Update details (capacity, instructor, location).
4.  `DELETE /admin/sections/{section_id}`: Cancel a section (delete or mark inactive).
5.  `GET /admin/sections/{section_id}/stats`: View enrollment stats and list of enrolled students.
6.  `POST /admin/enrollments/override`: Force enroll a student. **Bypass** capacity and conflict checks.

---

## File-by-File Instructions

### 1. `requirements.txt`
Include: `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`.

### 2. `database.py`
*   Setup `create_engine` for `sqlite:///./scss.db`.
*   Setup `sessionmaker` and `SessionLocal`.
*   Create a `Base` class.
*   Include a function `get_db` to yield database sessions.

### 3. `models.py`
*   Import `Base` from `database.py`.
*   Define the classes as per the schema instructions above.
*   Use appropriate SQLAlchemy Column types (String, Integer, DateTime, etc.).

### 4. `schemas.py`
*   Define Pydantic `BaseModel` classes for all Request bodies and Response bodies listed in the SCSS API Design.
*   Ensure fields match the JSON examples exactly (e.g., `section_id`, `start_time`).
*   Create separate schemas for creation (inputs) and responses (outputs) where necessary to handle read-only fields like `id` or `enrollment_date`.

### 5. `crud.py`
*   **`get_courses`**: Filter logic.
*   **`get_section_by_id`**: Fetch specific section.
*   **`check_conflict`**: Helper function taking `student_id` and `new_section`. Query student's current enrollments, join with sections, compare time/days. Return `True` if conflict exists.
*   **`enroll_student`**:
    *   Get section.
    *   Check capacity.
    *   Check prerequisites (Mock this: check if student has enrollments in required course codes).
    *   Check `check_conflict`.
    *   If all pass, create enrollment record and increment `current_enrollment` in section.
*   **`drop_student`**: Delete enrollment, decrement `current_enrollment`.
*   **`admin_create_course`, `admin_create_section`, `admin_update_section`**.
*   **`admin_force_enroll`**: Create enrollment, increment capacity, do *not* check conflicts/capacity.

### 6. `main.py`
*   Initialize FastAPI app.
*   Include startup event to create tables (`Base.metadata.create_all(bind=engine)`).
*   Create the router endpoints defined in the "API Implementation Requirements".
*   Inject the `db` session using the `get_db` dependency.
*   Use the mock authentication dependency to protect routes (e.g., `Depends(verify_token)`).

---

## Execution Step
Generate the complete code for the 6 files listed above. Ensure the code is production-ready, type-hinted, and includes necessary imports. Do not summarize; output the full file contents.