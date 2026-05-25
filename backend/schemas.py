from datetime import datetime
from typing import Any

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator


class APIModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, extra="forbid")


class UserResponse(APIModel):
    id: str
    name: str
    role: str


class LoginRequest(APIModel):
    id: str = Field(..., min_length=1, examples=["student"])
    password: str = Field(..., min_length=1, examples=["student"])


class TokenResponse(APIModel):
    token: str
    token_type: str = Field(default="bearer", alias="tokenType")
    user: UserResponse


class ScheduleSlot(APIModel):
    day: str = Field(..., examples=["MON"])
    start_time: str = Field(..., alias="startTime", examples=["10:00"])
    end_time: str = Field(..., alias="endTime", examples=["11:30"])

    @field_validator("day")
    @classmethod
    def normalize_day(cls, value: str) -> str:
        return value.strip().upper()


class Pagination(APIModel):
    total: int
    page: int
    limit: int


class CourseResponse(APIModel):
    id: str
    code: str
    name: str
    department: str | None = None
    credits: int
    description: str | None = None


class CourseListResponse(APIModel):
    data: list[CourseResponse]
    pagination: Pagination


class SectionResponse(APIModel):
    id: str
    section_name: str = Field(..., alias="sectionName")
    instructor: str | None = None
    location: str | None = None
    schedule: list[ScheduleSlot]
    capacity: int
    enrolled: int
    available_seats: int = Field(..., alias="availableSeats")
    status: str


class CourseDetailResponse(APIModel):
    id: str
    code: str
    name: str
    department: str | None = None
    credits: int
    prerequisites: list[str]
    description: str | None = None
    sections: list[SectionResponse]


class ScheduleCourseSummary(APIModel):
    code: str
    name: str
    credits: int


class ScheduleSectionSummary(APIModel):
    id: str
    section_name: str = Field(..., alias="sectionName")
    instructor: str | None = None
    location: str | None = None
    schedule: list[ScheduleSlot]


class RegistrationResponse(APIModel):
    course: ScheduleCourseSummary
    section: ScheduleSectionSummary
    enrollment_date: datetime | None = Field(default=None, alias="enrollmentDate")


class MyScheduleResponse(APIModel):
    student_id: str = Field(..., alias="studentId")
    total_credits: int = Field(..., alias="totalCredits")
    registrations: list[RegistrationResponse]


class AddCourseRequest(APIModel):
    section_id: str | int = Field(..., alias="sectionId", examples=["SEC-001"])


class RegistrationCreated(APIModel):
    section_id: str = Field(..., alias="sectionId")
    course_code: str = Field(..., alias="courseCode")
    credits: int


class ActionResponse(APIModel):
    message: str
    registration: RegistrationCreated | None = None


class CreateCourseRequest(APIModel):
    code: str = Field(..., min_length=1, examples=["HIST202"])
    name: str = Field(..., min_length=1, examples=["Modern History"])
    department: str | None = Field(default=None, examples=["History"])
    credits: int = Field(..., ge=1, le=30)
    description: str | None = None
    prerequisites: list[str] = Field(default_factory=list)
    section_name: str = Field(
        default="Section A",
        alias="sectionName",
        validation_alias=AliasChoices("sectionName", "section"),
    )
    instructor_name: str = Field(
        default="TBA",
        alias="instructorName",
        validation_alias=AliasChoices("instructorName", "instructorId", "instructor"),
    )
    location: str | None = None
    capacity: int = Field(default=30, ge=1)
    schedule: list[ScheduleSlot] = Field(default_factory=list)
    time_slot: str | None = Field(
        default=None,
        alias="timeSlot",
        validation_alias=AliasChoices("timeSlot", "time_slot"),
    )

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().upper()


class CreateSectionRequest(APIModel):
    section_name: str = Field(
        ...,
        alias="sectionName",
        validation_alias=AliasChoices("sectionName", "section"),
        examples=["Section B"],
    )
    instructor_name: str = Field(
        default="TBA",
        alias="instructorName",
        validation_alias=AliasChoices("instructorName", "instructorId", "instructor"),
    )
    location: str | None = None
    capacity: int = Field(..., ge=1)
    schedule: list[ScheduleSlot] = Field(default_factory=list)
    time_slot: str | None = Field(
        default=None,
        alias="timeSlot",
        validation_alias=AliasChoices("timeSlot", "time_slot"),
    )


class UpdateSectionRequest(APIModel):
    section_name: str | None = Field(
        default=None,
        alias="sectionName",
        validation_alias=AliasChoices("sectionName", "section"),
    )
    instructor_name: str | None = Field(
        default=None,
        alias="instructorName",
        validation_alias=AliasChoices("instructorName", "instructorId", "instructor"),
    )
    location: str | None = None
    capacity: int | None = Field(default=None, ge=1)
    schedule: list[ScheduleSlot] | None = None
    time_slot: str | None = Field(
        default=None,
        alias="timeSlot",
        validation_alias=AliasChoices("timeSlot", "time_slot"),
    )


class CourseCreatedResponse(APIModel):
    id: str
    message: str


class SectionActionResponse(APIModel):
    section_id: str = Field(..., alias="sectionId")
    message: str


class EnrollmentReportItem(APIModel):
    course_code: str = Field(..., alias="courseCode")
    section_name: str = Field(..., alias="sectionName")
    instructor: str | None = None
    capacity: int
    enrolled: int
    availability_percentage: float = Field(..., alias="availabilityPercentage")
    status: str


class EnrollmentReportResponse(APIModel):
    generated_at: datetime = Field(..., alias="generatedAt")
    data: list[EnrollmentReportItem]


class ErrorResponse(APIModel):
    error_code: str = Field(..., alias="errorCode")
    message: str
    details: Any | None = None
