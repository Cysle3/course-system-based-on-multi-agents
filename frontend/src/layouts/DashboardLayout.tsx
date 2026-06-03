import { useState } from "react"
import { Outlet } from "react-router-dom"
import { X } from "lucide-react"

import { AppSidebar } from "@/components/AppSidebar"
import { TopNav } from "@/components/TopNav"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:block">
        <AppSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
        />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar overlay"
          />
          <div className="absolute inset-y-0 left-0 w-[280px]">
            <AppSidebar
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute right-4 top-4"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X />
          </Button>
        </div>
      )}

      <div
        className={cn(
          "min-h-screen transition-[padding] duration-300 md:pl-[280px]",
          collapsed && "md:pl-[76px]",
        )}
      >
        <TopNav onOpenSidebar={() => setMobileOpen(true)} />
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
