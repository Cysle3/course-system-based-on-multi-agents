import { apiClient } from "@/api/client"

export type ScheduleSlot = {
  day: string
  startTime: string
  endTime: string
}

export type CourseSummary = {
  id: string
  code: string
  name: string
  department: string | null
  credits: number
  description: string | null
}

export type CourseSection = {
  id: string
  sectionName: string
  instructor: string | null
  location: string | null
  schedule: ScheduleSlot[]
  capacity: number
  enrolled: number
  availableSeats: number
  status: "OPEN" | "CLOSED" | string
}

export type CourseDetail = {
  id: string
  code: string
  name: string
  department: string | null
  credits: number
  prerequisites: string[]
  description: string | null
  sections: CourseSection[]
}

export type CourseListResponse = {
  data: CourseSummary[]
  pagination: {
    total: number
    page: number
    limit: number
  }
}

export type CourseCardData = CourseSummary & {
  sections: CourseSection[]
}

export type StudentScheduleCourse = {
  code: string
  name: string
  credits: number
}

export type StudentScheduleSection = {
  id: string
  sectionName: string
  instructor: string | null
  location: string | null
  schedule: ScheduleSlot[]
}

export type StudentScheduleRegistration = {
  enrollmentId: number
  course: StudentScheduleCourse
  section: StudentScheduleSection
  enrollmentDate: string | null
}

export type StudentScheduleResponse = {
  studentId: string
  totalCredits: number
  registrations: StudentScheduleRegistration[]
}

export async function getCourseList() {
  const response = await apiClient.get<CourseListResponse>("/courses")
  return response.data
}

export async function getCourseDetail(courseId: string) {
  const response = await apiClient.get<CourseDetail>(`/courses/${courseId}`)
  return response.data
}

export async function getCourseCards() {
  const list = await getCourseList()
  const details = await Promise.all(
    list.data.map(async (course) => {
      const detail = await getCourseDetail(course.id)

      return {
        ...course,
        name: detail.name,
        department: detail.department,
        credits: detail.credits,
        description: detail.description,
        sections: detail.sections,
      } satisfies CourseCardData
    }),
  )

  return details
}

export async function enrollInSection(sectionId: string) {
  const response = await apiClient.post("/students/me/schedule", { sectionId })
  return response.data
}

export async function getMySchedule() {
  const response = await apiClient.get<StudentScheduleResponse>("/students/me/schedule")
  return response.data
}
