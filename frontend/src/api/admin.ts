import { apiClient } from "@/api/client"
import type { ScheduleSlot } from "@/api/courses"

export type EnrollmentReportItem = {
  courseCode: string
  sectionName: string
  instructor: string | null
  capacity: number
  enrolled: number
  availabilityPercentage: number
  status: "OPEN" | "CLOSED" | string
}

export type EnrollmentReportResponse = {
  generatedAt: string
  data: EnrollmentReportItem[]
}

export type AdminStudent = {
  id: number
  username: string
  role: "STUDENT" | "ADMIN" | string
}

export type AdminScheduleSection = {
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

export type AdminScheduleCourse = {
  code: string
  name: string
  department: string | null
  credits: number
  description: string | null
}

export type AdminEnrollment = {
  enrollmentId: number
  enrollmentDate: string | null
  course: AdminScheduleCourse
  section: AdminScheduleSection
}

export type AdminTimetableItem = {
  day: string
  startTime: string
  endTime: string
  courseCode: string
  courseName: string
  sectionId: string
  sectionName: string
  instructor: string | null
  location: string | null
}

export type AdminStudentSchedule = {
  student: AdminStudent
  totalCredits: number
  enrolledCourses: AdminEnrollment[]
  timetable: AdminTimetableItem[]
}

export type AdminEnrollmentDeleteResponse = {
  enrollmentId: number
  studentId: string
  sectionId: string
  message: string
}

export type CourseDeleteResponse = {
  id: string
  message: string
  sectionsDeleted: number
  enrollmentsDeleted: number
}

export type CreateCoursePayload = {
  code: string
  name: string
  department: string
  credits: number
  description: string
  prerequisites: string[]
  sectionName: string
  instructorName: string
  location: string
  capacity: number
  schedule: ScheduleSlot[]
}

export type UpdateSectionPayload = {
  instructorName?: string
  capacity?: number
  location?: string
  schedule?: ScheduleSlot[]
}

export async function getEnrollmentReport() {
  const response = await apiClient.get<EnrollmentReportResponse>(
    "/admin/reports/enrollment",
  )
  return response.data
}

export async function getAdminStudents() {
  const response = await apiClient.get<AdminStudent[]>("/admin/students")
  return response.data
}

export async function getAdminStudentSchedule(studentId: number | string) {
  const response = await apiClient.get<AdminStudentSchedule>(
    `/admin/students/${studentId}/schedule`,
  )
  return response.data
}

export async function deleteAdminEnrollment(enrollmentId: number) {
  const response = await apiClient.delete<AdminEnrollmentDeleteResponse>(
    `/admin/enrollments/${enrollmentId}`,
  )
  return response.data
}

export async function createCourse(payload: CreateCoursePayload) {
  const response = await apiClient.post<{ id: string; message: string }>(
    "/admin/courses",
    payload,
  )
  return response.data
}

export async function deleteCourse(courseId: string) {
  const response = await apiClient.delete<CourseDeleteResponse>(
    `/admin/courses/${courseId}`,
  )
  return response.data
}

export async function updateSection(sectionId: string, payload: UpdateSectionPayload) {
  const response = await apiClient.put<{ sectionId: string; message: string }>(
    `/admin/sections/${sectionId}`,
    payload,
  )
  return response.data
}
