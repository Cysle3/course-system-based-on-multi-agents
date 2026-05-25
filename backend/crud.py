import json
import re
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

try:
    from auth import verify_password
    from models import Course, Enrollment, Student
except ImportError:
    from .auth import verify_password
    from .models import Course, Enrollment, Student


DAY_ALIASES = {
    "MON": "MON",
    "MONDAY": "MON",
    "TUE": "TUE",
    "TUES": "TUE",
    "TUESDAY": "TUE",
    "WED": "WED",
    "WEDNESDAY": "WED",
    "THU": "THU",
    "THUR": "THU",
    "THURS": "THU",
    "THURSDAY": "THU",
    "FRI": "FRI",
    "FRIDAY": "FRI",
    "SAT": "SAT",
    "SATURDAY": "SAT",
    "SUN": "SUN",
    "SUNDAY": "SUN",
}
DAY_ORDER = {"MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6, "SUN": 7}
TIME_RE = re.compile(r"(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)")
COURSE_CODE_RE = re.compile(r"\b[A-Z]{2,}\s*\d{2,}[A-Z]?\b")


class BusinessRuleError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Any | None = None,
    ) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


def format_section_id(course_id: int) -> str:
    return f"SEC-{course_id:03d}"


def parse_section_id(section_id: str | int) -> int | None:
    if isinstance(section_id, int):
        return section_id

    value = str(section_id).strip()
    if value.isdigit():
        return int(value)

    match = re.fullmatch(r"SEC-?(\d+)", value, flags=re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def _parse_time_to_minutes(value: str) -> int | None:
    value = value.strip().upper().replace(" ", "")
    match = re.fullmatch(r"(\d{1,2}):(\d{2})(AM|PM)?", value)
    if not match:
        return None

    hour = int(match.group(1))
    minute = int(match.group(2))
    suffix = match.group(3)

    if suffix == "AM" and hour == 12:
        hour = 0
    elif suffix == "PM" and hour != 12:
        hour += 12

    if hour > 23 or minute > 59:
        return None
    return hour * 60 + minute


def _format_minutes(minutes: int) -> str:
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def _extract_days(value: str) -> list[str]:
    normalized = re.sub(r"[/,&+]", " ", value.upper())
    normalized = normalized.replace(" AND ", " ")
    days: list[str] = []
    for token in re.findall(r"[A-Z]+", normalized):
        day = DAY_ALIASES.get(token)
        if day and day not in days:
            days.append(day)
    return sorted(days, key=lambda item: DAY_ORDER[item])


def parse_time_slot(time_slot: str | None) -> list[dict[str, str]]:
    if not time_slot or time_slot.strip().upper() in {"TBA", "N/A", "NONE"}:
        return []

    normalized = time_slot.replace("–", "-").replace("—", "-")
    slots: list[dict[str, str]] = []

    for segment in re.split(r";|\n", normalized):
        segment = segment.strip()
        if not segment:
            continue

        time_matches = list(TIME_RE.finditer(segment))
        if len(time_matches) < 2:
            continue

        start_raw = time_matches[0].group(1)
        end_raw = time_matches[1].group(1)
        start_minutes = _parse_time_to_minutes(start_raw)
        end_minutes = _parse_time_to_minutes(end_raw)
        if start_minutes is None or end_minutes is None:
            continue

        day_part = segment[: time_matches[0].start()]
        days = _extract_days(day_part)
        for day in days:
            slots.append(
                {
                    "day": day,
                    "startTime": _format_minutes(start_minutes),
                    "endTime": _format_minutes(end_minutes),
                }
            )

    return slots


def schedule_to_time_slot(schedule: list[Any] | None, fallback: str | None = None) -> str:
    if fallback and fallback.strip():
        return fallback.strip()
    if not schedule:
        return "TBA"

    grouped: dict[tuple[str, str], list[str]] = {}
    for item in schedule:
        day = getattr(item, "day", None)
        start_time = getattr(item, "start_time", None)
        end_time = getattr(item, "end_time", None)

        if isinstance(item, dict):
            day = item.get("day", day)
            start_time = item.get("startTime", item.get("start_time", start_time))
            end_time = item.get("endTime", item.get("end_time", end_time))

        if not day or not start_time or not end_time:
            continue

        key = (str(start_time).strip(), str(end_time).strip())
        grouped.setdefault(key, []).append(str(day).strip().upper())

    if not grouped:
        return "TBA"

    segments = []
    for (start_time, end_time), days in grouped.items():
        ordered_days = sorted(set(days), key=lambda item: DAY_ORDER.get(item, 99))
        segments.append(f"{'/'.join(ordered_days)} {start_time}-{end_time}")
    return "; ".join(segments)


def parse_prerequisites(value: str | list[str] | None) -> list[str]:
    if not value:
        return []

    if isinstance(value, list):
        raw_items = value
    else:
        text = value.strip()
        if text.upper() in {"NONE", "N/A", "[]"}:
            return []
        try:
            decoded = json.loads(text)
            raw_items = decoded if isinstance(decoded, list) else [text]
        except json.JSONDecodeError:
            raw_items = re.split(r"[,;/\n]+", text)

    codes: list[str] = []
    for item in raw_items:
        item_text = str(item).upper().strip()
        for match in COURSE_CODE_RE.findall(item_text):
            code = re.sub(r"\s+", "", match)
            if code not in codes:
                codes.append(code)
    return codes


def prerequisites_to_text(prerequisites: list[str] | None) -> str | None:
    if not prerequisites:
        return None
    return json.dumps([item.strip().upper() for item in prerequisites if item.strip()])


def _slots_overlap(first: dict[str, str], second: dict[str, str]) -> bool:
    if first["day"] != second["day"]:
        return False

    first_start = _parse_time_to_minutes(first["startTime"])
    first_end = _parse_time_to_minutes(first["endTime"])
    second_start = _parse_time_to_minutes(second["startTime"])
    second_end = _parse_time_to_minutes(second["endTime"])

    if None in {first_start, first_end, second_start, second_end}:
        return False
    return first_start < second_end and second_start < first_end


def time_slots_conflict(first_slot: str | None, second_slot: str | None) -> bool:
    first = parse_time_slot(first_slot)
    second = parse_time_slot(second_slot)

    if first and second:
        return any(_slots_overlap(item, other) for item in first for other in second)

    first_raw = (first_slot or "").strip().upper()
    second_raw = (second_slot or "").strip().upper()
    return first_raw not in {"", "TBA", "N/A"} and first_raw == second_raw


def authenticate_user(db: Session, username: str, password: str) -> Student | None:
    user = db.query(Student).filter(Student.student_code == username).first()
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user


def get_enrolled_count(db: Session, course_id: int) -> int:
    return (
        db.query(func.count(Enrollment.enrollment_id))
        .filter(Enrollment.course_id == course_id)
        .scalar()
        or 0
    )


def _course_summary(course: Course) -> dict[str, Any]:
    return {
        "id": course.course_code,
        "code": course.course_code,
        "name": course.course_name,
        "department": course.department,
        "credits": course.credits,
        "description": course.description,
    }


def get_courses(
    db: Session,
    search: str | None = None,
    department: str | None = None,
    instructor: str | None = None,
    day: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> dict[str, Any]:
    query = db.query(Course)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(or_(Course.course_code.ilike(term), Course.course_name.ilike(term)))
    if department:
        query = query.filter(Course.department.ilike(f"%{department.strip()}%"))
    if instructor:
        query = query.filter(Course.instructor_name.ilike(f"%{instructor.strip()}%"))
    if day:
        day_code = DAY_ALIASES.get(day.strip().upper(), day.strip().upper())
        query = query.filter(Course.time_slot.ilike(f"%{day_code}%"))

    rows = query.order_by(Course.course_code, Course.section).all()
    grouped: dict[str, Course] = {}
    for course in rows:
        grouped.setdefault(course.course_code, course)

    all_courses = [_course_summary(course) for course in grouped.values()]
    total = len(all_courses)
    page = max(page, 1)
    limit = min(max(limit, 1), 100)
    start = (page - 1) * limit
    end = start + limit

    return {
        "data": all_courses[start:end],
        "pagination": {"total": total, "page": page, "limit": limit},
    }


def resolve_course_reference(db: Session, course_id: str | int) -> Course | None:
    text = str(course_id).strip()
    section_pk = parse_section_id(text)
    if section_pk is not None:
        course = db.get(Course, section_pk)
        if course:
            return course

    return (
        db.query(Course)
        .filter(func.upper(Course.course_code) == text.upper())
        .order_by(Course.course_id)
        .first()
    )


def resolve_section(db: Session, section_id: str | int) -> Course | None:
    section_pk = parse_section_id(section_id)
    if section_pk is None:
        return None
    return db.get(Course, section_pk)


def get_course_detail(db: Session, course_id: str | int) -> dict[str, Any] | None:
    course_ref = resolve_course_reference(db, course_id)
    if course_ref is None:
        return None

    sections = (
        db.query(Course)
        .filter(Course.course_code == course_ref.course_code)
        .order_by(Course.section)
        .all()
    )
    if not sections:
        return None

    first = sections[0]
    section_payloads = []
    for section in sections:
        enrolled = get_enrolled_count(db, section.course_id)
        available = max(section.capacity - enrolled, 0)
        section_payloads.append(
            {
                "id": format_section_id(section.course_id),
                "sectionName": section.section,
                "instructor": section.instructor_name,
                "location": section.location,
                "schedule": parse_time_slot(section.time_slot),
                "capacity": section.capacity,
                "enrolled": enrolled,
                "availableSeats": available,
                "status": "OPEN" if available > 0 else "CLOSED",
            }
        )

    return {
        "id": first.course_code,
        "code": first.course_code,
        "name": first.course_name,
        "department": first.department,
        "credits": first.credits,
        "prerequisites": parse_prerequisites(first.prerequisites),
        "description": first.description,
        "sections": section_payloads,
    }


def _student_registered_courses(db: Session, student_id: int) -> list[Course]:
    return (
        db.query(Course)
        .join(Enrollment, Enrollment.course_id == Course.course_id)
        .filter(Enrollment.student_id == student_id)
        .order_by(Course.course_code, Course.section)
        .all()
    )


def _student_current_credits(db: Session, student_id: int) -> int:
    return sum(course.credits for course in _student_registered_courses(db, student_id))


def register_course(db: Session, student_id: int, section_id: str | int) -> dict[str, Any]:
    student = db.get(Student, student_id)
    if student is None:
        raise BusinessRuleError("STUDENT_NOT_FOUND", "Student not found.", 404)

    section = resolve_section(db, section_id)
    if section is None:
        raise BusinessRuleError("SECTION_NOT_FOUND", "Section not found.", 404)

    existing_enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == student_id,
            Enrollment.course_id == section.course_id,
        )
        .first()
    )
    if existing_enrollment:
        raise BusinessRuleError(
            "DUPLICATE_ENROLLMENT",
            "Registration failed because this section is already in your schedule.",
            409,
        )

    current_courses = _student_registered_courses(db, student_id)
    if any(course.course_code == section.course_code for course in current_courses):
        raise BusinessRuleError(
            "DUPLICATE_COURSE",
            "Registration failed because you are already registered for this course.",
            409,
        )

    enrolled_count = get_enrolled_count(db, section.course_id)
    if enrolled_count >= section.capacity:
        raise BusinessRuleError(
            "SECTION_FULL",
            "Registration failed because this section is full.",
            409,
            details=f"{section.course_code} - {section.section} has no available seats.",
        )

    for registered_course in current_courses:
        if time_slots_conflict(section.time_slot, registered_course.time_slot):
            raise BusinessRuleError(
                "TIME_CONFLICT",
                "Registration failed due to a time conflict.",
                409,
                details=(
                    f"Conflicts with {registered_course.course_code} - "
                    f"{registered_course.section} ({registered_course.time_slot})."
                ),
            )

    completed_or_registered_codes = {course.course_code for course in current_courses}
    missing_prerequisites = [
        code for code in parse_prerequisites(section.prerequisites) if code not in completed_or_registered_codes
    ]
    if missing_prerequisites:
        raise BusinessRuleError(
            "PREREQUISITE_NOT_MET",
            "Registration failed because prerequisites are not satisfied.",
            400,
            details={"missingPrerequisites": missing_prerequisites},
        )

    current_credits = sum(course.credits for course in current_courses)
    if current_credits + section.credits > student.max_credits:
        raise BusinessRuleError(
            "CREDIT_LIMIT_EXCEEDED",
            "Registration failed because it would exceed the student's credit limit.",
            400,
            details={
                "currentCredits": current_credits,
                "newCourseCredits": section.credits,
                "maxCredits": student.max_credits,
            },
        )

    enrollment = Enrollment(student_id=student_id, course_id=section.course_id)
    db.add(enrollment)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise BusinessRuleError(
            "DUPLICATE_ENROLLMENT",
            "Registration failed because this section is already in your schedule.",
            409,
        ) from exc

    return {
        "message": f"Successfully registered for {section.course_code} - {section.section}.",
        "registration": {
            "sectionId": format_section_id(section.course_id),
            "courseCode": section.course_code,
            "credits": section.credits,
        },
    }


