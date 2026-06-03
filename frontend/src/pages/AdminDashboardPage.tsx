import { useEffect, useMemo, useState } from "react"
import { AxiosError } from "axios"
import {
  AlertCircle,
  Building2,
  CirclePlus,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import {
  createCourse,
  deleteCourse,
  getEnrollmentReport,
  type EnrollmentReportItem,
} from "@/api/admin"
import { CourseFormDialog } from "@/components/admin/CourseFormDialog"
import { CourseManagementTable } from "@/components/admin/CourseManagementTable"
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

export type AdminCourseRow = {
  id: string
  courseCode: string
  courseName: string
  department: string
  sectionName: string
  instructor: string | null
  capacity: number
  enrolled: number
  credits: number
  location: string
  availabilityPercentage: number
  status: string
}

export type CourseFormValues = {
  code: string
  name: string
  department: string
  instructor: string
  capacity: number
  credits: number
  location: string
  day: string
  startTime: string
  endTime: string
}

const emptyFormValues: CourseFormValues = {
  code: "",
  name: "",
  department: "Computer Science",
  instructor: "",
  capacity: 30,
  credits: 3,
  location: "Main Campus",
  day: "MON",
  startTime: "09:00",
  endTime: "10:30",
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

    if (error.response?.status === 403) {
      return "This admin view requires an administrator account."
    }
  }

  return "Unable to load admin dashboard data. Confirm the backend API is running."
}

function inferDepartment(courseCode: string) {
  if (courseCode.startsWith("CS")) {
    return "Computer Science"
  }
  if (courseCode.startsWith("MATH")) {
    return "Mathematics"
  }
  if (courseCode.startsWith("HIST")) {
    return "History"
  }
  return "General Studies"
}

function normalizeReportRow(
  item: EnrollmentReportItem,
  createdNames: Record<string, string>,
  overrides: Record<string, Partial<AdminCourseRow>>,
): AdminCourseRow {
  const id = `${item.courseCode}-${item.sectionName}`
  const baseRow: AdminCourseRow = {
    id,
    courseCode: item.courseCode,
    courseName:
      createdNames[item.courseCode] ??
      seededCourseNames[item.courseCode] ??
      `${item.courseCode} Course`,
    department: inferDepartment(item.courseCode),
    sectionName: item.sectionName,
    instructor: item.instructor,
    capacity: item.capacity,
    enrolled: item.enrolled,
    credits: 3,
    location: "Main Campus",
    availabilityPercentage: item.availabilityPercentage,
    status: item.status,
  }

  return { ...baseRow, ...overrides[id] }
}

function AdminTableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid animate-pulse grid-cols-6 gap-4">
          <div className="h-9 rounded bg-slate-100" />
          <div className="col-span-2 h-9 rounded bg-slate-100" />
          <div className="h-9 rounded bg-slate-100" />
          <div className="h-9 rounded bg-slate-100" />
          <div className="h-9 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

