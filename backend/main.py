from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

try:
    import crud
    import schemas
    from auth import create_access_token, get_password_hash, require_role
    from database import SessionLocal, get_db, init_db
    from models import Course, Student
except ImportError:
    from . import crud, schemas
    from .auth import create_access_token, get_password_hash, require_role
    from .database import SessionLocal, get_db, init_db
    from .models import Course, Student


def seed_data(db: Session) -> None:
    admin = db.query(Student).filter(Student.student_code == "admin").first()
    if admin is None:
        db.add(
            Student(
                student_code="admin",
                password_hash=get_password_hash("admin"),
                full_name="System Administrator",
                email="admin@example.edu",
                max_credits=0,
                role="ADMIN",
            )
        )

    student = db.query(Student).filter(Student.student_code == "student").first()
    if student is None:
        db.add(
            Student(
                student_code="student",
                password_hash=get_password_hash("student"),
                full_name="Demo Student",
                email="student@example.edu",
                max_credits=18,
                role="STUDENT",
            )
        )

    course_seed = [
        {
            "course_code": "CS101",
            "section": "Section A",
            "course_name": "Introduction to Computer Science",
            "department": "Computer Science",
            "instructor_name": "Dr. Smith",
            "capacity": 30,
            "credits": 3,
            "time_slot": "MON/WED 10:00-11:30",
            "location": "Room 304",
            "prerequisites": None,
            "description": "Fundamentals of programming and algorithms.",
        },
        {
            "course_code": "CS101",
            "section": "Section B",
            "course_name": "Introduction to Computer Science",
            "department": "Computer Science",
            "instructor_name": "Dr. Chen",
            "capacity": 30,
            "credits": 3,
            "time_slot": "TUE/THU 10:00-11:30",
            "location": "Room 305",
            "prerequisites": None,
            "description": "Fundamentals of programming and algorithms.",
        },
        {
            "course_code": "MATH200",
            "section": "Section A",
            "course_name": "Calculus II",
            "department": "Mathematics",
            "instructor_name": "Prof. Alan",
            "capacity": 25,
            "credits": 4,
            "time_slot": "MON/WED 10:30-12:00",
            "location": "Math Hall 210",
            "prerequisites": None,
            "description": "Techniques and applications of integral calculus.",
        },
        {
            "course_code": "CS102",
            "section": "Section A",
            "course_name": "Data Structures",
            "department": "Computer Science",
            "instructor_name": "Dr. Rivera",
            "capacity": 25,
            "credits": 3,
            "time_slot": "TUE/THU 14:00-15:30",
            "location": "Room 410",
            "prerequisites": '["CS101"]',
            "description": "Core data structures and algorithmic tradeoffs.",
        },
        {
            "course_code": "HIST202",
            "section": "Section A",
            "course_name": "Modern History",
            "department": "History",
            "instructor_name": "Dr. Morgan",
            "capacity": 40,
            "credits": 3,
            "time_slot": "FRI 09:00-11:00",
            "location": "Hall A",
            "prerequisites": None,
            "description": "A survey of modern historical events.",
        },
    ]

    for item in course_seed:
        exists = (
            db.query(Course)
            .filter(
                Course.course_code == item["course_code"],
                Course.section == item["section"],
            )
            .first()
        )
        if exists is None:
            db.add(Course(**item))

    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Student Course Selection System API",
    version="1.0.0",
    description="FastAPI backend for student course browsing, enrollment, and admin reporting.",
    lifespan=lifespan,
)
app.openapi_version = "3.0.3"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(crud.BusinessRuleError)
async def business_rule_exception_handler(request, exc: crud.BusinessRuleError):
    content = {"errorCode": exc.code, "message": exc.message}
    if exc.details is not None:
        content["details"] = exc.details
    return JSONResponse(status_code=exc.status_code, content=content)


@app.get("/", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "Student Course Selection System API"}


@app.post("/auth/login", response_model=schemas.TokenResponse, tags=["Authentication"])
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, payload.id, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": user.student_code, "role": user.role})
    return {
        "token": token,
        "user": {"id": user.student_code, "name": user.full_name, "role": user.role},
    }


@app.get(
    "/courses",
    response_model=schemas.CourseListResponse,
    tags=["Student"],
)
def browse_courses(
    search: str | None = Query(default=None),
    department: str | None = Query(default=None),
    instructor: str | None = Query(default=None),
    day: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: Student = Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    return crud.get_courses(db, search, department, instructor, day, page, limit)


@app.get(
    "/courses/{courseId}",
    response_model=schemas.CourseDetailResponse,
    tags=["Student"],
)
def get_course_detail(
    courseId: str,
    current_user: Student = Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    course = crud.get_course_detail(db, courseId)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@app.get(
    "/students/me/schedule",
    response_model=schemas.MyScheduleResponse,
    tags=["Student"],
)
def get_my_schedule(
    current_user: Student = Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    return crud.get_student_schedule(db, current_user.student_id)


@app.post(
    "/students/me/schedule",
    response_model=schemas.ActionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Student"],
)
def add_course_to_schedule(
    payload: schemas.AddCourseRequest,
    current_user: Student = Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    return crud.register_course(db, current_user.student_id, payload.section_id)


@app.delete(
    "/students/me/schedule/{sectionId}",
    response_model=schemas.ActionResponse,
    tags=["Student"],
)
def drop_course_from_schedule(
    sectionId: str,
    current_user: Student = Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    return crud.drop_course(db, current_user.student_id, sectionId)


@app.post(
    "/admin/courses",
    response_model=schemas.CourseCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Admin"],
)
def create_course(
    payload: schemas.CreateCourseRequest,
    current_user: Student = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    course = crud.create_course(db, payload)
    return {"id": course.course_code, "message": "Course created successfully."}


@app.post(
    "/admin/courses/{courseId}/sections",
    response_model=schemas.SectionActionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Admin"],
)
def create_section(
    courseId: str,
    payload: schemas.CreateSectionRequest,
    current_user: Student = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    section = crud.create_section(db, courseId, payload)
    return {
        "sectionId": crud.format_section_id(section.course_id),
        "message": "Section created successfully.",
    }


@app.put(
    "/admin/sections/{sectionId}",
    response_model=schemas.SectionActionResponse,
    tags=["Admin"],
)
def update_section(
    sectionId: str,
    payload: schemas.UpdateSectionRequest,
    current_user: Student = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    section = crud.update_section(db, sectionId, payload)
    return {
        "sectionId": crud.format_section_id(section.course_id),
        "message": "Section updated successfully.",
    }


@app.get(
    "/admin/reports/enrollment",
    response_model=schemas.EnrollmentReportResponse,
    tags=["Admin"],
)
def enrollment_report(
    department: str | None = Query(default=None),
    current_user: Student = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    return crud.get_enrollment_report(db, department)