def drop_course(db: Session, student_id: int, section_id: str | int) -> dict[str, str]:
    section = resolve_section(db, section_id)
    if section is None:
        raise BusinessRuleError("SECTION_NOT_FOUND", "Section not found.", 404)

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == student_id,
            Enrollment.course_id == section.course_id,
        )
        .first()
    )
    if enrollment is None:
        raise BusinessRuleError(
            "NOT_ENROLLED",
            "Drop failed because the student is not enrolled in this section.",
            400,
        )

    db.delete(enrollment)
    db.commit()
    return {"message": f"Successfully dropped {section.course_code} - {section.section}."}


def get_student_schedule(db: Session, student_id: int) -> dict[str, Any]:
    student = db.get(Student, student_id)
    if student is None:
        raise BusinessRuleError("STUDENT_NOT_FOUND", "Student not found.", 404)

    enrollments = (
        db.query(Enrollment)
        .join(Course, Enrollment.course_id == Course.course_id)
        .filter(Enrollment.student_id == student_id)
        .order_by(Course.course_code, Course.section)
        .all()
    )

    total_credits = 0
    registrations = []
    for enrollment in enrollments:
        course = enrollment.course
        total_credits += course.credits
        registrations.append(
            {
                "course": {
                    "code": course.course_code,
                    "name": course.course_name,
                    "credits": course.credits,
                },
                "section": {
                    "id": format_section_id(course.course_id),
                    "sectionName": course.section,
                    "instructor": course.instructor_name,
                    "location": course.location,
                    "schedule": parse_time_slot(course.time_slot),
                },
                "enrollmentDate": enrollment.enrollment_date,
            }
        )

    return {
        "studentId": student.student_code,
        "totalCredits": total_credits,
        "registrations": registrations,
    }