export function AdminDashboardPage() {
  const [reportRows, setReportRows] = useState<EnrollmentReportItem[]>([])
  const [createdNames, setCreatedNames] = useState<Record<string, string>>({})
  const [overrides, setOverrides] = useState<Record<string, Partial<AdminCourseRow>>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [selectedCourse, setSelectedCourse] = useState<AdminCourseRow | null>(null)
  const [formValues, setFormValues] = useState<CourseFormValues>(emptyFormValues)
  const [saving, setSaving] = useState(false)
  const [deletingCourseCode, setDeletingCourseCode] = useState<string | null>(null)

  async function refreshReport() {
    setLoading(true)
    setError(null)

    try {
      const report = await getEnrollmentReport()
      setReportRows(report.data)
    } catch (nextError) {
      const message = getErrorMessage(nextError)
      setError(message)
      toast.error("Admin data unavailable", {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadInitialReport() {
      try {
        const report = await getEnrollmentReport()

        if (!cancelled) {
          setReportRows(report.data)
        }
      } catch (nextError) {
        const message = getErrorMessage(nextError)

        if (!cancelled) {
          setError(message)
          toast.error("Admin data unavailable", {
            description: message,
          })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadInitialReport()

    return () => {
      cancelled = true
    }
  }, [])

  const rows = useMemo(
    () => reportRows.map((item) => normalizeReportRow(item, createdNames, overrides)),
    [createdNames, overrides, reportRows],
  )

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return rows
    }

    return rows.filter((row) =>
      [row.courseCode, row.courseName, row.instructor ?? "", row.department]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [query, rows])

  function openCreateDialog() {
    setDialogMode("create")
    setSelectedCourse(null)
    setFormValues(emptyFormValues)
    setDialogOpen(true)
  }

  function openEditDialog(course: AdminCourseRow) {
    setDialogMode("edit")
    setSelectedCourse(course)
    setFormValues({
      code: course.courseCode,
      name: course.courseName,
      department: course.department,
      instructor: course.instructor ?? "",
      capacity: course.capacity,
      credits: course.credits,
      location: course.location,
      day: "MON",
      startTime: "09:00",
      endTime: "10:30",
    })
    setDialogOpen(true)
  }

  async function handleFormSubmit(values: CourseFormValues) {
    setSaving(true)

    try {
      if (dialogMode === "create") {
        await createCourse({
          code: values.code,
          name: values.name,
          department: values.department,
          credits: values.credits,
          description: `${values.name} course section.`,
          prerequisites: [],
          sectionName: "Section A",
          instructorName: values.instructor,
          location: values.location,
          capacity: values.capacity,
          schedule: [
            {
              day: values.day,
              startTime: values.startTime,
              endTime: values.endTime,
            },
          ],
        })

        setCreatedNames((current) => ({ ...current, [values.code]: values.name }))
        toast.success("Course created", {
          description: `${values.code} was added to the catalog.`,
        })
        setDialogOpen(false)
        await refreshReport()
        return
      }

      if (selectedCourse) {
        setOverrides((current) => ({
          ...current,
          [selectedCourse.id]: {
            instructor: values.instructor,
            capacity: values.capacity,
            location: values.location,
          },
        }))
        toast.success("Course updated", {
          description: "The table has been updated for this admin session.",
        })
      }

      setDialogOpen(false)
    } catch (nextError) {
      const message = getErrorMessage(nextError)
      toast.error("Save failed", {
        description: message,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(course: AdminCourseRow) {
    setDeletingCourseCode(course.courseCode)

    try {
      const response = await deleteCourse(course.courseCode)
      setReportRows((current) =>
        current.filter((row) => row.courseCode !== course.courseCode),
      )
      toast.success("Course deleted", {
        description: response.message,
      })
      await refreshReport()
    } catch (nextError) {
      const message = getErrorMessage(nextError)
      toast.error("Delete failed", {
        description: message,
      })
    } finally {
      setDeletingCourseCode(null)
    }
  }

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 gap-1.5 bg-blue-50 text-blue-700">
              <ShieldCheck className="size-3" />
              Administration
            </Badge>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl">
              Course Administration
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage course creation, section updates, and course deletion from
              the administration workspace.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => void refreshReport()}>
              <RefreshCcw />
              Refresh
            </Button>
            <Button type="button" onClick={openCreateDialog}>
              <CirclePlus />
              Create Course
            </Button>
          </div>
        </div>
      </section>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="gap-4 border-b border-slate-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Course Management</CardTitle>
              <CardDescription>
                Operational view of course capacity and current enrollment.
              </CardDescription>
            </div>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courses, instructors, departments"
              className="lg:max-w-sm"
            />
          </div>
        </CardHeader>

        {loading && <AdminTableSkeleton />}

        {!loading && error && (
          <CardContent className="p-5">
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
                  <AlertCircle className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-red-950">Admin data could not load</p>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => void refreshReport()}
                  >
                    <RefreshCcw />
                    Try again
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}

        {!loading && !error && filteredRows.length === 0 && (
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Building2 className="size-5" />
            </div>
            <p className="font-semibold text-slate-950">No courses found</p>
            <p className="mt-1 text-sm text-slate-500">
              Create a course or adjust your search term.
            </p>
          </CardContent>
        )}

        {!loading && !error && filteredRows.length > 0 && (
          <CourseManagementTable
            courses={filteredRows}
            onEdit={openEditDialog}
            onDelete={handleDelete}
            deletingCourseCode={deletingCourseCode}
          />
        )}
      </Card>

      <CourseFormDialog
        open={dialogOpen}
        mode={dialogMode}
        values={formValues}
        busy={saving}
        onOpenChange={setDialogOpen}
        onValuesChange={setFormValues}
        onSubmit={handleFormSubmit}
      />
    </>
  )
}
