# Software Architecture Design Document (SADD)
**Project Name:** Student Course Selection System (SCSS)
**Version:** 1.0
**Status:** Design Phase
**Author:** Software Architect

---

## 1. System Architecture

The SCSS will be implemented as a **client-server web application** following a **Layered Architecture** pattern. This ensures separation of concerns, scalability, and maintainability. The system will be deployed as a modular monolith for the MVP to simplify operations while allowing for future migration to microservices if necessary.

### 1.1 High-Level Architecture Diagram

```text
[ Client Layer ]          [ Security Layer ]        [ Application Layer ]
+-------------------+     +----------------+      +--------------------------+
|                   |     |                |      |   API Gateway / LB       |
|   Web Browser     |<--->|  OAuth 2.0 /   |<---->| (Nginx / Cloud Load Bal.) |
| (React / SPA)     |     |  JWT Auth      |      +------------+-------------+
+-------------------+     +----------------+                   |
                                                           |
                                                           v
                                              +--------------------------+
                                              |   Backend Services       |
                                              |  (Java Spring Boot)      |
                                              |  +--------------------+  |
                                              |  | Auth Service       |  |
                                              |  | Catalog Service   |  |
                                              |  | Registration Svc  |  |
                                              |  | User Service      |  |
                                              |  +--------------------+  |
                                              +------------+-------------+
                                                           |
         +------------------+                +-------------+-------------+
         |                  |                |                           |
+--------v--------+ +--------v--------+ +-----v-------+         +--------v--------+
|  PostgreSQL DB  | |   Redis Cache   | | File System |         |  Ext. SIS API   |
|  (Primary Data) | | (Session/Seat  | | (Logs/Conf) |         | (Prereq/History)|
|                 | |  Locking)      | |             |         |                 |
+-----------------+ +-----------------+ +-------------+         +-----------------+
```

### 1.2 Architectural Principles
1.  **RESTful API Design:** Communication between client and server will occur via standard HTTP methods (GET, POST, PUT, DELETE) with JSON payloads.
2.  **ACID Compliance:** Critical operations (enrollment, dropping) strictly adhere to Atomicity, Consistency, Isolation, and Durability to prevent data corruption (e.g., overbooking).
3.  **Statelessness:** The backend services are stateless; session state is stored in Redis.
4.  **Security in Depth:** Authentication and Authorization are enforced at the gateway and service layer.

---

## 2. Technology Stack

The technology stack is selected based on stability, ecosystem support, and suitability for transaction-heavy educational systems.

### 2.1 Frontend
| Component | Technology | Justification |
| :--- | :--- | :--- |
| **Framework** | React 18+ | Component-based architecture, vast ecosystem, efficient DOM handling. |
| **Language** | TypeScript | Type safety reduces runtime errors and improves maintainability. |
| **State Management** | Redux Toolkit (RTK) | Robust handling of global state (user schedule, cart). |
| **UI Library** | Material UI (MUI) | Pre-built components ensuring consistent design and accessibility. |
| **HTTP Client** | Axios | Promise-based HTTP client with interceptor support for JWT tokens. |
| **Scheduler UI** | FullCalendar | Industry standard for rendering weekly timetables. |

### 2.2 Backend
| Component | Technology | Justification |
| :--- | :--- | :--- |
| **Runtime** | Java 17 (LTS) | Enterprise-grade stability. |
| **Framework** | Spring Boot 3.x | Simplifies configuration, embedded server, powerful dependency injection. |
| **Security** | Spring Security (OAuth2/JWT) | Standard for secure authentication and role-based authorization. |
| **ORM** | Hibernate (JPA) | Object-relational mapping for database interactions. |
| **Validation** | Jakarta Bean Validation | Declarative validation of API inputs. |
| **Build Tool** | Maven | Dependency management and build lifecycle. |

### 2.3 Data & Infrastructure
| Component | Technology | Justification |
| :--- | :--- | :--- |
| **Database** | PostgreSQL 15 | ACID compliant, complex querying capability, reliable JSON support. |
| **Caching** | Redis 7 | High-speed storage for session management and distributed locking during registration. |
| **Containerization** | Docker | Consistency across development, testing, and production environments. |

---

## 3. Backend Modules

The backend is organized into distinct modules (packages in Java) following Domain-Driven Design (DDD) principles loosely.