def create_course(db: Session, payload: Any) -> Course:
    existing = (
        db.query(Course)
        .filter(func.upper(Course.course_code) == payload.code.upper())
        .first()
    )
    if existing:
        raise BusinessRuleError(
            "COURSE_ALREADY_EXISTS",
            "A course with this code already exists.",
            409,
        )

    course = Course(
        course_code=payload.code.upper().strip(),
        section=payload.section_name.strip(),
        course_name=payload.name.strip(),
        department=payload.department,
        instructor_name=payload.instructor_name,
        capacity=payload.capacity,
        credits=payload.credits,
        time_slot=schedule_to_time_slot(payload.schedule, payload.time_slot),
        location=payload.location,
        prerequisites=prerequisites_to_text(payload.prerequisites),
        description=payload.description,
    )
    db.add(course)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise BusinessRuleError(
            "COURSE_ALREADY_EXISTS",
            "A course with this code and section already exists.",
            409,
        ) from exc
    db.refresh(course)
    return course


def create_section(db: Session, course_id: str | int, payload: Any) -> Course:
    template = resolve_course_reference(db, course_id)
    if template is None:
        raise BusinessRuleError("COURSE_NOT_FOUND", "Course not found.", 404)

    duplicate = (
        db.query(Course)
        .filter(
            Course.course_code == template.course_code,
            func.upper(Course.section) == payload.section_name.strip().upper(),
        )
        .first()
    )
    if duplicate:
        raise BusinessRuleError(
            "SECTION_ALREADY_EXISTS",
            "A section with this name already exists for the course.",
            409,
        )

    section = Course(
        course_code=template.course_code,
        section=payload.section_name.strip(),
        course_name=template.course_name,
        department=template.department,
        instructor_name=payload.instructor_name,
        capacity=payload.capacity,
        credits=template.credits,
        time_slot=schedule_to_time_slot(payload.schedule, payload.time_slot),
        location=payload.location,
        prerequisites=template.prerequisites,
        description=template.description,
    )
    db.add(section)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise BusinessRuleError(
            "SECTION_ALREADY_EXISTS",
            "A section with this name already exists for the course.",
            409,
        ) from exc
    db.refresh(section)
    return section


