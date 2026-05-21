# API Design Document: Student Course Selection System

| Version | 1.0 |
| :--- | :--- |
| **Status** | Draft |
| **Architect** | AI Assistant (Software Architect) |

---

## 1. Overview

This document details the RESTful API design for the Student Course Selection System MVP. The design follows resource-oriented principles and leverages standard HTTP methods and status codes to facilitate communication between the client (Web/Mobile UI) and the server.

**Base URL:** `https://api.university.edu/v1`

**General Headers:**
*   `Content-Type`: `application/json`
*   `Authorization`: `Bearer {jwt_token}` (Required for all protected endpoints)

**Data Standards:**
*   Dates/Times: ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`) for timestamps, Simple time format (`HH:mm`) for class start/end times.
*   Identifiers: UUID (e.g., `123e4567-e89b-12d3-a456-426614174000`) or Integer IDs. This design uses Integer IDs for simplicity in the MVP.

---

## 2. Authentication APIs

These endpoints handle user authentication for both Students and Administrators.

### 2.1 Login

Authenticates a user and returns a JSON Web Token (JWT) to be used in subsequent requests.

*   **Endpoint:** `POST /auth/login`
*   **Description:** Authenticates a user using their ID and password. Returns a role-based token.
*   **Request Parameters:**
    *   `studentId` (string, required): The unique Student ID or Admin ID.
    *   `password` (string, required): The user's password.
*   **Request Body:**
    ```json
    {
      "studentId": "s123456",
      "password": "securePassword123"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "role": "STUDENT",
      "userId": 101,
      "name": "John Doe"
    }
    ```
*   **Response (401 Unauthorized):**
    ```json
    {
      "error": "Invalid credentials",
      "code": "AUTH_FAILED"
    }
    ```

---

## 3. Student APIs

These endpoints are accessible only to users with the `STUDENT` role.

### 3.1 Get Student Dashboard (Schedule)

Retrieves the currently logged-in student's schedule, enrolled courses, and total credit hours.

*   **Endpoint:** `GET /students/me/schedule`
*   **Description:** Returns a list of enrolled courses with details and calculates total credits.
*   **Request Parameters:** None (uses Auth token).
*   **Response (200 OK):**
    ```json
    {
      "studentId": "s123456",
      "totalCredits": 9,
      "enrolledCourses": [
        {
          "enrollmentId": 501,
          "course": {
            "id": 101,
            "code": "CS101",
            "title": "Intro to Computer Science",
            "instructor": "Dr. Smith",
            "credits": 3,
            "schedule": {
              "days": ["Mon", "Wed", "Fri"],
              "startTime": "09:00",
              "endTime": "10:00",
              "location": "Room 301"
            }
          }
        }
      ]
    }
    ```

### 3.2 Browse Course Catalog

Searches and filters available courses for the semester.

*   **Endpoint:** `GET /courses`
*   **Description:** Returns a paginated list of courses. Supports search and filtering.
*   **Query Parameters:**
    *   `search` (string, optional): Search by Course Code or Title.
    *   `department` (string, optional): Filter by Department code (e.g., CS, MATH).
*   **Response (200 OK):**
    ```json
    {
      "page": 1,
      "totalCount": 50,
      "courses": [
        {
          "id": 205,
          "code": "MATH200",
          "title": "Calculus II",
          "department": "MATH",
          "instructor": "Prof. Alan",
          "credits": 4,
          "schedule": {
            "days": ["Tue", "Thu"],
            "startTime": "14:00",
            "endTime": "15:30",
            "location": "Hall B"
          },
          "capacity": 30,
          "currentEnrollment": 28,
          "seatsAvailable": 2
        }
      ]
    }
    ```

### 3.3 Register for a Course

Adds a course to the student's schedule. Includes validation for time conflicts and capacity.

*   **Endpoint:** `POST /students/me/courses`
*   **Description:** Attempts to register the student for a specific course ID.
*   **Request Parameters:** None.
*   **Request Body:**
    ```json
    {
      "courseId": 205
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "message": "Successfully registered for MATH200",
      "enrollmentId": 502
    }
    ```
*   **Response (409 Conflict - Time Overlap):**
    ```json
    {
      "error": "Registration failed due to time conflict.",
      "details": "MATH200 overlaps with CS101 (Mon, Wed, Fri 09:00-10:00).",
      "code": "SCHEDULE_CONFLICT"
    }
    ```
*   **Response (400 Bad Request - Capacity Full):**
    ```json
    {
      "error": "Course is full.",
      "details": "MATH200 has reached its maximum capacity.",
      "code": "COURSE_FULL"
    }
    ```

### 3.4 Drop a Course

Removes a course from the student's schedule.

*   **Endpoint:** `DELETE /students/me/courses/{courseId}`
*   **Description:** Removes the student from the specified course. Increments available seats.
*   **Path Parameters:**
    *   `courseId` (integer): The ID of the course to drop.
*   **Response (200 OK):**
    ```json
    {
      "message": "Successfully dropped MATH200",
      "newTotalCredits": 5
    }
    ```
*   **Response (400 Bad Request - Min Credits):**
    ```json
    {
      "error": "Cannot drop course.",
      "details": "Dropping this course will bring your total credits below the minimum (12) required for full-time status.",
      "code": "MIN_CREDIT_VIOLATION"
    }
    ```

---

## 4. Admin APIs

These endpoints are accessible only to users with the `ADMINISTRATOR` role.

### 4.1 Create a New Course

Creates a new entry in the course catalog.

*   **Endpoint:** `POST /admin/courses`
*   **Description:** Adds a new course with specific scheduling and capacity constraints.
*   **Request Parameters:** None.
*   **Request Body:**
    ```json
    {
      "code": "ENG301",
      "title": "Advanced Writing",
      "department": "ENG",
      "instructor": "Prof. Woolf",
      "credits": 3,
      "capacity": 25,
      "schedule": {
        "days": ["Mon", "Wed"],
        "startTime": "13:00",
        "endTime": "14:30",
        "location": "Library 204"
      }
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "id": 301,
      "code": "ENG301",
      "message": "Course created successfully"
    }
    ```

### 4.2 Update Course Details

Modifies details of an existing course (e.g., time, room, capacity).

*   **Endpoint:** `PUT /admin/courses/{courseId}`
*   **Description:** Updates course attributes.
*   **Path Parameters:**
    *   `courseId` (integer): The ID of the course to update.
*   **Request Body:**
    ```json
    {
      "location": "Science Lab 1",
      "capacity": 30
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "id": 301,
      "code": "ENG301",
      "message": "Course updated successfully"
    }
    ```

### 4.3 Delete a Course

Deletes a course from the catalog. Restricted if students are enrolled.

*   **Endpoint:** `DELETE /admin/courses/{courseId}`
*   **Description:** Permanently removes a course. Fails if `currentEnrollment > 0`.
*   **Path Parameters:**
    *   `courseId` (integer): The ID of the course to delete.
*   **Response (200 OK):**
    ```json
    {
      "message": "Course ENG301 deleted successfully"
    }
    ```
*   **Response (409 Conflict):**
    ```json
    {
      "error": "Cannot delete course.",
      "details": "There are currently 5 students enrolled in this course.",
      "code": "COURSE_NOT_EMPTY"
    }
    ```

### 4.4 Get Enrollment Report

Retrieves enrollment metrics for all courses.

*   **Endpoint:** `GET /admin/reports/enrollments`
*   **Description:** Returns a list of courses with current enrollment statistics.
*   **Response (200 OK):**
    ```json
    {
      "generatedAt": "2023-10-01T10:00:00Z",
      "reportData": [
        {
          "courseId": 101,
          "code": "CS101",
          "title": "Intro to Computer Science",
          "capacity": 30,
          "currentEnrollment": 30,
          "isFull": true
        },
        {
          "courseId": 205,
          "code": "MATH200",
          "title": "Calculus II",
          "capacity": 30,
          "currentEnrollment": 15,
          "isFull": false
        }
      ]
    }
    ```