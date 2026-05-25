# SCSS API Design Specification

**Version:** 1.0  
**Status:** Draft  
**Architect:** Software Architect  

## 1. General Information

### 1.1 Base URL
All API endpoints are prefixed with the versioning path:
```
https://api.scss-university.edu/v1
```

### 1.2 Authentication
The system uses **Bearer Token Authentication** (JWT). Clients must include the `Authorization` header with every request.
```
Authorization: Bearer <access_token>
```
*Tokens contain claims for `user_id` and `role` (Student/Admin).*

### 1.3 Data Formats
*   **Request Content-Type:** `application/json`
*   **Response Content-Type:** `application/json`
*   **Date Format:** ISO 8601 (e.g., `2023-09-01T14:00:00Z`)

### 1.4 Standard HTTP Status Codes
*   `200 OK`: Request succeeded.
*   `201 Created`: Resource created successfully.
*   `400 Bad Request`: Invalid input data.
*   `401 Unauthorized`: Missing or invalid authentication token.
*   `403 Forbidden`: User lacks permission (e.g., Student accessing Admin endpoints).
*   `404 Not Found`: Resource not found.
*   `409 Conflict`: Business logic violation (e.g., Time conflict, Capacity full).
*   `500 Internal Server Error`: Unexpected server error.

---

## 2. Student APIs

These endpoints are accessible by users with the `Student` role.

### 2.1 Search and Browse Courses
Retrieves a list of available course sections for the active term with filtering capabilities.

*   **Endpoint:** `GET /courses/sections`
*   **Description:** Search available sections based on various filters.
*   **Query Parameters:**
    | Parameter | Type | Required | Description |
    | :--- | :--- | :--- | :--- |
    | `department` | String | No | Filter by department code (e.g., "CS", "BIO"). |
    | `course_code` | String | No | Filter by course code (e.g., "101"). |
    | `day_of_week` | String | No | Filter by day (e.g., "Monday", "Tuesday"). |
    | `start_time` | Time | No | Filter for sections starting after this time. |
    | `open_only` | Boolean | No | If `true`, returns only sections with `current_enrollment < max_capacity`. |

*   **Response Example:** `200 OK`
```json
{
  "data": [
    {
      "section_id": "SEC-101",
      "course_code": "CS-101",
      "title": "Intro to Computer Science",
      "credits": 3,
      "instructor": "Dr. Smith",
      "location": "Room 304",
      "days": ["Monday", "Wednesday"],
      "start_time": "10:00:00",
      "end_time": "11:30:00",
      "current_enrollment": 28,
      "max_capacity": 30,
      "prerequisites": []
    },
    {
      "section_id": "SEC-205",
      "course_code": "BIO-200",
      "title": "Advanced Biology",
      "credits": 4,
      "instructor": "Dr. Jones",
      "location": "Lab 2",
      "days": ["Tuesday", "Thursday"],
      "start_time": "13:00:00",
      "end_time": "15:00:00",
      "current_enrollment": 20,
      "max_capacity": 20,
      "prerequisites": ["BIO-101"]
    }
  ],
  "meta": {
    "page": 1,
    "total_results": 2
  }
}
```

### 2.2 Get Course Details
Retrieves detailed information about a specific course, including description and prerequisites.

*   **Endpoint:** `GET /courses/{course_code}`
*   **Path Parameters:**
    *   `course_code` (String): The unique code of the course (e.g., "CS-101").

*   **Response Example:** `200 OK`
```json
{
  "data": {
    "course_code": "CS-101",
    "title": "Intro to Computer Science",
    "description": "An introduction to fundamental programming concepts.",
    "credits": 3,
    "prerequisites": [],
    "offerings": [
      {
        "section_id": "SEC-101",
        "days": ["Monday", "Wednesday"],
        "start_time": "10:00:00",
        "instructor": "Dr. Smith"
      }
    ]
  }
}
```

### 2.3 View Student Schedule
Retrieves the currently enrolled sections for the authenticated student.

*   **Endpoint:** `GET /students/me/schedule`
*   **Description:** Returns the student's personal timetable.

*   **Response Example:** `200 OK`
```json
{
  "data": [
    {
      "enrollment_id": "ENR-8891",
      "section_id": "SEC-101",
      "course_code": "CS-101",
      "title": "Intro to Computer Science",
      "days": ["Monday", "Wednesday"],
      "start_time": "10:00:00",
      "end_time": "11:30:00",
      "location": "Room 304"
    }
  ]
}
```

### 2.4 Register for Course (Add Course)
Attempts to add a section to the student's schedule. Performs conflict, prerequisite, and capacity checks.

*   **Endpoint:** `POST /students/me/enrollments`
*   **Description:** Enrolls the student in a specific section.
*   **Request Body:**
```json
{
  "section_id": "SEC-101"
}
```

*   **Success Response:** `201 Created`
```json
{
  "message": "Successfully enrolled in CS-101",
  "data": {
    "enrollment_id": "ENR-9001",
    "section_id": "SEC-101",
    "status": "ENROLLED"
  }
}
```