### 3.1 Core Modules

#### A. Auth Module
*   **Responsibility:** Handle login, logout, token generation (JWT), and password hashing.
*   **Key Classes:**
    *   `AuthController`: Exposes `/api/auth/login`.
    *   `JwtUtil`: Generates and validates tokens.
    *   `UserDetailsService`: Loads user-specific data.

#### B. User Module
*   **Responsibility:** Manage user profiles and role assignments.
*   **Key Entities:**
    *   `User`: ID, username, password, role (STUDENT, ADMIN).
    *   `StudentProfile`: User ID, Major, Academic Year.
*   **Key APIs:**
    *   `GET /api/users/me`: Retrieve current user profile.

#### C. Catalog Module
*   **Responsibility:** Manage course data and sections (Read-Heavy).
*   **Key Entities:**
    *   `Course`: ID, Code (e.g., CS-101), Title, Credits, Description.
    *   `Section`: ID, Course ID, Instructor, Room, DayOfWeek, StartTime, EndTime, Capacity, CurrentEnrollment.
    *   `Prerequisite`: ID, Course ID, RequiredCourseID.
*   **Key APIs:**
    *   `GET /api/catalog/courses`: Searchable list of courses.
    *   `GET /api/catalog/sections/{id}`: Details for a specific section.
    *   **Caching Strategy:** Catalog data is cached in Redis to reduce database load during browsing peak times.

#### D. Registration Module
*   **Responsibility:** The core transactional engine handling adds, drops, and validation logic.
*   **Key Entities:**
    *   `Enrollment`: ID, StudentID, SectionID, Status (ACTIVE, DROPPED), Timestamp.
    *   `RegistrationAttempt`: Log of conflict errors (FR-CONFLICT-04).
*   **Key APIs:**
    *   `POST /api/registration/enroll`: Request to add a section.
    *   `DELETE /api/registration/drop/{sectionId}`: Request to drop a section.
    *   `GET /api/registration/schedule`: Retrieve student's current timetable.

#### E. Admin Module
*   **Responsibility:** CRUD operations for catalog and administrative overrides.
*   **Key APIs:**
    *   `POST /api/admin/courses`: Create new course.
    *   `POST /api/admin/sections`: Create new section.
    *   `POST /api/admin/override`: Force-add a student (bypassing conflicts).

---

## 4. Frontend Modules

The frontend is a Single Page Application (SPA) structured by feature.

### 4.1 Module Structure

#### A. Shared Module
*   **Components:** `Layout` (Sidebar/Navbar), `PrivateRoute` (Route Guard), `LoadingSpinner`, `ErrorToast`.
*   **Services:** `apiClient` (Axios instance with interceptors), `authService`.

#### B. Auth Module
*   **Pages:** `LoginPage`.
*   **Features:** Form validation, credential submission, token storage.

#### C. Student Portal Module
*   **Pages:**
    *   `CourseSearchPage`:
        *   **Components:** `FilterBar` (Dept, Time), `CourseCard`, `CourseDetailModal`.
    *   `SchedulePage`:
        *   **Components:** `WeeklyCalendar` (FullCalendar wrapper), `EnrollmentList`.
*   **State (Redux Slices):**
    *   `catalogSlice`: Stores search results and filters.
    *   `scheduleSlice`: Stores enrolled sections, handles optimistic UI updates for drop/add.

#### D. Admin Portal Module
*   **Pages:**
    *   `CourseManagement`: Table view of courses with Edit/Delete actions.
    *   `SectionManagement`: Form to add sections (Time/Room/Capacity).
    *   `Dashboard`: Charts showing enrollment statistics.
*   **Components:** `SectionForm`, `StatsWidget`.

---

## 5. Course Conflict Handling Logic

This is the most critical business logic component (FR-CONFLICT-01 to FR-CONFLICT-04). The logic resides on the **Backend** within the `RegistrationService`. It uses a **Transactional** approach to ensure data integrity.

### 5.1 The Validation Sequence (Chain of Responsibility)

When a `POST /registration/enroll` request is received, the system performs the following checks in order. If any check fails, an exception is thrown, and the transaction is rolled back.

