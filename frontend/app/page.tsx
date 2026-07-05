"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building2, Eye, EyeOff, Loader2, LogIn, MapPin, Plus } from "lucide-react"
import { api } from "@/lib/api"
import { saveSession, isLoggedIn } from "@/lib/auth"
import { cn } from "@/lib/utils"

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

interface AuthTokenData {
  access_token: string
  factory_id: number
  factory_name: string
  user_id: number
  full_name: string | null
  role: string
}

type Step = "pick" | "login" | "register"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("pick")
  const [factories, setFactories] = useState<Factory[]>([])
  const [loadingFactories, setLoadingFactories] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [selectedFactory, setSelectedFactory] = useState<Factory | null>(null)

  const loadFactories = () => {
    setLoadingFactories(true)
    setLoadError("")
    api.get<ApiResponse<Factory[]>>("/auth/factories")
      .then(res => setFactories(res.data))
      .catch(() => setLoadError("Cannot reach backend. Is the server running?"))
      .finally(() => setLoadingFactories(false))
  }

  useEffect(() => {
    if (isLoggedIn()) { router.replace("/dashboard"); return }
    loadFactories()
  }, [router])

  const handleAuthenticated = (data: AuthTokenData) => {
    saveSession({
      token: data.access_token,
      factoryId: data.factory_id,
      factoryName: data.factory_name,
      userId: data.user_id,
      fullName: data.full_name,
      role: data.role,
    })
    router.push("/dashboard")
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[100dvh]">

      {/* Left — brand panel, always dark regardless of theme */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-950 p-10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[5px] flex items-center justify-center bg-primary">
            <span className="text-primary-foreground font-bold text-xs tracking-tight">P</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">Padaraksha</span>
        </div>

        <div className="relative">
          <p className="text-zinc-600 text-xs font-medium tracking-widest uppercase mb-4">
            Factory Management System
          </p>
          <h1 className="text-[3.5rem] font-bold tracking-[-0.03em] text-white leading-[1.05] mb-5">
            Everything<br />in one<br />
            <span className="text-primary">ledger.</span>
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
            Inward materials, production assignments, quality checks, outward delivery, and payroll — tracked in one place.
          </p>
        </div>

        <p className="relative text-zinc-700 text-xs">
          Built for contract sandal manufacturing · Mysuru
        </p>
      </div>

      {/* Right — wizard */}
      <div className="flex items-center justify-center min-h-[100dvh] lg:min-h-0 bg-background px-8 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-7 h-7 rounded-[5px] flex items-center justify-center bg-primary">
              <span className="text-primary-foreground font-bold text-xs">P</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">Padaraksha</span>
          </div>

          {step === "pick" && (
            <FactoryPicker
              factories={factories}
              loading={loadingFactories}
              error={loadError}
              onRetry={loadFactories}
              onSelect={f => { setSelectedFactory(f); setStep("login") }}
              onRegisterNew={() => setStep("register")}
            />
          )}

          {step === "login" && selectedFactory && (
            <LoginForm
              factory={selectedFactory}
              onBack={() => setStep("pick")}
              onAuthenticated={handleAuthenticated}
            />
          )}

          {step === "register" && (
            <RegisterForm
              onBack={() => setStep("pick")}
              onAuthenticated={handleAuthenticated}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Step 1: Factory picker ────────────────────────────────────────────────────

function FactoryPicker({ factories, loading, error, onRetry, onSelect, onRegisterNew }: {
  factories: Factory[]
  loading: boolean
  error: string
  onRetry: () => void
  onSelect: (f: Factory) => void
  onRegisterNew: () => void
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight mb-1">Select your factory</h2>
      <p className="text-sm text-muted-foreground mb-8">Choose a factory to sign in to.</p>

      {loading ? (
        <div className="flex items-center gap-2 h-12 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading factories…</span>
        </div>
      ) : error ? (
        <div className="space-y-3">
          <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </p>
          <button
            onClick={onRetry}
            className="h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {factories.map(f => (
            <button
              key={f.id}
              onClick={() => onSelect(f)}
              className="w-full flex items-center gap-3 p-3.5 rounded-md border border-border bg-card hover:border-primary/50 hover:bg-muted/30 transition-colors duration-150 text-left group"
            >
              <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                {(f.city || f.state) && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{[f.city, f.state].filter(Boolean).join(", ")}</span>
                  </p>
                )}
              </div>
            </button>
          ))}

          {factories.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No factories registered yet.</p>
          )}

          <button
            onClick={onRegisterNew}
            className="w-full flex items-center gap-3 p-3.5 rounded-md border border-dashed border-border hover:border-primary/50 hover:bg-muted/20 transition-colors duration-150 text-left group"
          >
            <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0">
              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Register a new factory
            </p>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Step 2: Login ─────────────────────────────────────────────────────────────

function LoginForm({ factory, onBack, onAuthenticated }: {
  factory: Factory
  onBack: () => void
  onAuthenticated: (data: AuthTokenData) => void
}) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const canSubmit = !!username && !!password && !isLoading

  const handleLogin = async () => {
    if (!canSubmit) return
    setError("")
    setIsLoading(true)
    try {
      const res = await api.post<ApiResponse<AuthTokenData>>("/auth/login", {
        factory_id: factory.id,
        username,
        password,
      })
      onAuthenticated(res.data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed"
      setError(msg === "INVALID_CREDENTIALS" ? "Invalid username or password." : msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors duration-150"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All factories
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Building2 className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Sign in to</p>
          <p className="font-semibold text-foreground text-[15px] leading-tight truncate">{factory.name}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="username" className="text-xs font-medium text-foreground/80">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === "Enter" && canSubmit && handleLogin()}
            placeholder="e.g. admin"
            autoFocus
            autoComplete="username"
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
        </div>

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
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={!canSubmit}
          className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-all"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Register new factory ──────────────────────────────────────────────

function RegisterForm({ onBack, onAuthenticated }: {
  onBack: () => void
  onAuthenticated: (data: AuthTokenData) => void
}) {
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [gst, setGst] = useState("")
  const [address, setAddress] = useState("")
  const [adminFullName, setAdminFullName] = useState("")
  const [adminUsername, setAdminUsername] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async () => {
    setError("")
    if (!name.trim()) { setError("Factory name is required."); return }
    if (!adminUsername.trim()) { setError("Admin username is required."); return }
    if (adminPassword.length < 6) { setError("Password must be at least 6 characters."); return }
    if (adminPassword !== confirmPassword) { setError("Passwords don't match."); return }

    setIsLoading(true)
    try {
      const res = await api.post<ApiResponse<AuthTokenData>>("/factories", {
        name: name.trim(),
        gst_number: gst.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        admin_full_name: adminFullName.trim() || undefined,
        admin_username: adminUsername.trim(),
        admin_password: adminPassword,
      })
      onAuthenticated(res.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create factory")
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = "w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"

  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors duration-150"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All factories
      </button>

      <h2 className="text-2xl font-bold tracking-tight mb-1">Register a factory</h2>
      <p className="text-sm text-muted-foreground mb-8">Set up your factory and admin account.</p>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground/80">Factory name <span className="text-destructive">*</span></label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="e.g. Padaraksha Footwear" className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">City</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Bengaluru" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">State</label>
            <input type="text" value={state} onChange={e => setState(e.target.value)} placeholder="Karnataka" className={inputClass} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground/80">GST number</label>
          <input type="text" value={gst} onChange={e => setGst(e.target.value)} placeholder="Optional" className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground/80">Address</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Optional" className={inputClass} />
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mt-3 mb-1">Admin account</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground/80">Your name</label>
          <input type="text" value={adminFullName} onChange={e => setAdminFullName(e.target.value)} placeholder="Optional" className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground/80">Username <span className="text-destructive">*</span></label>
          <input type="text" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} autoComplete="username" placeholder="e.g. admin" className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">Password <span className="text-destructive">*</span></label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Min 6 characters"
                className={cn(inputClass, "pr-9")}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">Confirm <span className="text-destructive">*</span></label>
            <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Re-enter" className={inputClass} />
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}
      </div>

      <button
        onClick={handleRegister}
        disabled={isLoading}
        className="w-full h-9 mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-all"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? "Creating…" : "Create Factory"}
      </button>
    </div>
  )
}