def update_section(db: Session, section_id: str | int, payload: Any) -> Course:
    section = resolve_section(db, section_id)
    if section is None:
        raise BusinessRuleError("SECTION_NOT_FOUND", "Section not found.", 404)

    has_update = False
    if payload.section_name is not None:
        new_name = payload.section_name.strip()
        duplicate = (
            db.query(Course)
            .filter(
                Course.course_code == section.course_code,
                func.upper(Course.section) == new_name.upper(),
                Course.course_id != section.course_id,
            )
            .first()
        )
        if duplicate:
            raise BusinessRuleError(
                "SECTION_ALREADY_EXISTS",
                "A section with this name already exists for the course.",
                409,
            )
        section.section = new_name
        has_update = True

    if payload.capacity is not None:
        enrolled = get_enrolled_count(db, section.course_id)
        if payload.capacity < enrolled:
            raise BusinessRuleError(
                "CAPACITY_BELOW_ENROLLMENT",
                "Capacity cannot be set below the current enrolled count.",
                400,
                details={"enrolled": enrolled, "requestedCapacity": payload.capacity},
            )
        section.capacity = payload.capacity
        has_update = True

    if payload.location is not None:
        section.location = payload.location
        has_update = True

    if payload.instructor_name is not None:
        section.instructor_name = payload.instructor_name
        has_update = True

    if payload.time_slot is not None or payload.schedule is not None:
        section.time_slot = schedule_to_time_slot(payload.schedule, payload.time_slot)
        has_update = True

    if not has_update:
        raise BusinessRuleError(
            "NO_UPDATES_PROVIDED",
            "At least one section field must be provided for update.",
            400,
        )

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise BusinessRuleError(
            "SECTION_ALREADY_EXISTS",
            "A section with this name already exists for the course.",
            409,
        ) from exc
    db.refresh(section)
    return section


def get_enrollment_report(db: Session, department: str | None = None) -> dict[str, Any]:
    query = db.query(Course)
    if department:
        query = query.filter(Course.department.ilike(f"%{department.strip()}%"))

    courses = query.order_by(Course.course_code, Course.section).all()
    data = []
    for course in courses:
        enrolled = get_enrolled_count(db, course.course_id)
        enrollment_percentage = round((enrolled / course.capacity) * 100, 1) if course.capacity else 0.0
        data.append(
            {
                "courseCode": course.course_code,
                "sectionName": course.section,
                "instructor": course.instructor_name,
                "capacity": course.capacity,
                "enrolled": enrolled,
                "availabilityPercentage": enrollment_percentage,
                "status": "CLOSED" if enrolled >= course.capacity else "OPEN",
            }
        )

    return {"generatedAt": datetime.now(timezone.utc), "data": data}