1.  **Existence Check:** Verify the `Section` exists and is active.
2.  **Duplicate Check:** Verify the student is not already enrolled in this specific `Course` (or `Section`).
3.  **Prerequisite Check:** Verify the student has passed the required courses based on their academic history.
4.  **Capacity Check:** Verify `CurrentEnrollment < MaxCapacity`. (Note: Implemented via database row locking to handle race conditions).
5.  **Time Conflict Check:** Compare the new section's schedule against the student's existing enrolled sections.

### 5.2 Detailed Algorithms

#### A. Time Conflict Detection
*Inputs:* New Section Time Range, List of Existing Enrolled Sections.*
*Logic:*
A conflict exists if the day matches AND the time ranges overlap.
Overlap Formula: `(StartA < EndB) && (EndA > StartB)`

```java
boolean hasTimeConflict(Section newSection, List<Section> existingSections) {
    for (Section existing : existingSections) {
        // Check Day Match (assuming enum or string match)
        if (!existing.getDayOfWeek().equals(newSection.getDayOfWeek())) {
            continue;
        }
        
        // Check Time Overlap
        boolean startsBeforeExistingEnds = newSection.getStartTime().isBefore(existing.getEndTime());
        boolean endsAfterExistingStarts = newSection.getEndTime().isAfter(existing.getStartTime());
        
        if (startsBeforeExistingEnds && endsAfterExistingStarts) {
            return true; // Conflict found
        }
    }
    return false;
}
```

#### B. Capacity Check (Concurrency Control)
To prevent two students from registering for the last seat simultaneously (Race Condition), we use **Pessimistic Locking** (via JPA `@Lock(LockModeType.PESSIMISTIC_WRITE)`) or a database atomic update.

*Approach: Atomic Update with SQL Constraints*
1.  Start Transaction.
2.  Execute SQL: `UPDATE section SET current_enrollment = current_enrollment + 1 WHERE id = ? AND current_enrollment < max_capacity`.
3.  Check updated rows count. If `0`, it means capacity was full.
4.  If `1`, proceed to insert Enrollment record.
5.  Commit Transaction.

#### C. Prerequisite Check
*Logic:*
1.  Retrieve `Prerequisite` entities for the target Course.
2.  Retrieve `StudentAcademicHistory` (completed courses with passing grades).
3.  Ensure for every prerequisite `P`, there exists a record in history where `CourseCode == P.Code` AND `Status == PASSED`.

```java
boolean meetsPrerequisites(Course course, Student student) {
    List<Course> prerequisites = course.getPrerequisites();
    if (prerequisites.isEmpty()) return true;

    Set<Course> completedCourses = student.getCompletedCourses(); // Filtered by passing grade

    // Check if all prerequisites are present in completed courses
    return completedCourses.containsAll(prerequisites);
}
```

### 5.3 Error Response Structure
If validation fails, the API returns a structured error message:

```json
{
  "status": 400,
  "error": "CONFLICT_DETECTED",
  "message": "Unable to enroll in CS-201.",
  "details": [
    {
      "type": "TIME_CONFLICT",
      "conflictingCourse": "PHYS-101",
      "description": " overlaps with PHYS-101 on Mondays 10:00-11:30."
    }
  ]
}
```

---

## 6. Database Schema (Simplified)

**Table: Users**
- `id` (PK, UUID)
- `username` (Unique)
- `password_hash`
- `role` (Enum: STUDENT, ADMIN)

**Table: Courses**
- `id` (PK, UUID)
- `code` (e.g., "CS101")
- `title`
- `credits`
- `description`

**Table: Prerequisites**
- `course_id` (FK)
- `prerequisite_course_id` (FK)

**Table: Sections**
- `id` (PK, UUID)
- `course_id` (FK)
- `instructor_name`
- `room`
- `day_of_week` (Enum: MON, TUE...)
- `start_time` (Time)
- `end_time` (Time)
- `max_capacity` (Int)
- `current_enrollment` (Int, Default 0)

**Table: Enrollments**
- `id` (PK, UUID)
- `student_id` (FK)
- `section_id` (FK)
- `status` (Enum: ACTIVE, DROPPED)
- `created_at` (Timestamp)

**Table: StudentHistory**
- `id` (PK)
- `student_id` (FK)
- `course_code`
- `grade` (Char)
- `status` (Enum: PASSED, FAILED)