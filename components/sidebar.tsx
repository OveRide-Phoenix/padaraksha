"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
        "flex flex-col bg-dark-surface border-r border-dark-border",
        isCollapsed ? "w-16" : "w-64",
        "transition-all duration-300",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-dark-accent" />
            <span className="font-semibold text-dark-text">Factory MS</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-dark-text-secondary hover:text-dark-text hover:bg-dark-bg"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
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
      <div className="p-4 border-t border-dark-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn("w-full text-dark-text-secondary hover:text-dark-text hover:bg-dark-bg", isCollapsed && "px-2")}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  )
}
