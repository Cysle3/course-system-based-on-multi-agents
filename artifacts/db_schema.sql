```sql
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    password TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK(role IN ('STUDENT', 'ADMIN'))
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    instructor_name TEXT NOT NULL,
    location TEXT,
    credit_hours INTEGER NOT NULL CHECK(credit_hours > 0),
    capacity INTEGER NOT NULL CHECK(capacity > 0),
    time_slot TEXT NOT NULL
);

CREATE TABLE enrollments (
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrollment_date TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);
```