import { type FormEvent, useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import {
  ArrowRight,
  GraduationCap,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { isAuthenticated, persistSession } from "@/api/auth"
import { login } from "@/api/client"
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

type LocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const [userId, setUserId] = useState("student")
  const [password, setPassword] = useState("student")
  const [loading, setLoading] = useState(false)

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      const session = await login({ id: userId.trim(), password })
      persistSession(session)
      toast.success(`Welcome, ${session.user.name}`)
      navigate(state?.from?.pathname ?? "/dashboard", { replace: true })
    } catch {
      toast.error("Sign in failed", {
        description: "Check the user ID, password, and backend availability.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">
        <section className="relative hidden overflow-hidden bg-slate-950 text-white lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.45),rgba(15,23,42,0)_45%),radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.28),transparent_30%)]" />
          <div className="relative flex h-full flex-col justify-between p-10">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-blue-500 shadow-lg shadow-blue-950/40">
                <GraduationCap className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold">SCSS University</p>
                <p className="text-xs text-slate-300">Course Selection System</p>
              </div>
            </div>

            <div className="max-w-2xl">
              <Badge className="mb-5 bg-white/10 text-white ring-1 ring-white/15">
                University Management Platform
              </Badge>
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-normal">
                A focused workspace for student registration operations.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                Secure access, structured navigation, and a dashboard foundation
                ready for course selection workflows.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                ["JWT", "Token based access"],
                ["API", "FastAPI backend"],
                ["UI", "Responsive dashboard"],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-lg shadow-slate-950/20 backdrop-blur"
                >
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs text-slate-300">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <GraduationCap className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">SCSS University</p>
                <p className="text-xs text-slate-500">Course Selection System</p>
              </div>
            </div>

            <Card className="shadow-xl shadow-slate-200/80">
              <CardHeader>
                <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <ShieldCheck className="size-5" />
                </div>
                <CardTitle>Sign in</CardTitle>
                <CardDescription>
                  Use your university account to access the dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">User ID</span>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={userId}
                        onChange={(event) => setUserId(event.target.value)}
                        className="pl-9"
                        placeholder="student"
                        autoComplete="username"
                        required
                      />
                    </div>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Password</span>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="pl-9"
                        placeholder="student"
                        autoComplete="current-password"
                        required
                      />
                    </div>
                  </label>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : <KeyRound />}
                    Sign in
                    {!loading && <ArrowRight />}
                  </Button>
                </form>

                <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-700">Demo credentials</p>
                  <p className="mt-1">Student: student / student</p>
                  <p>Admin: admin / admin</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}
