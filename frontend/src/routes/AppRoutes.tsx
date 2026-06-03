import { Navigate, Route, Routes } from "react-router-dom"

import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { AdminDashboardPage } from "@/pages/AdminDashboardPage"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { CourseListPage } from "@/pages/CourseListPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { LoginPage } from "@/pages/LoginPage"
import { StudentManagementPage } from "@/pages/StudentManagementPage"
import { WeeklyTimetablePage } from "@/pages/WeeklyTimetablePage"

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
            <Route path="/courses" element={<CourseListPage />} />
            <Route path="/schedule" element={<WeeklyTimetablePage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/students" element={<StudentManagementPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
