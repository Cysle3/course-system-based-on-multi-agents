import { NavLink } from "react-router-dom"
import {
  BookOpenCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react"

import { getStoredUser, type UserRole } from "@/api/auth"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type AppSidebarProps = {
  collapsed: boolean
  onToggle: () => void
  onNavigate?: () => void
}

type SidebarItem = {
  title: string
  href: string
  icon: typeof LayoutDashboard
  roles?: UserRole[]
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Course List",
    href: "/courses",
    icon: BookOpenCheck,
    roles: ["STUDENT"],
  },
  {
    title: "My Courses",
    href: "/schedule",
    icon: CalendarDays,
    roles: ["STUDENT"],
  },
  {
    title: "Administration",
    href: "/admin",
    icon: ShieldCheck,
    roles: ["ADMIN"],
  },
  {
    title: "Student Management",
    href: "/students",
    icon: UsersRound,
    roles: ["ADMIN"],
  },
]

export function AppSidebar({ collapsed, onToggle, onNavigate }: AppSidebarProps) {
  const role = getStoredUser()?.role ?? "STUDENT"
  const visibleItems = sidebarItems.filter((item) => {
    return !item.roles || item.roles.includes(role)
  })

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-slate-200/80 bg-white shadow-sm transition-all duration-300",
        collapsed ? "w-[76px]" : "w-[280px]",
      )}
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
          <GraduationCap className="size-5" />
        </div>
        <div className={cn("min-w-0", collapsed && "hidden")}>
          <p className="truncate text-sm font-semibold text-slate-950">SCSS University</p>
          <p className="truncate text-xs text-slate-500">Selection System</p>
        </div>
      </div>

      <div className="px-3">
        <Separator />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-2 text-xs font-medium uppercase tracking-normal text-slate-400">
              Workspace
            </p>
          )}
          {visibleItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                  collapsed && "justify-center px-0",
                )
              }
            >
              <item.icon className="size-4 shrink-0" />
              <span className={cn(collapsed && "sr-only")}>{item.title}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-200/80 p-3">
        <div
          className={cn(
            "mb-3 rounded-lg bg-slate-50 p-3",
            collapsed && "flex justify-center p-2",
          )}
        >
          <Settings className="size-4 text-slate-500" />
          {!collapsed && (
            <div className="mt-2">
              <p className="text-xs font-medium text-slate-700">System ready</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Backend API configured at localhost.
              </p>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size={collapsed ? "icon-sm" : "sm"}
          className={cn("w-full text-slate-600", !collapsed && "justify-start")}
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
          {!collapsed && <span>Collapse</span>}
        </Button>
      </div>
    </aside>
  )
}
