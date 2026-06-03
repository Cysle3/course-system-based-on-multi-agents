import {
  BookOpenText,
  CalendarDays,
  GraduationCap,
  MapPin,
  UserRound,
  UsersRound,
} from "lucide-react"

import { type CourseCardData, type CourseSection } from "@/api/courses"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type CourseCardProps = {
  course: CourseCardData
  enrollingSectionId: string | null
  enrolledSectionIds: Set<string>
  enrolledCourseCodes: Set<string>
  onEnroll: (course: CourseCardData, section: CourseSection) => void
}

function formatSchedule(section: CourseSection | undefined) {
  if (!section || section.schedule.length === 0) {
    return "Schedule TBA"
  }

  return section.schedule
    .map((slot) => `${slot.day} ${slot.startTime}-${slot.endTime}`)
    .join(", ")
}

function getPrimarySection(course: CourseCardData, enrolledSectionIds: Set<string>) {
  return (
    course.sections.find((section) => enrolledSectionIds.has(section.id)) ??
    course.sections.find(
      (section) => section.status === "OPEN" && section.availableSeats > 0,
    ) ?? course.sections[0]
  )
}

export function CourseCard({
  course,
  enrollingSectionId,
  enrolledSectionIds,
  enrolledCourseCodes,
  onEnroll,
}: CourseCardProps) {
  const section = getPrimarySection(course, enrolledSectionIds)
  const isEnrolled = Boolean(
    section && (enrolledSectionIds.has(section.id) || enrolledCourseCodes.has(course.code)),
  )
  const isFull = Boolean(section && section.availableSeats <= 0)
  const isAvailable = Boolean(
    section && section.status === "OPEN" && section.availableSeats > 0,
  )
  const isEnrolling = section?.id === enrollingSectionId
  const canEnroll = Boolean(section && !isEnrolled && !isFull && isAvailable && !isEnrolling)
  const buttonText = isEnrolled ? "Enrolled" : isFull || !isAvailable ? "Full" : "Enroll"

  return (
    <Card className="flex h-full flex-col overflow-hidden border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {course.code}
              </Badge>
              {course.department && (
                <Badge variant="secondary" className="text-slate-600">
                  {course.department}
                </Badge>
              )}
            </div>
            <CardTitle className="line-clamp-2 text-lg leading-6">
              {course.name}
            </CardTitle>
            <CardDescription className="mt-2 line-clamp-2">
              {course.description ?? "No course description is available yet."}
            </CardDescription>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <BookOpenText className="size-5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="grid gap-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <UserRound className="size-4 text-slate-400" />
            <span className="truncate">{section?.instructor ?? "Instructor TBA"}</span>
          </div>
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <span className="line-clamp-2">{formatSchedule(section)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-slate-400" />
            <span className="truncate">{section?.location ?? "Location TBA"}</span>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <UsersRound className="size-3.5" />
              Capacity
            </div>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              {section ? `${section.enrolled}/${section.capacity}` : "TBA"}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <GraduationCap className="size-3.5" />
              Credits
            </div>
            <p className="mt-1 text-lg font-semibold text-slate-950">{course.credits}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Badge
            variant={isAvailable && !isEnrolled ? "success" : "outline"}
            className={
              !isAvailable || isEnrolled ? "bg-slate-50 text-slate-500" : undefined
            }
          >
            {isEnrolled
              ? "In schedule"
              : isAvailable
                ? `${section?.availableSeats} seats open`
                : "Closed"}
          </Badge>
          <Button
            type="button"
            disabled={!canEnroll}
            variant={isEnrolled || isFull || !isAvailable ? "secondary" : "default"}
            className={
              isEnrolled || isFull || !isAvailable
                ? "bg-slate-700 text-white hover:bg-slate-700"
                : undefined
            }
            onClick={() => {
              if (section && canEnroll) {
                onEnroll(course, section)
              }
            }}
          >
            {isEnrolling ? "Enrolling" : buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
