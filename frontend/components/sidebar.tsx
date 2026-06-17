"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  Boxes,
  Activity,
  CheckCircle,
  ArrowUpFromLine,
  AlertTriangle,
  Users,
  FileText,
  Settings,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"
import { clearSession, getSession } from "@/lib/auth"

const navigation = [
  { name: "Dashboard",       href: "/dashboard",     icon: LayoutDashboard },
  { name: "Articles",        href: "/articles",      icon: Package },
  { name: "Inward Entry",    href: "/inward",        icon: ArrowDownToLine },
  { name: "Inventory",       href: "/inventory",     icon: Boxes },
  { name: "Production",      href: "/production",    icon: Activity },
  { name: "Internal QC",     href: "/quality-check", icon: CheckCircle },
  { name: "Outward",         href: "/outward",       icon: ArrowUpFromLine },
  { name: "Provider QC",     href: "/provider-qc",   icon: AlertTriangle },
  { name: "Payroll",         href: "/payroll",       icon: Users },
  { name: "Reports",         href: "/reports",       icon: FileText },
  { name: "Settings",        href: "/settings",      icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null)
  const [isMac, setIsMac] = useState(true)

  useEffect(() => {
    setMounted(true)
    setSession(getSession())
    setIsMac(navigator.platform.toUpperCase().includes("MAC"))
  }, [])

  useEffect(() => {
    // 1–9 for nav items 1–9, 0 for the 10th (Reports)
    const shortcuts: Record<string, string> = Object.fromEntries(
      navigation.map((item, i) => [i === 9 ? "0" : String(i + 1), item.href])
    )
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && shortcuts[e.key]) {
        e.preventDefault()
        router.push(shortcuts[e.key])
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [router])

  const handleLogout = () => {
    clearSession()
    router.push("/")
  }

  const nextTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const ThemeIcon = theme === "dark" ? Moon : Sun

  return (
    <aside
      className={cn(
        "flex flex-col bg-card dark:bg-zinc-950 border-r border-border dark:border-zinc-800/60 shrink-0 transition-[width] duration-300 ease-out",
        isCollapsed ? "w-14" : "w-56"
      )}
    >
      {/* Header */}
      <div className="flex items-center border-b border-border dark:border-zinc-800/60 px-3 gap-2 h-[72px] shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-[4px] flex items-center justify-center shrink-0" style={{ background: 'hsl(263 58% 40%)' }}>
              <span className="text-white font-bold text-[10px] tracking-tight">P</span>
            </div>
            <span className="text-foreground dark:text-white font-semibold text-sm tracking-tight truncate">Padaraksha</span>
          </div>
        )}
        {!isCollapsed && (
          <button
            onClick={nextTheme}
            title="Toggle theme"
            className="flex items-center justify-center rounded-md text-muted-foreground dark:text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:bg-accent dark:hover:bg-white/5 h-7 w-7 shrink-0"
          >
            {mounted
              ? <ThemeIcon className="h-4 w-4" />
              : <Monitor className="h-4 w-4" />}
          </button>
        )}
        <button
          onClick={() => setIsCollapsed(v => !v)}
          className={cn(
            "flex items-center justify-center rounded-md text-muted-foreground dark:text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:bg-accent dark:hover:bg-white/5 h-7 w-7 shrink-0",
            isCollapsed && "mx-auto"
          )}
        >
          {isCollapsed
            ? <PanelLeft className="h-4 w-4" />
            : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navigation.map((item, i) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const shortcut = i === 9 ? "0" : String(i + 1)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-all duration-150",
                isCollapsed && "justify-center",
                isActive
                  ? "text-violet-600 dark:text-violet-400 bg-violet-500/10 dark:bg-violet-400/10"
                  : "text-muted-foreground dark:text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:bg-accent dark:hover:bg-white/[0.06]"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="truncate flex-1">{item.name}</span>
                  <span className={cn(
                    "shrink-0 text-[10px] font-mono leading-none px-1 py-0.5 rounded border",
                    isActive
                      ? "border-violet-400/40 text-violet-500 dark:text-violet-400 bg-violet-500/10"
                      : "border-border dark:border-zinc-700 text-muted-foreground/50 dark:text-zinc-600"
                  )}>
                    {mounted ? (isMac ? `⌘${shortcut}` : `Ctrl+${shortcut}`) : shortcut}
                  </span>
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border dark:border-zinc-800/60 px-2 h-12 flex items-center">
        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-2 py-1.5 rounded-md text-sm font-medium text-muted-foreground dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/8 transition-all duration-150 w-full",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
