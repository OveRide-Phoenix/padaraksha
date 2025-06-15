"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  Activity,
  CheckCircle,
  ArrowUpFromLine,
  AlertTriangle,
  Users,
  FileText,
  Menu,
  X,
  LogOut,
  Building2,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Article Management", href: "/articles", icon: Package },
  { name: "Inward Entry", href: "/inward", icon: ArrowDownToLine },
  { name: "Production Tracking", href: "/production", icon: Activity },
  { name: "Internal Quality Check", href: "/quality-check", icon: CheckCircle },
  { name: "Outward Delivery", href: "/outward", icon: ArrowUpFromLine },
  { name: "Provider Company QC", href: "/provider-qc", icon: AlertTriangle },
  { name: "Employee & Payroll", href: "/payroll", icon: Users },
  { name: "Reports", href: "/reports", icon: FileText },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = () => {
    // Clear any stored data
    localStorage.removeItem("selectedFactory")
    // Redirect to login
    router.push("/")
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-card border-r border-border",
        isCollapsed ? "w-16" : "w-64",
        "transition-all duration-300",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-card-foreground">Factory MS</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {!isCollapsed && <ThemeToggle />}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-muted-foreground hover:text-card-foreground hover:bg-accent"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn("sidebar-item", isActive && "active", isCollapsed && "justify-center")}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full text-muted-foreground hover:text-card-foreground hover:bg-accent",
            isCollapsed && "px-2",
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  )
}
