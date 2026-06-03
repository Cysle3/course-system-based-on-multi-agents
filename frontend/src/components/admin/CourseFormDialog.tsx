import { type FormEvent } from "react"

import type { CourseFormValues } from "@/pages/AdminDashboardPage"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type CourseFormDialogProps = {
  open: boolean
  mode: "create" | "edit"
  values: CourseFormValues
  busy?: boolean
  onOpenChange: (open: boolean) => void
  onValuesChange: (values: CourseFormValues) => void
  onSubmit: (values: CourseFormValues) => void
}

export function CourseFormDialog({
  open,
  mode,
  values,
  busy = false,
  onOpenChange,
  onValuesChange,
  onSubmit,
}: CourseFormDialogProps) {
  function updateValue<Key extends keyof CourseFormValues>(
    key: Key,
    value: CourseFormValues[Key],
  ) {
    onValuesChange({ ...values, [key]: value })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Course" : "Edit Course"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a course section to the active catalog."
              : "Update section operations data for this course."}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Course code</span>
              <Input
                value={values.code}
                onChange={(event) => updateValue("code", event.target.value.toUpperCase())}
                placeholder="CS301"
                disabled={mode === "edit"}
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Credits</span>
              <Input
                type="number"
                min={1}
                max={30}
                value={values.credits}
                onChange={(event) => updateValue("credits", Number(event.target.value))}
                disabled={mode === "edit"}
                required
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Course name</span>
            <Input
              value={values.name}
              onChange={(event) => updateValue("name", event.target.value)}
              placeholder="Advanced Software Engineering"
              disabled={mode === "edit"}
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Department</span>
              <Input
                value={values.department}
                onChange={(event) => updateValue("department", event.target.value)}
                disabled={mode === "edit"}
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Instructor</span>
              <Input
                value={values.instructor}
                onChange={(event) => updateValue("instructor", event.target.value)}
                placeholder="Dr. Taylor"
                required
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Capacity</span>
              <Input
                type="number"
                min={1}
                value={values.capacity}
                onChange={(event) => updateValue("capacity", Number(event.target.value))}
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Location</span>
              <Input
                value={values.location}
                onChange={(event) => updateValue("location", event.target.value)}
                required
              />
            </label>
          </div>

          {mode === "create" && (
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Day</span>
                <Input
                  value={values.day}
                  onChange={(event) => updateValue("day", event.target.value.toUpperCase())}
                  placeholder="MON"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Start</span>
                <Input
                  value={values.startTime}
                  onChange={(event) => updateValue("startTime", event.target.value)}
                  placeholder="09:00"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">End</span>
                <Input
                  value={values.endTime}
                  onChange={(event) => updateValue("endTime", event.target.value)}
                  placeholder="10:30"
                  required
                />
              </label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving" : mode === "create" ? "Create course" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
