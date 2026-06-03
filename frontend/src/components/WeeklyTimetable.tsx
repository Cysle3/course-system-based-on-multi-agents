import { Clock, MapPin, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type WeekDayCode = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"

export type CourseMeeting = {
  day: WeekDayCode
  startTime: string
  endTime: string
  location: string
}

export type TimetableCourse = {
  id: string
  enrollmentId?: number
  sectionId?: string
  code: string
  name: string
  instructor: string
  credits: number
  color: "blue" | "emerald" | "violet" | "amber" | "rose"
  meetings: CourseMeeting[]
}

type TimetableBlock = {
  course: TimetableCourse
  meeting: CourseMeeting
}

type WeeklyTimetableProps = {
  courses: TimetableCourse[]
}

const weekDays: Array<{ code: WeekDayCode; label: string; short: string }> = [
  { code: "MON", label: "Monday", short: "Mon" },
  { code: "TUE", label: "Tuesday", short: "Tue" },
  { code: "WED", label: "Wednesday", short: "Wed" },
  { code: "THU", label: "Thursday", short: "Thu" },
  { code: "FRI", label: "Friday", short: "Fri" },
  { code: "SAT", label: "Saturday", short: "Sat" },
  { code: "SUN", label: "Sunday", short: "Sun" },
]

const hourRows = Array.from({ length: 13 }, (_, index) => 8 + index)
const scheduleStartMinutes = 8 * 60
const scheduleEndMinutes = 20 * 60
const scheduleDurationMinutes = scheduleEndMinutes - scheduleStartMinutes

const blockStyles: Record<TimetableCourse["color"], string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-950 shadow-blue-100/80 hover:bg-blue-100",
  emerald:
    "border-emerald-200 bg-emerald-50 text-emerald-950 shadow-emerald-100/80 hover:bg-emerald-100",
  violet:
    "border-violet-200 bg-violet-50 text-violet-950 shadow-violet-100/80 hover:bg-violet-100",
  amber:
    "border-amber-200 bg-amber-50 text-amber-950 shadow-amber-100/80 hover:bg-amber-100",
  rose: "border-rose-200 bg-rose-50 text-rose-950 shadow-rose-100/80 hover:bg-rose-100",
}

const accentStyles: Record<TimetableCourse["color"], string> = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
}

function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`
}

function getBlockPosition(meeting: CourseMeeting) {
  const start = parseTimeToMinutes(meeting.startTime)
  const end = parseTimeToMinutes(meeting.endTime)
  const top = ((start - scheduleStartMinutes) / scheduleDurationMinutes) * 100
  const height = ((end - start) / scheduleDurationMinutes) * 100

  return {
    top: `${Math.max(top, 0)}%`,
    height: `${Math.max(height, 4)}%`,
  }
}

function buildBlocks(courses: TimetableCourse[]) {
  return courses.flatMap((course) =>
    course.meetings.map((meeting) => ({
      course,
      meeting,
    })),
  )
}

function TimetableCourseBlock({ course, meeting }: TimetableBlock) {
  return (
    <div
      className={cn(
        "absolute left-1 right-1 overflow-hidden rounded-lg border p-2 text-left text-xs shadow-sm transition-all duration-200 hover:z-20 hover:-translate-y-0.5 hover:shadow-lg",
        blockStyles[course.color],
      )}
      style={getBlockPosition(meeting)}
      title={`${course.code} ${course.name}`}
    >
      <div className="flex h-full gap-2">
        <span className={cn("h-full w-1 shrink-0 rounded-full", accentStyles[course.color])} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-semibold">{course.code}</p>
            <Badge variant="outline" className="h-5 border-white/70 bg-white/60 px-1.5">
              {course.credits} cr
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 leading-4">{course.name}</p>
          <div className="mt-1.5 space-y-1 opacity-80">
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              <span>
                {meeting.startTime}-{meeting.endTime}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <UserRound className="size-3" />
              <span className="truncate">{course.instructor}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function WeeklyTimetable({ courses }: WeeklyTimetableProps) {
  const blocks = buildBlocks(courses)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div className="min-w-[1040px]">
          <div className="grid grid-cols-[76px_repeat(7,minmax(132px,1fr))] border-b border-slate-200 bg-slate-50">
            <div className="border-r border-slate-200 px-3 py-3 text-xs font-medium text-slate-500">
              Time
            </div>
            {weekDays.map((day) => (
              <div
                key={day.code}
                className="border-r border-slate-200 px-3 py-3 last:border-r-0"
              >
                <p className="text-sm font-semibold text-slate-900">{day.label}</p>
                <p className="text-xs text-slate-500">{day.short}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[76px_repeat(7,minmax(132px,1fr))]">
            <div className="relative h-[720px] border-r border-slate-200 bg-white">
              {hourRows.map((hour, index) => (
                <div
                  key={hour}
                  className={cn(
                    "absolute left-0 right-0 px-3 text-xs font-medium text-slate-500",
                    index === hourRows.length - 1 && "-translate-y-full",
                  )}
                  style={{
                    top: `${((hour * 60 - scheduleStartMinutes) / scheduleDurationMinutes) * 100}%`,
                  }}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {weekDays.map((day) => (
              <div
                key={day.code}
                className="relative h-[720px] border-r border-slate-200 bg-white last:border-r-0"
              >
                {hourRows.slice(0, -1).map((hour) => (
                  <div
                    key={hour}
                    className="h-[60px] border-b border-slate-100 bg-[linear-gradient(to_bottom,transparent_0,transparent_29px,rgba(226,232,240,0.65)_30px,transparent_31px)]"
                  />
                ))}
                {blocks
                  .filter((block) => block.meeting.day === day.code)
                  .map((block) => (
                    <TimetableCourseBlock
                      key={`${block.course.id}-${block.meeting.day}-${block.meeting.startTime}`}
                      course={block.course}
                      meeting={block.meeting}
                    />
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-medium text-slate-600">Schedule window</span>
        <span>08:00-20:00</span>
        <span className="hidden sm:inline">Course blocks use enrolled meeting times.</span>
      </div>
    </div>
  )
}

export function TimetableCourseSummaryCard({ course }: { course: TimetableCourse }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge variant="outline" className="mb-3 bg-slate-50 text-slate-700">
            {course.code}
          </Badge>
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-950">{course.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <UserRound className="size-3.5" />
            <span className="truncate">{course.instructor}</span>
          </p>
        </div>
        <div className={cn("size-3 shrink-0 rounded-full", accentStyles[course.color])} />
      </div>

      <div className="mt-4 space-y-2">
        {course.meetings.map((meeting) => (
          <div
            key={`${meeting.day}-${meeting.startTime}`}
            className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"
          >
            <span className="font-medium text-slate-700">{meeting.day}</span>
            <span>
              {meeting.startTime}-{meeting.endTime}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
        <MapPin className="size-3.5" />
        <span>{course.meetings[0]?.location ?? "Location TBA"}</span>
      </div>
    </div>
  )
}
