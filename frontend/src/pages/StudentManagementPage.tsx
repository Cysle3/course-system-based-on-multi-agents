import { useEffect, useMemo, useState } from "react"
import { AxiosError } from "axios"
import {
  AlertCircle,
  BookOpenCheck,
  Clock3,
  GraduationCap,
  Loader2,
  MapPin,
  RefreshCcw,
  Search,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react"
import { toast } from "sonner"

import {
  deleteAdminEnrollment,
  getAdminStudentSchedule,
  getAdminStudents,
  type AdminEnrollment,
  type AdminStudent,
  type AdminStudentSchedule,
} from "@/api/admin"
import {
  WeeklyTimetable,
  type TimetableCourse,
  type WeekDayCode,
} from "@/components/WeeklyTimetable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const courseColors: TimetableCourse["color"][] = [
  "blue",
  "emerald",
  "violet",
  "amber",
  "rose",
]

const weekDayCodes: WeekDayCode[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

function isWeekDayCode(day: string): day is WeekDayCode {
  return weekDayCodes.includes(day as WeekDayCode)
}

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.message ?? error.response?.data?.detail

    if (typeof detail === "string") {
      return detail
    }

    if (error.response?.status === 403) {
      return "This page requires an administrator account."
    }
  }

  return "Unable to load student management data. Confirm the backend API is running."
}

function getStudentLabel(student: AdminStudent) {
  return student.username
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function mapScheduleToTimetableCourses(schedule: AdminStudentSchedule | null) {
  if (!schedule) {
    return []
  }

  const courses: TimetableCourse[] = schedule.enrolledCourses.map((enrollment, index) => ({
    id: String(enrollment.enrollmentId),
    enrollmentId: enrollment.enrollmentId,
    sectionId: enrollment.section.id,
    code: enrollment.course.code,
    name: enrollment.course.name,
    instructor: enrollment.section.instructor ?? "TBA",
    credits: enrollment.course.credits,
    color: courseColors[index % courseColors.length],
    meetings: enrollment.section.schedule.flatMap((slot) => {
      const day = slot.day.toUpperCase()

      if (!isWeekDayCode(day)) {
        return []
      }

      return [
        {
          day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          location: enrollment.section.location ?? "Location TBA",
        },
      ]
    }),
  }))

  return courses
}

function ManagementStatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string | number
  description: string
  icon: typeof UsersRound
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function StudentListSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-lg border border-slate-100 p-3">
          <div className="h-4 w-2/3 rounded bg-slate-100" />
          <div className="mt-2 h-3 w-1/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-[520px] animate-pulse rounded-xl bg-slate-100" />
    </div>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <div className="flex size-11 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
        <BookOpenCheck className="size-5" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">Unable to load data</p>
          <p className="mt-1 leading-6">{message}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3 border-red-200 bg-white text-red-700 hover:bg-red-100"
            onClick={onRetry}
          >
            <RefreshCcw />
            Retry
          </Button>
        </div>
      </div>
    </div>
  )
}

