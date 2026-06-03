import { useEffect, useMemo, useState } from "react"
import { AxiosError } from "axios"
import {
  AlertCircle,
  BookOpenCheck,
  CalendarDays,
  Clock3,
  GraduationCap,
  RefreshCcw,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import {
  getMySchedule,
  type StudentScheduleResponse,
} from "@/api/courses"
import {
  TimetableCourseSummaryCard,
  WeeklyTimetable,
  type TimetableCourse,
  type WeekDayCode,
} from "@/components/WeeklyTimetable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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
  }

  return "Unable to load your schedule. Confirm the backend API is running."
}

function mapScheduleToTimetableCourses(schedule: StudentScheduleResponse | null) {
  if (!schedule) {
    return []
  }

  const courses: TimetableCourse[] = schedule.registrations.map((registration, index) => ({
    id: String(registration.enrollmentId),
    enrollmentId: registration.enrollmentId,
    sectionId: registration.section.id,
    code: registration.course.code,
    name: registration.course.name,
    instructor: registration.section.instructor ?? "TBA",
    credits: registration.course.credits,
    color: courseColors[index % courseColors.length],
    meetings: registration.section.schedule.flatMap((slot) => {
      const day = slot.day.toUpperCase()

      if (!isWeekDayCode(day)) {
        return []
      }

      return [
        {
          day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          location: registration.section.location ?? "Location TBA",
        },
      ]
    }),
  }))

  return courses
}

function TimetableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-[520px] animate-pulse rounded-xl bg-slate-100" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
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
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
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
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
          <AlertCircle className="size-5" />
        </div>
        <div>
          <p className="font-semibold text-red-950">Schedule could not load</p>
          <p className="mt-1 text-sm text-red-700">{message}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={onRetry}
          >
            <RefreshCcw />
            Try again
          </Button>
        </div>
      </div>
    </div>
  )
}

export function WeeklyTimetablePage() {
  const [schedule, setSchedule] = useState<StudentScheduleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadSchedule() {
    setLoading(true)
    setError(null)

    try {
      const nextSchedule = await getMySchedule()
      setSchedule(nextSchedule)
    } catch (nextError) {
      const message = getErrorMessage(nextError)
      setError(message)
      toast.error("Schedule unavailable", {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadInitialSchedule() {
      try {
        const nextSchedule = await getMySchedule()

        if (!cancelled) {
          setSchedule(nextSchedule)
        }
      } catch (nextError) {
        const message = getErrorMessage(nextError)

        if (!cancelled) {
          setError(message)
          toast.error("Schedule unavailable", {
            description: message,
          })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadInitialSchedule()

    return () => {
      cancelled = true
    }
  }, [])

  const timetableCourses = useMemo(() => mapScheduleToTimetableCourses(schedule), [schedule])
  const totalCredits = schedule?.totalCredits ?? 0
  const totalMeetings = timetableCourses.reduce(
    (sum, course) => sum + course.meetings.length,
    0,
  )
  const registrations = schedule?.registrations ?? []

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 gap-1.5 bg-blue-50 text-blue-700">
              <CalendarDays className="size-3" />
              Weekly timetable
            </Badge>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl">
              My Schedule
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              A weekly view of your enrolled course meetings across the university
              schedule window.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:min-w-[420px]">
            <Card className="border-slate-200 bg-slate-50 shadow-none">
              <CardContent className="p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <GraduationCap className="size-3.5" />
                  Credits
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-950">{totalCredits}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-slate-50 shadow-none">
              <CardContent className="p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Clock3 className="size-3.5" />
                  Meetings
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-950">{totalMeetings}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-slate-50 shadow-none">
              <CardContent className="p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Sparkles className="size-3.5" />
                  Status
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-950">
                  {registrations.length > 0 ? "Active" : "Open"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {loading ? (
        <TimetableSkeleton />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => void loadSchedule()} />
      ) : timetableCourses.length > 0 ? (
        <WeeklyTimetable courses={timetableCourses} />
      ) : (
        <EmptyState
          title="No timetable blocks"
          description="You do not have enrolled courses with scheduled meeting times yet."
        />
      )}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-950">Enrolled Courses</h2>
          <p className="mt-1 text-sm text-slate-600">
            Current class sections for the week.
          </p>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : registrations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {timetableCourses.map((course) => (
              <TimetableCourseSummaryCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No enrolled courses"
            description="Registered courses will appear here after you enroll from the course list."
          />
        )}
      </section>
    </>
  )
}
