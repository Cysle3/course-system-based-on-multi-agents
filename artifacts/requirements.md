# Requirements Document: Student Course Selection System

**Version:** 1.0  
**Status:** Draft  
**Product Manager:** AI Assistant  

---

## 1. Introduction
This document outlines the requirements for a Minimum Viable Product (MVP) of a Student Course Selection System. The system is designed to facilitate the discovery, registration, and management of student course loads while providing administrators with the tools to manage course offerings and constraints. The system prioritizes data integrity, specifically regarding scheduling conflicts and course capacity limits.

---

## 2. User Roles

| Role | Description |
| :--- | :--- |
| **Student** | An authenticated user who browses the course catalog, registers for classes, manages their schedule, and drops courses. |
| **Administrator** | An authenticated user responsible for managing the course catalog, setting capacity limits, scheduling, and monitoring enrollment metrics. |

---

## 3. MVP Feature List

The MVP will focus on the core functionality required to successfully enroll students in classes without scheduling errors or overbooking.

1.  **Authentication System:** Secure login for Students and Administrators.
2.  **Course Catalog:** A searchable and filterable list of available courses.
3.  **Student Dashboard:** A view of the student's current enrolled courses and total credit hours.
4.  **Course Registration:** The ability for students to add a course to their schedule.
5.  **Course Drop:** The ability for students to remove a course from their schedule.
6.  **Admin Course Management:** Create, Read, Update, and Delete (CRUD) operations for course listings (Schedule, Capacity, Title, Instructor).
7.  **Conflict Engine:** Automated validation to prevent time conflicts (overlapping classes) and capacity breaches (waitlisting is *out of scope* for MVP).

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization
*   **FR-01:** The system shall allow Students to log in using a unique Student ID and password.
*   **FR-02:** The system shall allow Administrators to log in using a unique Admin ID and password.
*   **FR-03:** The system shall restrict access to Admin-specific features to users logged in with the Administrator role.

### 4.2 Student Course Browsing
*   **FR-04:** The system shall display a list of all active courses for the current semester.
*   **FR-05:** The system shall allow students to filter courses by Department (e.g., CS, MATH, ENG).
*   **FR-06:** The system shall allow students to search courses by Course Code or Title.
*   **FR-07:** The system shall display the following details for each course:
    *   Course Code & Title
    *   Instructor Name
    *   Days of the week and Time (Start/End)
    *   Location
    *   Credit Hours
    *   Current Enrollment vs. Max Capacity

### 4.3 Course Selection (Registration)
*   **FR-08:** The system shall allow a student to select a course from the catalog and add it to their personal schedule.
*   **FR-09 (Conflict Handling):** The system shall prevent a student from adding a course if its meeting times overlap with any course already in the student's schedule.
*   **FR-10 (Conflict Handling):** The system shall prevent a student from adding a course if the current enrollment count has reached the maximum capacity.
*   **FR-11:** The system shall provide a clear error message if a course selection fails due to a conflict or capacity limit.
*   **FR-12:** Upon successful addition, the system shall update the course's "Current Enrollment" count in real-time.

### 4.4 Course Dropping
*   **FR-13:** The system shall allow a student to remove a course from their current schedule.
*   **FR-14:** Upon successful removal, the system shall decrement the course's "Current Enrollment" count in real-time.
*   **FR-15:** The system shall prevent a student from dropping a course if it results in a credit load below the university minimum (e.g., 12 credits for full-time status), with a confirmation warning.

### 4.5 Admin Course Management
*   **FR-16:** The system shall allow Administrators to create a new course entry by defining all required attributes (Code, Title, Schedule, Instructor, Capacity).
*   **FR-17:** The system shall allow Administrators to edit the details of an existing course (e.g., changing a room or time).
*   **FR-18:** The system shall allow Administrators to delete a course *only* if no students are currently enrolled in it.
*   **FR-19:** The system shall provide an "Enrollment Report" showing the total number of students enrolled in each course.

---

## 5. User Stories

### 5.1 Student User Stories

| ID | Story | Acceptance Criteria |
| :--- | :--- | :--- |
| **US-S-01** | As a **Student**, I want to **search for courses by keyword** so that I can find specific subjects I am interested in. | - Input field accepts text.<br>- Results list updates dynamically or upon submission to show matching courses. |
| **US-S-02** | As a **Student**, I want to **view the details of a course** so that I can understand when and where it meets. | - Clicking a course reveals days, times, room, and instructor info.<br>- I can see how many seats are left. |
| **US-S-03** | As a **Student**, I want to **register for a class** so that I can secure my spot for the semester. | - I can click "Add" on a course listing.<br>- If successful, the course appears in my "My Schedule" view.<br>- The seat count for the course decreases by one. |
| **US-S-04** | As a **Student**, I want the **system to warn me if I have a time conflict** so that I do not accidentally register for two overlapping classes. | - If I try to add Class A (Mon 10:00-11:00) while I have Class B (Mon 10:30-11:30), an error appears: "Time conflict with Class B."<br>- Class A is not added to my schedule. |
| **US-S-05** | As a **Student**, I want to **drop a class** so that I can adjust my schedule if my plans change. | - I can click "Drop" on a course in "My Schedule."<br>- The course is removed from my view.<br>- The seat count for the course increases by one. |
| **US-S-06** | As a **Student**, I want to **see my total credit hours** so that I know if I am a full-time student. | - "My Schedule" displays a sum of credits for all enrolled courses. |

### 5.2 Admin User Stories

| ID | Story | Acceptance Criteria |
| :--- | :--- | :--- |
| **US-A-01** | As an **Administrator**, I want to **create a new course** so that it is available for students to register. | - I can enter Course Code, Title, Instructor, Schedule, and Max Capacity.<br>- The course appears in the global catalog immediately upon saving. |
| **US-A-02** | As an **Administrator**, I want to **set a maximum capacity** for a course so that the classroom is not overcrowded. | - I can input an integer for "Max Seats."<br>- Once enrollment hits this number, students receive a "Course Full" error. |
| **US-A-03** | As an **Administrator**, I want to **modify the schedule of a course** so that I can fix room or time errors. | - I can edit the time/day fields of an existing course.<br>- The system saves the new schedule (Conflict checking for existing students is *out of scope* for MVP, but admin is warned to notify students). |
| **US-A-04** | As an **Administrator**, I want to **view enrollment numbers** so that I can see which classes are popular or full. | - The course list shows a column with "Enrolled / Capacity". |