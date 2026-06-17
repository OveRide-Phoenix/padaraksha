"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  ArrowDownToLine,
  CheckSquare,
  Loader2,
  Package,
  Truck,
  Users,
} from "lucide-react"
import { UserChip } from "@/components/user-chip"

interface LowStockItem {
  name: string
  unit: string
  stock: number
}

interface OpenPO {
  id: number
  po_number: string
  provider_name: string
  arrival_date: string
  deadline_date: string
  days_remaining: number
  status: string
}

interface DashboardStats {
  today_attendance: {
    present: number
    absent: number
    half_day: number
  }
  inventory_low: LowStockItem[]
  open_pos: OpenPO[]
  today_completions: number
  pending_qc: number
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

function fmtDate(d: string) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function todayLabel() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function daysClass(days: number) {
  if (days <= 0) return "text-red-500 font-semibold"
  if (days <= 2) return "text-amber-500 font-semibold"
  return "text-green-500 font-semibold"
}

function daysLabel(days: number) {
  if (days <= 0) return "Overdue"
  return `${days}d`
}

function stockClass(stock: number) {
  if (stock <= 0) return "text-red-500 font-semibold"
  if (stock <= 5) return "text-amber-500 font-semibold"
  return ""
}

function statusPill(status: string) {
  const map: Record<string, string> = {
    open: "bg-blue-500/10 text-blue-400",
    in_progress: "bg-amber-500/10 text-amber-400",
    delivered: "bg-green-500/10 text-green-400",
    overdue: "bg-red-500/10 text-red-400",
  }
  return map[status] ?? "bg-muted text-muted-foreground"
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    delivered: "Delivered",
    overdue: "Overdue",
  }
  return map[status] ?? status
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const didFetch = useRef(false)

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<ApiResponse<DashboardStats>>("/dashboard/stats")
      setStats(res.data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true
    loadStats()
  }, [loadStats])

  const quickActions = [
    {
      label: "New Inward Entry",
      href: "/inward",
      icon: <ArrowDownToLine className="h-3.5 w-3.5" />,
    },
    {
      label: "Assign Work",
      href: "/production",
      icon: <Users className="h-3.5 w-3.5" />,
    },
    {
      label: "Internal QC",
      href: "/quality-check",
      icon: <CheckSquare className="h-3.5 w-3.5" />,
    },
    {
      label: "Outward Delivery",
      href: "/outward",
      icon: <Truck className="h-3.5 w-3.5" />,
    },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-[72px] shrink-0 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{todayLabel()}</p>
        </div>
        <UserChip />
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 h-40 justify-center">
            <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </p>
            <button
              onClick={loadStats}
              className="h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-4xl">
            {/* Quick actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {quickActions.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  {a.icon}
                  {a.label}
                </Link>
              ))}
              <button
                onClick={loadStats}
                className="h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Refresh
              </button>
            </div>

            {/* Stats row */}
            <div className="border border-border rounded-md overflow-hidden">
              <div className="grid grid-cols-4 divide-x divide-border">
                <div className="px-5 py-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Present Today
                  </p>
                  <p
                    className={cn(
                      "text-3xl font-bold tabular-nums",
                      "text-green-500"
                    )}
                  >
                    {stats?.today_attendance.present ?? 0}
                  </p>
                  {stats && stats.today_attendance.half_day > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      +{stats.today_attendance.half_day} half day
                    </p>
                  )}
                </div>

                <div className="px-5 py-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Absent
                  </p>
                  <p
                    className={cn(
                      "text-3xl font-bold tabular-nums",
                      stats && stats.today_attendance.absent > 0
                        ? "text-red-500"
                        : "text-muted-foreground"
                    )}
                  >
                    {stats?.today_attendance.absent ?? 0}
                  </p>
                </div>

                <div className="px-5 py-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Pieces Today
                  </p>
                  <p className="text-3xl font-bold tabular-nums">
                    {stats?.today_completions ?? 0}
                  </p>
                </div>

                <div className="px-5 py-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Pending QC
                  </p>
                  <p
                    className={cn(
                      "text-3xl font-bold tabular-nums",
                      stats && stats.pending_qc > 0
                        ? "text-amber-500"
                        : "text-muted-foreground"
                    )}
                  >
                    {stats?.pending_qc ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Open POs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Open Purchase Orders
                </p>
                <Link
                  href="/inward"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  View all →
                </Link>
              </div>

              {!stats || stats.open_pos.length === 0 ? (
                <div className="border border-border rounded-md px-5 py-6 text-center">
                  <p className="text-sm text-muted-foreground">No open purchase orders.</p>
                </div>
              ) : (
                <div className="border border-border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          PO No.
                        </th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          Provider
                        </th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          Arrived
                        </th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          Deadline
                        </th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          Days Left
                        </th>
                        <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stats.open_pos.slice(0, 5).map((po) => (
                        <tr key={po.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs font-medium">
                            {po.po_number}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {po.provider_name}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {fmtDate(po.arrival_date)}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {fmtDate(po.deadline_date)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={cn(
                                "font-mono tabular-nums text-xs",
                                daysClass(po.days_remaining)
                              )}
                            >
                              {daysLabel(po.days_remaining)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                statusPill(po.status)
                              )}
                            >
                              {statusLabel(po.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Low Stock */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Low Stock Alert
                </p>
                <Link
                  href="/inventory"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  View all →
                </Link>
              </div>

              {!stats || stats.inventory_low.length === 0 ? (
                <div className="border border-border rounded-md px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-500" />
                    <p className="text-sm text-muted-foreground">
                      All materials adequately stocked.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          Material
                        </th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          Unit
                        </th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          Stock
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stats.inventory_low.slice(0, 5).map((item, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-xs font-medium">{item.name}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{item.unit}</td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={cn(
                                "font-mono tabular-nums text-xs",
                                stockClass(item.stock)
                              )}
                            >
                              {item.stock}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
