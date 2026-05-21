# Requirements Document: Student Course Selection System

**Version:** 1.0  
**Status:** Draft  
**Author:** Product Manager  
**Date:** October 26, 2023

---

## 1. User Roles

This section defines the primary actors who will interact with the Student Course Selection System.

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| **Student** | An enrolled user eligible to register for classes. | Search/browse courses, view course details, add courses to schedule, drop courses, view personal timetable, check registration status. |
| **Administrator** | A school staff member responsible for managing the course catalog and system settings. | Create/Edit/Delete courses, manage course capacity, set registration periods, view enrollment statistics, manage instructor assignments. |

---

## 2. MVP Feature List

The Minimum Viable Product (MVP) focuses on the core functionality required to successfully register students for classes without manual intervention.

1.  **Authentication:** Secure login for Students and Administrators.
2.  **Course Catalog Management (Admin):** Ability to create courses with details (Name, Code, Credits, Instructor, Schedule, Location, Capacity).
3.  **Course Browsing (Student):** Searchable and filterable list of available courses.
4.  **Real-time Seat Tracking:** Display of current enrollment vs. maximum capacity.
5.  **Registration Engine:** Logic to handle adding courses with validation (conflicts, prerequisites, capacity).
6.  **Conflict Detection:** Automated prevention of scheduling time conflicts.
7.  **Drop Functionality:** Ability for students to remove courses, thereby freeing up capacity.
8.  **Student Schedule View:** A visual calendar or list view of the student's confirmed classes.
9.  **Registration Windows:** Admin controls to open and close the registration period.

---

## 3. Functional Requirements

Requirements are categorized by the specific workflows defined in the task.

### 3.1 Student Course Browsing
*   **REQ-B-01:** The system shall allow students to view a list of all active courses for the current semester.
*   **REQ-B-02:** The system shall provide a search function allowing students to query by Course Code, Course Name, or Instructor Name.
*   **REQ-B-03:** The system shall provide filtering options to narrow courses by Department, Day of the Week, and Time of Day.
*   **REQ-B-04:** The system shall display detailed information for each course, including: Description, Credits, Meeting Times, Location, Instructor, and Prerequisites.
*   **REQ-B-05:** The system shall display the "Available Seats" (Remaining Capacity) versus "Total Capacity" in real-time.

### 3.2 Course Selection
*   **REQ-S-01:** The system shall allow a student to add an available course to their personal schedule.
*   **REQ-S-02:** The system shall verify that the student has met the listed prerequisites before allowing enrollment (logic placeholder: simple check or manual override).
*   **REQ-S-03:** The system shall verify that the course has not reached maximum capacity before allowing enrollment.
*   **REQ-S-04:** The system shall prevent a student from registering for a course if they are already registered for a different course scheduled at the same time.
*   **REQ-S-05:** The system shall decrement the "Available Seats" counter immediately upon successful registration.
*   **REQ-S-06:** The system shall generate a unique confirmation ID for each successful registration transaction.

### 3.3 Course Dropping
*   **REQ-D-01:** The system shall allow a student to remove a course from their schedule (Drop).
*   **REQ-D-02:** The system shall increment the "Available Seats" counter for the dropped course immediately upon successful drop.
*   **REQ-D-03:** The system shall require a confirmation step ("Are you sure?") before processing a course drop to prevent accidental errors.
*   **REQ-D-04:** The system shall retain a record of dropped courses in the student's history for auditing purposes.

### 3.4 Admin Course Management
*   **REQ-A-01:** The system shall allow Administrators to create a new course entry defining all attributes (Code, Title, Schedule, Capacity, etc.).
*   **REQ-A-02:** The system shall allow Administrators to edit existing course details.
*   **REQ-A-03:** The system shall allow Administrators to delete a course *only* if no students are currently enrolled.
*   **REQ-A-04:** The system shall allow Administrators to manually adjust the maximum capacity of a course at any time.
*   **REQ-A-05:** The system shall allow Administrators to view a roster of all students enrolled in a specific course.

### 3.5 Course Conflict Handling
*   **REQ-C-01:** The system shall define a conflict as any overlap in time intervals between an enrolled course and a requested course.
*   **REQ-C-02:** Upon a conflict detection during selection, the system shall display a specific error message: "Schedule Conflict: [Course A] overlaps with [Course B]."
*   **REQ-C-03:** The system shall prevent the transaction from committing until the conflict is resolved (i.e., the conflicting course is dropped).
*   **REQ-C-04:** The system shall allow Administrators to override conflict flags if necessary (e.g., for special permission waivers).

---

## 4. User Stories

The following user stories capture the functionality from the perspective of the end users.

### 4.1 Student Stories
| ID | User Story | Acceptance Criteria |
| :--- | :--- | :--- |
| **US-S-01** | As a **Student**, I want to search for courses by their code so that I can quickly find specific classes I need. | - I can enter "CS101" in the search bar.<br>- Results show only courses matching "CS101". |
| **US-S-02** | As a **Student**, I want to see how many seats are left in a class so that I know if I can still enroll. | - Course list shows "Seats: 5/30".<br>- Number updates in real-time. |
| **US-S-03** | As a **Student**, I want to register for a course so that I can secure my spot for the semester. | - I click "Register" on an open course.<br>- Course moves to "My Schedule".<br>- Seat count decreases by one. |
| **US-S-04** | As a **Student**, I want the system to warn me if I try to register for two classes at the same time so that I don't have scheduling clashes. | - If I try to add Math 101 (10:00 AM) while registered for English 101 (10:00 AM), I see an error message.<br>- English 101 remains on my schedule; Math 101 is not added. |
| **US-S-05** | As a **Student**, I want to drop a course if I decide it is too difficult or not necessary. | - I click "Drop" on a course in "My Schedule".<br>- Course is removed from my view.<br>- Seat count for that course increases by one. |

### 4.2 Admin Stories
| ID | User Story | Acceptance Criteria |
| :--- | :--- | :--- |
| **US-A-01** | As an **Admin**, I want to create a new course for the upcoming semester so that students can enroll in it. | - I can fill in a form with Code, Name, Time, Room, and Capacity.<br>- The course appears in the global search immediately. |
| **US-A-02** | As an **Admin**, I want to view a class roster so that I can see who is enrolled in a specific section. | - I select "History 201".<br>- I see a list of all student names and IDs currently registered. |
| **US-A-03** | As an **Admin**, I want to increase the capacity of a full class so that more students can join if the room allows. | - I edit "Chem 101" capacity from 30 to 35.<br>- The system allows more students to register until 35 is reached. |
| **US-A-04** | As an **Admin**, I want to open and close registration periods so that students cannot register after the deadline. | - I toggle "Registration Status" to "Closed".<br>- Students can no longer click the "Register" button. |

---

*End of Document*