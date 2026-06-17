"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { api } from "@/lib/api"
import { saveSession, isLoggedIn } from "@/lib/auth"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Factory {
  id: number
  name: string
  city: string | null
  state: string | null
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

export default function LoginPage() {
  const [factories, setFactories] = useState<Factory[]>([])
  const [factoryId, setFactoryId] = useState<string>("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingFactories, setLoadingFactories] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (isLoggedIn()) { router.replace("/dashboard"); return }
    api.get<ApiResponse<Factory[]>>("/auth/factories")
      .then(res => { setFactories(res.data); if (res.data.length === 1) setFactoryId(String(res.data[0].id)) })
      .catch(() => setError("Cannot reach backend. Is the server running?"))
      .finally(() => setLoadingFactories(false))
  }, [router])

  const handleLogin = async () => {
    if (!factoryId || !username || !password) return
    setError("")
    setIsLoading(true)
    try {
      const res = await api.post<ApiResponse<{
        access_token: string
        factory_id: number
        factory_name: string
        user_id: number
        full_name: string | null
        role: string
      }>>("/auth/login", { factory_id: Number(factoryId), username, password })
      saveSession({
        token: res.data.access_token,
        factoryId: res.data.factory_id,
        factoryName: res.data.factory_name,
        userId: res.data.user_id,
        fullName: res.data.full_name,
        role: res.data.role,
      })
      router.push("/dashboard")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed"
      setError(msg === "INVALID_CREDENTIALS" ? "Invalid username or password." : msg)
    } finally {
      setIsLoading(false)
    }
  }

  const canSubmit = !!factoryId && !!username && !!password && !isLoading

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[100dvh]">

      {/* Left — brand panel, always dark */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-950 p-10 relative overflow-hidden">
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Logo mark */}
        <div className="relative flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[5px] flex items-center justify-center" style={{ background: 'hsl(263 58% 40%)' }}>
            <span className="text-white font-bold text-xs tracking-tight">P</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">Padaraksha</span>
        </div>

        {/* Main heading */}
        <div className="relative">
          <p className="text-zinc-600 text-xs font-medium tracking-widest uppercase mb-4">
            Factory Management System
          </p>
          <h1 className="text-[3.5rem] font-bold tracking-[-0.03em] text-white leading-[1.05] mb-5">
            Everything<br />in one<br />
            <span className="text-violet-400">ledger.</span>
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
            Inward materials, production assignments, quality checks, outward delivery, and payroll — tracked in one place.
          </p>
        </div>

        {/* Footer */}
        <p className="relative text-zinc-700 text-xs">
          Built for contract sandal manufacturing · Bengaluru
        </p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center min-h-[100dvh] lg:min-h-0 bg-background dark:bg-zinc-950 px-8 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-7 h-7 rounded-[5px] flex items-center justify-center" style={{ background: 'hsl(263 58% 40%)' }}>
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">Padaraksha</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-1">Sign in</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Select your factory and enter your credentials.
          </p>

          <div className="space-y-4">
            {/* Factory */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Factory</label>
              <Select
                value={factoryId}
                onValueChange={setFactoryId}
                disabled={loadingFactories}
              >
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue placeholder={loadingFactories ? "Loading factories…" : "Select a factory"} />
                </SelectTrigger>
                <SelectContent>
                  {factories.map(f => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}{f.city ? ` — ${f.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-medium text-foreground/80">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === "Enter" && canSubmit && handleLogin()}
                placeholder="e.g. admin"
                autoComplete="username"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-foreground/80">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && canSubmit && handleLogin()}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full h-9 px-3 pr-9 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff className="h-3.5 w-3.5" />
                    : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={!canSubmit}
              className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            >
              {isLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
