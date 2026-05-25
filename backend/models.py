from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

try:
    from database import Base
except ImportError:
    from .database import Base


class Student(Base):
    __tablename__ = "students"
    __table_args__ = (
        CheckConstraint("role IN ('STUDENT', 'ADMIN')", name="ck_students_role"),
    )

    student_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    student_code = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    max_credits = Column(Integer, default=18, nullable=False)
    role = Column(String, nullable=False, default="STUDENT")

    enrollments = relationship(
        "Enrollment",
        back_populates="student",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Course(Base):
    __tablename__ = "courses"
    __table_args__ = (
        UniqueConstraint("course_code", "section", name="uq_courses_code_section"),
    )

    course_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    course_code = Column(String, nullable=False, index=True)
    section = Column(String, nullable=False, default="A")
    course_name = Column(String, nullable=False)
    department = Column(String, nullable=True, index=True)
    instructor_name = Column(String, nullable=True, index=True)
    capacity = Column(Integer, nullable=False)
    credits = Column(Integer, nullable=False)
    time_slot = Column(Text, nullable=False)
    location = Column(String, nullable=True)
    prerequisites = Column(Text, nullable=True)
    description = Column(Text, nullable=True)

    enrollments = relationship(
        "Enrollment",
        back_populates="course",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (
        UniqueConstraint("student_id", "course_id", name="uq_enrollments_student_course"),
    )

    enrollment_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    student_id = Column(
        Integer,
        ForeignKey("students.student_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    course_id = Column(
        Integer,
        ForeignKey("courses.course_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    enrollment_date = Column(DateTime, server_default=func.current_timestamp(), nullable=False)

    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
