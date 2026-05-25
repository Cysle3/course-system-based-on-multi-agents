```sql
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL,
    prerequisites TEXT,
    instructor TEXT NOT NULL,
    location TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    current_enrollment INTEGER DEFAULT 0
);

CREATE TABLE enrollments (
    enrollment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'ENROLLED',
    enrollment_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);
```