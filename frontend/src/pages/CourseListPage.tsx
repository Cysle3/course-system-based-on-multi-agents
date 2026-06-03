import { useEffect, useMemo, useState } from "react"
import { AxiosError } from "axios"
import { AlertCircle, BookOpenCheck, RefreshCcw, Search } from "lucide-react"
import { toast } from "sonner"

import {
  enrollInSection,
  getCourseCards,
  getMySchedule,
  type CourseCardData,
  type CourseSection,
} from "@/api/courses"
import { CourseCard } from "@/components/CourseCard"
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

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.message ?? error.response?.data?.detail
    if (typeof detail === "string") {
      return detail
    }
  }

  return "Unable to load courses. Confirm the backend API is running."
}

function CourseCardSkeleton() {
  return (
    <Card className="h-full animate-pulse border-slate-200 bg-white">
      <CardHeader>
        <div className="mb-3 h-5 w-28 rounded bg-slate-100" />
        <div className="h-6 w-3/4 rounded bg-slate-100" />
        <div className="h-4 w-full rounded bg-slate-100" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 w-2/3 rounded bg-slate-100" />
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-4 w-1/2 rounded bg-slate-100" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="h-20 rounded-lg bg-slate-100" />
          <div className="h-20 rounded-lg bg-slate-100" />
        </div>
      </CardContent>
    </Card>
  )
}

function getEnrolledSectionIdsFromSchedule(
  schedule: Awaited<ReturnType<typeof getMySchedule>>,
) {
  return new Set(schedule.registrations.map((registration) => registration.section.id))
}

function getEnrolledCourseCodesFromSchedule(
  schedule: Awaited<ReturnType<typeof getMySchedule>>,
) {
  return new Set(schedule.registrations.map((registration) => registration.course.code))
}

export function CourseListPage() {
  const [courses, setCourses] = useState<CourseCardData[]>([])
  const [enrolledSectionIds, setEnrolledSectionIds] = useState<Set<string>>(() => new Set())
  const [enrolledCourseCodes, setEnrolledCourseCodes] = useState<Set<string>>(
    () => new Set(),
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [enrollingSectionId, setEnrollingSectionId] = useState<string | null>(null)

  async function loadCourses() {
    setLoading(true)
    setError(null)

    try {
      const [nextCourses, schedule] = await Promise.all([getCourseCards(), getMySchedule()])
      setCourses(nextCourses)
      setEnrolledSectionIds(getEnrolledSectionIdsFromSchedule(schedule))
      setEnrolledCourseCodes(getEnrolledCourseCodesFromSchedule(schedule))
    } catch (nextError) {
      const message = getErrorMessage(nextError)
      setError(message)
      toast.error("Course list unavailable", {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadInitialCourses() {
      try {
        const [nextCourses, schedule] = await Promise.all([
          getCourseCards(),
          getMySchedule(),
        ])

        if (!cancelled) {
          setCourses(nextCourses)
          setEnrolledSectionIds(getEnrolledSectionIdsFromSchedule(schedule))
          setEnrolledCourseCodes(getEnrolledCourseCodesFromSchedule(schedule))
        }
      } catch (nextError) {
        const message = getErrorMessage(nextError)

        if (!cancelled) {
          setError(message)
          toast.error("Course list unavailable", {
            description: message,
          })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadInitialCourses()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return courses
    }

    return courses.filter((course) =>
      [course.name, course.code, course.department ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [courses, query])

  async function handleEnroll(course: CourseCardData, section: CourseSection) {
    if (
      enrolledSectionIds.has(section.id) ||
      enrolledCourseCodes.has(course.code) ||
      section.availableSeats <= 0
    ) {
      return
    }

    setEnrollingSectionId(section.id)

    try {
      await enrollInSection(section.id)
      setEnrolledSectionIds((current) => new Set(current).add(section.id))
      setEnrolledCourseCodes((current) => new Set(current).add(course.code))
      setCourses((currentCourses) =>
        currentCourses.map((currentCourse) => {
          if (currentCourse.id !== course.id) {
            return currentCourse
          }

          return {
            ...currentCourse,
            sections: currentCourse.sections.map((currentSection) => {
              if (currentSection.id !== section.id) {
                return currentSection
              }

              const enrolled = currentSection.enrolled + 1
              const availableSeats = Math.max(currentSection.availableSeats - 1, 0)

              return {
                ...currentSection,
                enrolled,
                availableSeats,
                status: availableSeats > 0 ? currentSection.status : "CLOSED",
              }
            }),
          }
        }),
      )
      toast.success("Enrollment successful", {
        description: `${course.code} ${section.sectionName} was added to your schedule.`,
      })
    } catch (nextError) {
      const message = getErrorMessage(nextError)
      toast.error("Enrollment failed", {
        description: message,
      })
    } finally {
      setEnrollingSectionId(null)
    }
  }

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 gap-1.5 bg-blue-50 text-blue-700">
              <BookOpenCheck className="size-3" />
              Course catalog
            </Badge>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl">
              Available Courses
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Browse active course offerings, review seat availability, and enroll
              directly into an open section.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 sm:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Search by name, code, department"
              />
            </div>
            <Button type="button" variant="outline" onClick={() => void loadCourses()}>
              <RefreshCcw />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {loading && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CourseCardSkeleton key={index} />
          ))}
        </section>
      )}

      {!loading && error && (
        <Card className="border-red-200 bg-red-50 shadow-sm">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-red-100 text-red-700">
              <AlertCircle className="size-5" />
            </div>
            <CardTitle className="text-red-950">Course list could not be loaded</CardTitle>
            <CardDescription className="text-red-700">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" onClick={() => void loadCourses()}>
              <RefreshCcw />
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && filteredCourses.length === 0 && (
        <Card className="border-slate-200 bg-white text-center shadow-sm">
          <CardHeader>
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Search className="size-5" />
            </div>
            <CardTitle>No courses found</CardTitle>
            <CardDescription>
              Adjust the search term or refresh the catalog.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!loading && !error && filteredCourses.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              enrollingSectionId={enrollingSectionId}
              enrolledSectionIds={enrolledSectionIds}
              enrolledCourseCodes={enrolledCourseCodes}
              onEnroll={handleEnroll}
            />
          ))}
        </section>
      )}
    </>
  )
}