function StudentListPanel({
  students,
  selectedStudentId,
  query,
  loading,
  error,
  onQueryChange,
  onSelectStudent,
  onRetry,
}: {
  students: AdminStudent[]
  selectedStudentId: number | null
  query: string
  loading: boolean
  error: string | null
  onQueryChange: (value: string) => void
  onSelectStudent: (studentId: number) => void
  onRetry: () => void
}) {
  const filteredStudents = students.filter((student) => {
    const term = query.trim().toLowerCase()

    if (!term) {
      return true
    }

    return (
      student.username.toLowerCase().includes(term) ||
      student.role.toLowerCase().includes(term) ||
      String(student.id).includes(term)
    )
  })

  return (
    <Card className="border-slate-200 bg-white shadow-sm lg:sticky lg:top-4">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Students</CardTitle>
            <CardDescription>{students.length} active student accounts</CardDescription>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <UsersRound className="size-5" />
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="pl-9"
            placeholder="Search students"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <StudentListSkeleton />
        ) : error ? (
          <div className="p-4">
            <ErrorPanel message={error} onRetry={onRetry} />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No students found"
              description="Try a different search term or refresh the student list."
            />
          </div>
        ) : (
          <div className="max-h-[520px] overflow-y-auto p-3">
            {filteredStudents.map((student) => {
              const active = selectedStudentId === student.id

              return (
                <button
                  key={student.id}
                  type="button"
                  className={cn(
                    "mb-2 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors last:mb-0",
                    active
                      ? "border-blue-200 bg-blue-50 shadow-sm"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50",
                  )}
                  onClick={() => onSelectStudent(student.id)}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg",
                      active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600",
                    )}
                  >
                    <UserRound className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {getStudentLabel(student)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {student.username}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 bg-slate-50 text-[10px] text-slate-600"
                  >
                    #{student.id}
                  </Badge>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EnrollmentCourseCard({
  enrollment,
  dropping,
  onDrop,
}: {
  enrollment: AdminEnrollment
  dropping: boolean
  onDrop: (enrollment: AdminEnrollment) => void
}) {
  const meetings = enrollment.section.schedule

  return (
    <Card className="border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge variant="outline" className="mb-3 bg-slate-50 text-slate-700">
              {enrollment.course.code}
            </Badge>
            <CardTitle className="line-clamp-1">{enrollment.course.name}</CardTitle>
            <CardDescription>{enrollment.section.sectionName}</CardDescription>
          </div>
          <Badge
            variant={enrollment.section.status === "OPEN" ? "success" : "outline"}
            className={enrollment.section.status !== "OPEN" ? "bg-slate-50 text-slate-500" : undefined}
          >
            {enrollment.course.credits} cr
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <UserRound className="size-4 text-slate-400" />
            <span className="truncate">{enrollment.section.instructor ?? "TBA"}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="size-4 text-slate-400" />
            <span className="truncate">{enrollment.section.location ?? "Location TBA"}</span>
          </div>
          <div className="space-y-2">
            {meetings.length > 0 ? (
              meetings.map((meeting) => (
                <div
                  key={`${meeting.day}-${meeting.startTime}-${meeting.endTime}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"
                >
                  <span className="font-medium text-slate-700">{meeting.day}</span>
                  <span>
                    {meeting.startTime}-{meeting.endTime}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Meeting time TBA
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="text-xs text-slate-500">
              Enrollment #{enrollment.enrollmentId}
            </div>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={dropping}
              onClick={() => onDrop(enrollment)}
            >
              {dropping ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Drop Course
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StudentManagementPage() {
  const [students, setStudents] = useState<AdminStudent[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [schedule, setSchedule] = useState<AdminStudentSchedule | null>(null)
  const [studentQuery, setStudentQuery] = useState("")
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [studentsError, setStudentsError] = useState<string | null>(null)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [droppingEnrollmentId, setDroppingEnrollmentId] = useState<number | null>(null)

  async function loadStudents() {
    setStudentsLoading(true)
    setStudentsError(null)

    try {
      const nextStudents = await getAdminStudents()
      setStudents(nextStudents)
      setSelectedStudentId((current) => {
        if (current && nextStudents.some((student) => student.id === current)) {
          return current
        }

        return nextStudents[0]?.id ?? null
      })
    } catch (error) {
      const message = getErrorMessage(error)
      setStudentsError(message)
      toast.error("Student list unavailable", {
        description: message,
      })
    } finally {
      setStudentsLoading(false)
    }
  }

  async function loadSchedule(studentId: number) {
    setScheduleLoading(true)
    setScheduleError(null)

    try {
      const nextSchedule = await getAdminStudentSchedule(studentId)
      setSchedule(nextSchedule)
    } catch (error) {
      const message = getErrorMessage(error)
      setSchedule(null)
      setScheduleError(message)
      toast.error("Student schedule unavailable", {
        description: message,
      })
    } finally {
      setScheduleLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadInitialStudents() {
      setStudentsLoading(true)
      setStudentsError(null)

      try {
        const nextStudents = await getAdminStudents()

        if (!cancelled) {
          setStudents(nextStudents)
          setSelectedStudentId(nextStudents[0]?.id ?? null)
        }
      } catch (error) {
        const message = getErrorMessage(error)

        if (!cancelled) {
          setStudentsError(message)
          toast.error("Student list unavailable", {
            description: message,
          })
        }
      } finally {
        if (!cancelled) {
          setStudentsLoading(false)
        }
      }
    }

    void loadInitialStudents()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (selectedStudentId === null) {
      return
    }

    const studentId = selectedStudentId
    let cancelled = false

    async function loadSelectedSchedule() {
      setScheduleLoading(true)
      setScheduleError(null)

      try {
        const nextSchedule = await getAdminStudentSchedule(studentId)

        if (!cancelled) {
          setSchedule(nextSchedule)
        }
      } catch (error) {
        const message = getErrorMessage(error)

        if (!cancelled) {
          setSchedule(null)
          setScheduleError(message)
          toast.error("Student schedule unavailable", {
            description: message,
          })
        }
      } finally {
        if (!cancelled) {
          setScheduleLoading(false)
        }
      }
    }

    void loadSelectedSchedule()

    return () => {
      cancelled = true
    }
  }, [selectedStudentId])

  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null
  const timetableCourses = useMemo(() => mapScheduleToTimetableCourses(schedule), [schedule])
  const meetingCount = schedule?.timetable.length ?? 0

  async function handleDropEnrollment(enrollment: AdminEnrollment) {
    setDroppingEnrollmentId(enrollment.enrollmentId)

    try {
      const response = await deleteAdminEnrollment(enrollment.enrollmentId)
      toast.success("Course dropped", {
        description: response.message,
      })

      if (selectedStudentId !== null) {
        await loadSchedule(selectedStudentId)
      }
    } catch (error) {
      const message = getErrorMessage(error)
      toast.error("Drop failed", {
        description: message,
      })
    } finally {
      setDroppingEnrollmentId(null)
    }
  }

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 gap-1.5 bg-blue-50 text-blue-700">
              <UsersRound className="size-3" />
              Administration
            </Badge>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl">
              Student Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review student schedules, inspect weekly course placement, and drop
              registrations when administrative intervention is required.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadStudents()}
              disabled={studentsLoading}
            >
              {studentsLoading ? <Loader2 className="animate-spin" /> : <RefreshCcw />}
              Refresh
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <StudentListPanel
          students={students}
          selectedStudentId={selectedStudentId}
          query={studentQuery}
          loading={studentsLoading}
          error={studentsError}
          onQueryChange={setStudentQuery}
          onSelectStudent={setSelectedStudentId}
          onRetry={() => void loadStudents()}
        />

        <div className="min-w-0 space-y-5">
          {selectedStudent ? (
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <UserRound className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-slate-950">
                      {getStudentLabel(selectedStudent)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedStudent.username} · Student #{selectedStudent.id}
                    </p>
                  </div>
                </div>
                <Badge variant="success" className="shrink-0">
                  {selectedStudent.role}
                </Badge>
              </CardContent>
            </Card>
          ) : null}

          {scheduleLoading ? (
            <DetailSkeleton />
          ) : scheduleError ? (
            <ErrorPanel
              message={scheduleError}
              onRetry={() => {
                if (selectedStudentId !== null) {
                  void loadSchedule(selectedStudentId)
                }
              }}
            />
          ) : !selectedStudent ? (
            <EmptyState
              title="Select a student"
              description="Choose a student from the list to review their weekly timetable and enrolled course registrations."
            />
          ) : schedule ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <ManagementStatCard
                  title="Total credits"
                  value={schedule.totalCredits}
                  description="Current registration load"
                  icon={GraduationCap}
                />
                <ManagementStatCard
                  title="Courses"
                  value={schedule.enrolledCourses.length}
                  description="Active enrolled sections"
                  icon={BookOpenCheck}
                />
                <ManagementStatCard
                  title="Meetings"
                  value={meetingCount}
                  description="Weekly timetable blocks"
                  icon={Clock3}
                />
              </div>

              {timetableCourses.length > 0 ? (
                <WeeklyTimetable courses={timetableCourses} />
              ) : (
                <EmptyState
                  title="No timetable blocks"
                  description="This student has no enrolled courses with scheduled meeting times."
                />
              )}

              <section>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">
                      Enrolled Courses
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Admin-managed registrations for the selected student.
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-slate-50 text-slate-600">
                    {schedule.enrolledCourses.length} registrations
                  </Badge>
                </div>

                {schedule.enrolledCourses.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {schedule.enrolledCourses.map((enrollment) => (
                      <EnrollmentCourseCard
                        key={enrollment.enrollmentId}
                        enrollment={enrollment}
                        dropping={droppingEnrollmentId === enrollment.enrollmentId}
                        onDrop={handleDropEnrollment}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No enrolled courses"
                    description="This student currently has no active course registrations."
                  />
                )}
              </section>
            </>
          ) : (
            <EmptyState
              title="No schedule selected"
              description="Choose a student to load schedule details from the backend."
            />
          )}
        </div>
      </section>
    </>
  )
}
