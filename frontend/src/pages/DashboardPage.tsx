import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AxiosError } from "axios"
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarClock,
  CalendarDays,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  RefreshCcw,
  UserRound,
  UsersRound,
} from "lucide-react"
import { toast } from "sonner"

import { getStoredUser } from "@/api/auth"
import {
  getAdminStudents,
  getEnrollmentReport,
  type AdminStudent,
  type EnrollmentReportItem,
} from "@/api/admin"
import {
  getMySchedule,
  type ScheduleSlot,
  type StudentScheduleRegistration,
  type StudentScheduleResponse,
} from "@/api/courses"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const dayCodes = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const

type TodayClass = {
  registration: StudentScheduleRegistration
  slot: ScheduleSlot
}

type AdminCourseSummary = {
  courseCode: string
  courseName: string
  enrolled: number
  capacity: number
  sections: number
}

const seededCourseNames: Record<string, string> = {
  CS101: "Introduction to Computer Science",
  CS102: "Data Structures",
  MATH200: "Calculus II",
  HIST202: "Modern History",
}

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.message ?? error.response?.data?.detail

    if (typeof detail === "string") {
      return detail
    }
  }

  return "Unable to load dashboard schedule data. Confirm the backend API is running."
}

function getAdminErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.message ?? error.response?.data?.detail

    if (typeof detail === "string") {
      return detail
    }

    if (error.response?.status === 403) {
      return "This dashboard requires an administrator account."
    }
  }

  return "Unable to load admin dashboard data. Confirm the backend API is running."
}

function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function countScheduleConflicts(registrations: StudentScheduleRegistration[]) {
  const meetings = registrations.flatMap((registration) =>
    registration.section.schedule.map((slot) => ({
      registration,
      slot,
      start: parseTimeToMinutes(slot.startTime),
      end: parseTimeToMinutes(slot.endTime),
    })),
  )

  let conflicts = 0

  for (let index = 0; index < meetings.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < meetings.length; nextIndex += 1) {
      const first = meetings[index]
      const second = meetings[nextIndex]

      if (
        first.registration.enrollmentId !== second.registration.enrollmentId &&
        first.slot.day === second.slot.day &&
        first.start < second.end &&
        second.start < first.end
      ) {
        conflicts += 1
      }
    }
  }

  return conflicts
}

function getTodayClasses(registrations: StudentScheduleRegistration[]) {
  const today = dayCodes[new Date().getDay()]

  return registrations
    .flatMap((registration) =>
      registration.section.schedule
        .filter((slot) => slot.day.toUpperCase() === today)
        .map((slot) => ({ registration, slot })),
    )
    .sort(
      (first, second) =>
        parseTimeToMinutes(first.slot.startTime) -
        parseTimeToMinutes(second.slot.startTime),
    )
}

function getCourseName(courseCode: string) {
  return seededCourseNames[courseCode] ?? `${courseCode} Course`
}

function getAdminStats(reportRows: EnrollmentReportItem[], students: AdminStudent[]) {
  const totalEnrollments = reportRows.reduce((sum, row) => sum + row.enrolled, 0)
  const totalCourses = new Set(reportRows.map((row) => row.courseCode)).size
  const totalSections = reportRows.length

  return {
    totalStudents: students.length,
    totalCourses,
    totalEnrollments,
    totalSections,
  }
}

function getTopEnrolledCourses(reportRows: EnrollmentReportItem[]) {
  const grouped = new Map<string, AdminCourseSummary>()

  for (const row of reportRows) {
    const current = grouped.get(row.courseCode)

    if (current) {
      current.enrolled += row.enrolled
      current.capacity += row.capacity
      current.sections += 1
    } else {
      grouped.set(row.courseCode, {
        courseCode: row.courseCode,
        courseName: getCourseName(row.courseCode),
        enrolled: row.enrolled,
        capacity: row.capacity,
        sections: 1,
      })
    }
  }

  return Array.from(grouped.values())
    .sort((first, second) => {
      if (second.enrolled !== first.enrolled) {
        return second.enrolled - first.enrolled
      }

      return first.courseCode.localeCompare(second.courseCode)
    })
    .slice(0, 5)
}

function DashboardStatCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string
  value: string | number
  description: string
  icon: typeof GraduationCap
  tone: string
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
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
    <Card className="border-red-200 bg-red-50 shadow-sm">
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-red-100 text-red-700">
          <AlertCircle className="size-5" />
        </div>
        <CardTitle className="text-red-950">Dashboard data could not load</CardTitle>
        <CardDescription className="text-red-700">{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="outline" onClick={onRetry}>
          <RefreshCcw />
          Try again
        </Button>
      </CardContent>
    </Card>
  )
}

function TodayClassRow({ item }: { item: TodayClass }) {
  const { registration, slot } = item

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {registration.course.code}
            </Badge>
            <Badge variant="secondary" className="text-slate-600">
              {registration.section.sectionName}
            </Badge>
          </div>
          <p className="font-semibold text-slate-950">{registration.course.name}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <UserRound className="size-3.5" />
            {registration.section.instructor ?? "Instructor TBA"}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock3 className="size-4 text-slate-400" />
            {slot.startTime}-{slot.endTime}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="size-3.5" />
            {registration.section.location ?? "Location TBA"}
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminDashboardContent({
  students,
  reportRows,
}: {
  students: AdminStudent[]
  reportRows: EnrollmentReportItem[]
}) {
  const stats = getAdminStats(reportRows, students)
  const topEnrolledCourses = getTopEnrolledCourses(reportRows)

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Total Students"
          value={stats.totalStudents}
          description="Student accounts"
          icon={UsersRound}
          tone="bg-blue-50 text-blue-700"
        />
        <DashboardStatCard
          title="Total Courses"
          value={stats.totalCourses}
          description="Unique course codes"
          icon={BookOpenCheck}
          tone="bg-emerald-50 text-emerald-700"
        />
        <DashboardStatCard
          title="Total Enrollments"
          value={stats.totalEnrollments}
          description="Current registrations"
          icon={BarChart3}
          tone="bg-violet-50 text-violet-700"
        />
        <DashboardStatCard
          title="Total Sections"
          value={stats.totalSections}
          description="Active course sections"
          icon={Building2}
          tone="bg-slate-100 text-slate-700"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Top Enrolled Courses</CardTitle>
                <CardDescription>
                  Courses ranked by total enrollment across all sections.
                </CardDescription>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <BarChart3 className="size-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {topEnrolledCourses.length > 0 ? (
              <div className="space-y-3">
                {topEnrolledCourses.map((course, index) => {
                  const utilization =
                    course.capacity > 0
                      ? Math.round((course.enrolled / course.capacity) * 100)
                      : 0

                  return (
                    <div
                      key={course.courseCode}
                      className="rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-2 flex items-center gap-2">
                            <Badge variant="outline" className="bg-slate-50 text-slate-700">
                              #{index + 1}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {course.courseCode}
                            </Badge>
                          </div>
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {course.courseName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {course.sections} sections · {course.capacity} seats
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-slate-950">
                            {course.enrolled}
                          </p>
                          <p className="text-xs text-slate-500">enrolled</p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-slate-500">
                        <span>{utilization}% utilization</span>
                        <span>
                          {course.enrolled}/{course.capacity}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <p className="font-semibold text-slate-950">No enrollment data</p>
                <p className="mt-2 text-sm text-slate-500">
                  Course enrollment rankings appear once sections are available.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump into common administration workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-between">
              <Link to="/admin">
                <span className="flex items-center gap-2">
                  <BookOpenCheck />
                  Course Management
                </span>
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/students">
                <span className="flex items-center gap-2">
                  <UsersRound />
                  Student Management
                </span>
                <ArrowRight />
              </Link>
            </Button>
            <div className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-600">
              <p className="font-medium text-slate-800">Administrative summary</p>
              <p className="mt-1 text-xs leading-5">
                {stats.totalStudents} students, {stats.totalCourses} courses, and{" "}
                {stats.totalSections} active sections.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  )
}

export function DashboardPage() {
  const user = getStoredUser()
  const isStudent = user?.role === "STUDENT"
  const [schedule, setSchedule] = useState<StudentScheduleResponse | null>(null)
  const [adminStudents, setAdminStudents] = useState<AdminStudent[]>([])
  const [adminReportRows, setAdminReportRows] = useState<EnrollmentReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadDashboardData() {
    setLoading(true)
    setError(null)

    try {
      if (isStudent) {
        const nextSchedule = await getMySchedule()
        setSchedule(nextSchedule)
        return
      }

      const [students, report] = await Promise.all([
        getAdminStudents(),
        getEnrollmentReport(),
      ])
      setAdminStudents(students)
      setAdminReportRows(report.data)
    } catch (nextError) {
      const message = isStudent
        ? getErrorMessage(nextError)
        : getAdminErrorMessage(nextError)
      setError(message)
      toast.error("Dashboard data unavailable", {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadInitialDashboardData() {
      try {
        if (isStudent) {
          const nextSchedule = await getMySchedule()

          if (!cancelled) {
            setSchedule(nextSchedule)
          }
          return
        }

        const [students, report] = await Promise.all([
          getAdminStudents(),
          getEnrollmentReport(),
        ])

        if (!cancelled) {
          setAdminStudents(students)
          setAdminReportRows(report.data)
        }
      } catch (nextError) {
        const message = isStudent
          ? getErrorMessage(nextError)
          : getAdminErrorMessage(nextError)

        if (!cancelled) {
          setError(message)
          toast.error("Dashboard data unavailable", {
            description: message,
          })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadInitialDashboardData()

    return () => {
      cancelled = true
    }
  }, [isStudent])

  const registrations = useMemo(() => schedule?.registrations ?? [], [schedule])
  const weeklyClasses = registrations.reduce(
    (sum, registration) => sum + registration.section.schedule.length,
    0,
  )
  const scheduleConflicts = useMemo(
    () => countScheduleConflicts(registrations),
    [registrations],
  )
  const todayClasses = useMemo(() => getTodayClasses(registrations), [registrations])

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="success" className="mb-3 gap-1.5">
              <LayoutDashboard className="size-3" />
              {isStudent ? "Student dashboard" : "Admin dashboard"}
            </Badge>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl">
              Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {isStudent
                ? "Track current enrollment, daily classes, and the most common course-selection actions from one workspace."
                : "Review university-wide course, section, student, and enrollment activity from one workspace."}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-950">
                {user?.name ?? "University user"}
              </p>
              <p className="text-xs text-slate-500">{user?.role ?? "USER"}</p>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => void loadDashboardData()} />
      ) : !isStudent ? (
        <AdminDashboardContent students={adminStudents} reportRows={adminReportRows} />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCard
              title="Enrolled Courses"
              value={registrations.length}
              description="Active registrations"
              icon={BookOpenCheck}
              tone="bg-blue-50 text-blue-700"
            />
            <DashboardStatCard
              title="Total Credits"
              value={schedule?.totalCredits ?? 0}
              description="Current credit load"
              icon={GraduationCap}
              tone="bg-emerald-50 text-emerald-700"
            />
            <DashboardStatCard
              title="Weekly Classes"
              value={weeklyClasses}
              description="Scheduled meeting blocks"
              icon={CalendarDays}
              tone="bg-violet-50 text-violet-700"
            />
            <DashboardStatCard
              title="Schedule Conflicts"
              value={scheduleConflicts}
              description={scheduleConflicts === 0 ? "No overlaps detected" : "Review needed"}
              icon={AlertCircle}
              tone={
                scheduleConflicts === 0
                  ? "bg-slate-100 text-slate-700"
                  : "bg-red-50 text-red-700"
              }
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Today's Classes</CardTitle>
                    <CardDescription>
                      Classes scheduled for {dayCodes[new Date().getDay()]}.
                    </CardDescription>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <CalendarClock className="size-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {todayClasses.length > 0 ? (
                  <div className="space-y-3">
                    {todayClasses.map((item) => (
                      <TodayClassRow
                        key={`${item.registration.enrollmentId}-${item.slot.day}-${item.slot.startTime}`}
                        item={item}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                    <p className="font-semibold text-slate-950">No classes today</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Your enrolled classes for other days remain available in My Courses.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Jump into common course-selection workflows.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-between">
                  <Link to="/courses">
                    <span className="flex items-center gap-2">
                      <BookOpenCheck />
                      Browse Courses
                    </span>
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/schedule">
                    <span className="flex items-center gap-2">
                      <CalendarDays />
                      View My Courses
                    </span>
                    <ArrowRight />
                  </Link>
                </Button>
                <div className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">Schedule summary</p>
                  <p className="mt-1 text-xs leading-5">
                    {registrations.length} enrolled courses across {weeklyClasses} weekly
                    class meetings.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </>
  )
}
