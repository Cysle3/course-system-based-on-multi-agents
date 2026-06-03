import { useNavigate } from "react-router-dom"
import {
  Bell,
  LogOut,
  Menu,
  Search,
  Server,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { API_BASE_URL } from "@/api/client"
import { clearSession, getStoredUser } from "@/api/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type TopNavProps = {
  onOpenSidebar: () => void
}

export function TopNav({ onOpenSidebar }: TopNavProps) {
  const navigate = useNavigate()
  const user = getStoredUser()

  function handleLogout() {
    clearSession()
    toast.success("Signed out")
    navigate("/login", { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          <Menu />
        </Button>
        <div className="hidden h-9 w-[320px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 shadow-inner md:flex">
          <Search className="size-4" />
          <span className="truncate">Search placeholder</span>
        </div>
        <Badge variant="outline" className="hidden gap-1.5 bg-white text-slate-600 lg:inline-flex">
          <Server className="size-3" />
          {API_BASE_URL}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Notifications">
          <Bell />
        </Button>
        <div className="hidden items-center gap-3 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm sm:flex">
          <Avatar>
            <AvatarFallback>{user?.name?.slice(0, 1).toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 pr-2">
            <p className="truncate text-sm font-medium text-slate-900">
              {user?.name ?? "Signed in user"}
            </p>
            <p className="truncate text-xs text-slate-500">{user?.role ?? "USER"}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="hidden sm:inline-flex"
        >
          <LogOut />
          Sign out
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleLogout}
          className="sm:hidden"
          aria-label="Sign out"
        >
          <UserRound />
        </Button>
      </div>
    </header>
  )
}
