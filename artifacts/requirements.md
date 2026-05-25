# Product Requirements Document (PRD)
**Project Name:** Student Course Selection System (SCSS)
**Version:** 1.0
**Status:** Draft
**Author:** Product Manager

## 1. Introduction
This document outlines the requirements for the **Student Course Selection System (SCSS)**. The system is designed to facilitate the academic registration process, allowing students to browse available classes, build their schedules, and manage their enrollments. It also provides administrators with the tools to manage the course catalog and monitor student registrations. The system includes automated logic to detect scheduling conflicts and enforce prerequisites.

---

## 2. User Roles

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| **Student** | An enrolled user selecting classes for an upcoming term. | Browse catalog, View course details, Add courses to schedule, Drop courses, View personal timetable. |
| **Administrator** | A staff member responsible for managing the course database. | Create/Update/Delete Courses, Create/Update/Delete Course Sections, Manage instructors, View enrollment statistics, Override capacity limits. |

---

## 3. Functional Requirements

### 3.1 Student Course Browsing
**FR-BROWSE-01:** The system shall display a searchable list of available courses for the active term.
**FR-BROWSE-02:** The system shall allow users to filter courses by Department, Course Code, Day of the Week, and Time of Day.
**FR-BROWSE-03:** The system shall display detailed information for a selected course, including:
*   Course Code and Title
*   Description
*   Credit Hours
*   Prerequisites
*   Instructor Name
*   Location
*   Meeting Days and Times
*   Current Enrollment vs. Max Capacity

### 3.2 Course Selection (Registration)
**FR-SELECT-01:** The system shall allow a student to add a course section to their personal schedule.
**FR-SELECT-02:** The system shall verify that the student meets all prerequisites before allowing enrollment.
**FR-SELECT-03:** The system shall verify that the course has not reached its maximum capacity before allowing enrollment.
**FR-SELECT-04:** The system shall present a success or error message upon attempting to add a course.
**FR-SELECT-05:** The system shall prevent a student from enrolling in the same course code more than once (unless defined as a repeatable course).

### 3.3 Course Dropping
**FR-DROP-01:** The system shall allow a student to remove a course section from their personal schedule.
**FR-DROP-02:** The system shall require a confirmation action ("Are you sure?") before a course is dropped.
**FR-DROP-03:** Upon dropping a course, the system shall immediately update the "Current Enrollment" count for that section, making the seat available to other students.
**FR-DROP-04:** The system shall maintain a historical log of dropped courses for the student's record.

### 3.4 Admin Course Management
**FR-ADMIN-01:** The system shall allow Administrators to create new Courses (defining the generic subject matter, code, and description).
**FR-ADMIN-02:** The system shall allow Administrators to create new Course Sections (specific instances of a course with specific times, rooms, and instructors).
**FR-ADMIN-03:** The system shall allow Administrators to edit the Max Capacity of a section.
**FR-ADMIN-04:** The system shall allow Administrators to deactivate or cancel a section, which automatically notifies enrolled students.

### 3.5 Course Conflict Handling
**FR-CONFLICT-01:** The system shall detect **Time Conflicts**: A student cannot enroll in Section A if it overlaps in time and day with Section B.
**FR-CONFLICT-02:** The system shall detect **Prerequisite Conflicts**: The system must check the student's academic history to ensure required prior courses have been passed.
**FR-CONFLICT-03:** The system shall detect **Capacity Conflicts**: If Current Enrollment >= Max Capacity, the add request is rejected.
**FR-CONFLICT-04:** If a conflict is detected, the system shall display a specific error message explaining the nature of the conflict (e.g., "Time conflict with CS-101," "Missing Prerequisite MATH-101").

---

## 4. User Stories

### 4.1 Student User Stories
*   **US-STU-01 (Browsing):** As a **Student**, I want to **search for courses by department**, so that I can find all classes offered by the Biology department.
*   **US-STU-02 (View Details):** As a **Student**, I want to **view the syllabus and prerequisites**, so that I can ensure I am prepared for the class workload.
*   **US-STU-03 (Add Course):** As a **Student**, I want to **add a class to my schedule**, so that I can secure my spot for the upcoming semester.
*   **US-STU-04 (Conflict Prevention):** As a **Student**, I want the system to **warn me if I try to add two classes at the same time**, so that I don't accidentally double-book myself.
*   **US-STU-05 (Drop Course):** As a **Student**, I want to **drop a class I no longer wish to take**, so that I can free up time in my schedule and avoid a bad grade.
*   **US-STU-06 (View Schedule):** As a **Student**, I want to **view my weekly calendar grid**, so that I can visualize my workload.

### 4.2 Administrator User Stories
*   **US-ADM-01 (Create Course):** As an **Admin**, I want to **add a new course to the catalog**, so that it is available for students to find.
*   **US-ADM-02 (Schedule Section):** As an **Admin**, I want to **schedule a specific section of a course in a specific room at a specific time**, so that students know where and when to go.
*   **US-ADM-03 (Set Capacity):** As an **Admin**, I want to **set the maximum number of students for a class**, so that the room doesn't become overcrowded.
*   **US-ADM-04 (Monitor Enrollment):** As an **Admin**, I want to **see how many students are enrolled in each section**, so that I can decide if I need to open more sections.

---

## 5. MVP Feature List

The Minimum Viable Product (MVP) will focus on the core flow of Admin setting up courses and Students successfully adding/dropping them with conflict validation.

### Phase 1: Core Infrastructure & Admin Setup
1.  **Role Management:** Basic login and role differentiation (Student vs. Admin).
2.  **Course Catalog Database:** Backend structure to store Course and Section data.
3.  **Admin Course Management:**
    *   Create Courses (Code, Title, Credits).
    *   Create Sections (Time, Room, Instructor, Capacity).
    *   Edit/Delete capabilities.

### Phase 2: Student Browsing & Viewing
1.  **Course Search/Filter UI:** List view of all available sections.
2.  **Course Detail View:** Modal or page showing all section details (FR-BROWSE-03).
3.  **Personal Schedule View:** A read-only view of the student's currently enrolled classes.

### Phase 3: Selection Logic & Conflict Handling
1.  **Add to Cart/Register:** Button functionality to add a section.
2.  **Time Conflict Engine:** Algorithm to compare new section times against existing student schedule (FR-CONFLICT-01).
3.  **Capacity Check:** Real-time counter check (FR-CONFLICT-03).
4.  **Error Messaging:** UI feedback for conflicts (FR-CONFLICT-04).

### Phase 4: Drop & Management
1.  **Drop Functionality:** Ability to remove a section (FR-DROP-01).
2.  **Capacity Reversion:** Logic to increment available seats when a student drops (FR-DROP-03).
3.  **Admin Override (Bonus):** Simple button for Admin to force-add a student past capacity/conflicts (essential for real-world operations).

---

*End of Document*