*   **Error Responses:**
    *   `409 Conflict` (Time Conflict)
    ```json
    {
      "error": "TIME_CONFLICT",
      "message": "Unable to enroll: Time conflict with existing enrollment in MATH-101."
    }
    ```
    *   `409 Conflict` (Prerequisite Missing)
    ```json
    {
      "error": "PREREQUISITE_NOT_MET",
      "message": "Missing prerequisite: CS-100 must be completed before enrolling in CS-101."
    }
    ```
    *   `409 Conflict` (Capacity Full)
    ```json
    {
      "error": "CAPACITY_REACHED",
      "message": "This section is full (30/30 students enrolled)."
    }
    ```

### 2.5 Drop Course
Removes a section from the student's schedule and updates the available seat count.

*   **Endpoint:** `DELETE /students/me/enrollments/{enrollment_id}`
*   **Path Parameters:**
    *   `enrollment_id` (String): The ID of the enrollment record.

*   **Response Example:** `200 OK`
```json
{
  "message": "Course dropped successfully.",
  "data": {
    "dropped_section_id": "SEC-101",
    "status": "DROPPED"
  }
}
```

---

## 3. Admin APIs

These endpoints are accessible by users with the `Admin` role.

### 3.1 Create Course
Adds a new course to the general catalog.

*   **Endpoint:** `POST /admin/courses`
*   **Description:** Creates a generic course definition (not a scheduled section).
*   **Request Body:**
```json
{
  "course_code": "HIST-202",
  "title": "Modern History",
  "description": "A survey of modern global history.",
  "credits": 3,
  "prerequisites": ["HIST-101"]
}
```

*   **Response Example:** `201 Created`
```json
{
  "message": "Course created successfully.",
  "data": {
    "course_code": "HIST-202",
    "title": "Modern History",
    "created_at": "2023-10-15T09:00:00Z"
  }
}
```

### 3.2 Create Course Section
Schedules a specific instance of a course (Term, Room, Time, Instructor).

*   **Endpoint:** `POST /admin/sections`
*   **Description:** Creates a new section for a given course code.
*   **Request Body:**
```json
{
  "course_code": "HIST-202",
  "term": "FALL_2024",
  "instructor": "Prof. Davis",
  "location": "Hall A",
  "days": ["Friday"],
  "start_time": "09:00:00",
  "end_time": "12:00:00",
  "max_capacity": 50
}
```

*   **Response Example:** `201 Created`
```json
{
  "message": "Section created successfully.",
  "data": {
    "section_id": "SEC-999",
    "course_code": "HIST-202",
    "term": "FALL_2024"
  }
}
```

### 3.3 Update Section Details
Updates capacity, instructor, or location for a specific section.

*   **Endpoint:** `PUT /admin/sections/{section_id}`
*   **Path Parameters:**
    *   `section_id` (String): The ID of the section to update.
*   **Request Body:**
```json
{
  "max_capacity": 45,
  "instructor": "Prof. Miller"
}
```

*   **Response Example:** `200 OK`
```json
{
  "message": "Section updated.",
  "data": {
    "section_id": "SEC-999",
    "max_capacity": 45,
    "instructor": "Prof. Miller"
  }
}
```

### 3.4 Cancel/Deactivate Section
Cancels a section. This effectively removes it from the browse list and triggers notifications to enrolled students.

*   **Endpoint:** `DELETE /admin/sections/{section_id}`
*   **Path Parameters:**
    *   `section_id` (String): The ID of the section to cancel.

*   **Response Example:** `200 OK`
```json
{
  "message": "Section SEC-999 has been cancelled and notifications sent to 5 enrolled students."
}
```

### 3.5 View Enrollment Statistics
Retrieves enrollment data for a specific section.

*   **Endpoint:** `GET /admin/sections/{section_id}/stats`
*   **Path Parameters:**
    *   `section_id` (String): The ID of the section.

*   **Response Example:** `200 OK`
```json
{
  "data": {
    "section_id": "SEC-101",
    "course_code": "CS-101",
    "max_capacity": 30,
    "current_enrollment": 28,
    "waitlist_count": 0,
    "enrolled_students": [
      {
        "student_id": "STU-01",
        "name": "John Doe",
        "enrollment_date": "2023-11-01T10:00:00Z"
      }
    ]
  }
}
```

### 3.6 Admin Enrollment Override
Allows an admin to forcibly enroll a student in a section, bypassing capacity and conflict checks.

*   **Endpoint:** `POST /admin/enrollments/override`
*   **Description:** Force-adds a student to a section.
*   **Request Body:**
```json
{
  "student_id": "STU-01",
  "section_id": "SEC-101",
  "reason": "Department approval"
}
```

*   **Response Example:** `201 Created`
```json
{
  "message": "Student enrolled via admin override.",
  "data": {
    "enrollment_id": "ENR-7777",
    "status": "ENROLLED"
  }
}
```