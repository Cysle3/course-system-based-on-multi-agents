import { Navigate, Outlet, useLocation } from "react-router-dom"

import { getStoredUser, isAuthenticated, type UserRole } from "@/api/auth"

type ProtectedRouteProps = {
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles?.length) {
    const role = getStoredUser()?.role

    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <Outlet />
}
