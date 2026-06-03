import { Edit3, Loader2, Trash2 } from "lucide-react"

import type { AdminCourseRow } from "@/pages/AdminDashboardPage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type CourseManagementTableProps = {
  courses: AdminCourseRow[]
  onEdit: (course: AdminCourseRow) => void
  onDelete: (course: AdminCourseRow) => void | Promise<void>
  deletingCourseCode?: string | null
}

export function CourseManagementTable({
  courses,
  onEdit,
  onDelete,
  deletingCourseCode,
}: CourseManagementTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50 hover:bg-slate-50">
          <TableHead>Course code</TableHead>
          <TableHead>Course name</TableHead>
          <TableHead>Instructor</TableHead>
          <TableHead className="text-right">Capacity</TableHead>
          <TableHead className="text-right">Enrollment</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[132px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map((course) => (
          <TableRow key={course.id}>
            <TableCell>
              <div className="font-semibold text-slate-950">{course.courseCode}</div>
              <div className="text-xs text-slate-500">{course.sectionName}</div>
            </TableCell>
            <TableCell className="min-w-[220px]">
              <div className="font-medium text-slate-800">{course.courseName}</div>
              <div className="text-xs text-slate-500">{course.department}</div>
            </TableCell>
            <TableCell>{course.instructor ?? "TBA"}</TableCell>
            <TableCell className="text-right">{course.capacity}</TableCell>
            <TableCell className="text-right">
              <span className="font-medium text-slate-950">{course.enrolled}</span>
              <span className="text-slate-400"> / {course.capacity}</span>
            </TableCell>
            <TableCell>
              <Badge
                variant={course.status === "OPEN" ? "success" : "outline"}
                className={course.status !== "OPEN" ? "bg-slate-50 text-slate-500" : undefined}
              >
                {course.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onEdit(course)}
                  aria-label={`Edit ${course.courseCode}`}
                >
                  <Edit3 />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  disabled={deletingCourseCode === course.courseCode}
                  onClick={() => {
                    void onDelete(course)
                  }}
                  aria-label={`Delete ${course.courseCode}`}
                >
                  {deletingCourseCode === course.courseCode ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Trash2 />
                  )}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
