"use client"

import { useEffect, useState } from "react"
import { Users, Package, Wrench, ClipboardList } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

type ReportKey = "daily-workers" | "inventory" | "damage" | "po-status"

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

function nDaysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split("T")[0]
}

function fmtDate(s: string) {
  if (!s) return "—"
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

interface DailyWorkerSummary {
  total_employees: number
  present: number
  absent: number
  half_day: number
  no_record: number
}

interface WorkerAssignment {
  article_number: string
  article_name: string
  stage: string
  quantity_assigned: number
  quantity_completed: number
  is_rework: boolean
}

interface Worker {
  employee_id: number
  name: string
  role: string
  pay_type: string
  attendance: "present" | "absent" | "half_day" | "no_record"
  pieces_completed: number
  rework_pieces: number
  assignments: WorkerAssignment[]
}

interface DailyWorkersData {
  date: string
  summary: DailyWorkerSummary
  workers: Worker[]
}

interface InventoryMaterial {
  raw_material_id: number
  name: string
  unit: string
  total_inward: number
  total_consumed: number
  total_damaged: number
  current_stock: number
  today_inward: number
  today_consumed: number
}

interface InventoryData {
  as_of: string
  materials: InventoryMaterial[]
}

interface DamageSummary {
  total_qc_failed: number
  total_rework_assigned: number
  total_outward_spoiled: number
  total_provider_returned: number
}

interface QcFailure {
  inspection_date: string
  article_number: string
  article_name: string
  stage: string
  quantity_failed: number
}

interface OutwardSpoiled {
  dispatch_date: string
  po_number: string
  quantity_spoiled: number
}

interface ProviderReturn {
  return_date: string
  po_number: string
  provider: string
  total_returned: number
  full_return: boolean
  reason: string
}

interface DamageData {
  period: { start: string; end: string }
  summary: DamageSummary
  qc_failures: QcFailure[]
  outward_spoiled: OutwardSpoiled[]
  provider_returns: ProviderReturn[]
}

interface POEntry {
  id: number
  po_number: string
  provider: string
  arrival_date: string
  deadline_date: string
  days_remaining: number
  status: "open" | "in_progress" | "delivered" | "overdue"
  incentive_at_risk: boolean
  delivery_incentive_pct: number | null
  quality_score: number | null
  articles: string[]
}

const reportList: { key: ReportKey; icon: React.ReactNode; name: string; desc: string }[] = [
  {
    key: "daily-workers",
    icon: <Users className="h-4 w-4" />,
    name: "Daily Workers",
    desc: "Attendance, pieces, and assignments",
  },
  {
    key: "inventory",
    icon: <Package className="h-4 w-4" />,
    name: "Inventory",
    desc: "Stock levels and daily movements",
  },
  {
    key: "damage",
    icon: <Wrench className="h-4 w-4" />,
    name: "Damage & Repair",
    desc: "QC failures, spoilage, returns",
  },
  {
    key: "po-status",
    icon: <ClipboardList className="h-4 w-4" />,
    name: "PO Status",
    desc: "Open orders and deadline tracking",
  },
]

function StatChip({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className={cn("flex flex-col gap-0.5 px-3 py-2 rounded-md border border-border", color ?? "bg-muted/30")}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  )
}

function AttendancePill({ status }: { status: Worker["attendance"] }) {
  const map: Record<Worker["attendance"], { label: string; cls: string }> = {
    present: { label: "Present", cls: "bg-green-500/10 text-green-600 dark:text-green-400" },
    absent: { label: "Absent", cls: "bg-red-500/10 text-red-600 dark:text-red-400" },
    half_day: { label: "Half Day", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    no_record: { label: "No Record", cls: "bg-muted text-muted-foreground" },
  }
  const { label, cls } = map[status]
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", cls)}>
      {label}
    </span>
  )
}

function POStatusPill({ status }: { status: POEntry["status"] }) {
  const map: Record<POEntry["status"], { label: string; cls: string }> = {
    open: { label: "Open", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    in_progress: { label: "In Progress", cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
    delivered: { label: "Delivered", cls: "bg-green-500/10 text-green-600 dark:text-green-400" },
    overdue: { label: "Overdue", cls: "bg-red-500/10 text-red-600 dark:text-red-400" },
  }
  const { label, cls } = map[status]
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", cls)}>
      {label}
    </span>
  )
}

function DaysRemainingBadge({ days }: { days: number }) {
  const cls =
    days < 0
      ? "bg-red-500/10 text-red-600 dark:text-red-400"
      : days <= 1
      ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
      : days <= 5
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      : "bg-green-500/10 text-green-600 dark:text-green-400"
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums", cls)}>
      {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d`}
    </span>
  )
}

function TableSkeleton({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="h-9 bg-muted/40 border-b border-border" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-border last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="animate-pulse bg-muted/60 rounded h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
      {msg}
    </p>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{children}</p>
  )
}

export default function ReportsPage() {
  const [selected, setSelected] = useState<ReportKey>("daily-workers")

  const [dwDate, setDwDate] = useState(todayStr())
  const [dwData, setDwData] = useState<DailyWorkersData | null>(null)
  const [dwLoading, setDwLoading] = useState(false)
  const [dwError, setDwError] = useState<string | null>(null)

  const [invDate, setInvDate] = useState(todayStr())
  const [invData, setInvData] = useState<InventoryData | null>(null)
  const [invLoading, setInvLoading] = useState(false)
  const [invError, setInvError] = useState<string | null>(null)

  const [dmgStart, setDmgStart] = useState(nDaysAgo(7))
  const [dmgEnd, setDmgEnd] = useState(todayStr())
  const [dmgData, setDmgData] = useState<DamageData | null>(null)
  const [dmgLoading, setDmgLoading] = useState(false)
  const [dmgError, setDmgError] = useState<string | null>(null)

  const [poData, setPoData] = useState<POEntry[] | null>(null)
  const [poLoading, setPoLoading] = useState(false)
  const [poError, setPoError] = useState<string | null>(null)

  useEffect(() => {
    if (selected !== "po-status") return
    if (poData !== null) return
    fetchPO()
  }, [selected])

  async function fetchDailyWorkers() {
    setDwLoading(true)
    setDwError(null)
    setDwData(null)
    try {
      const res = await api.get<{ success: boolean; data: DailyWorkersData }>(
        `/reports/daily-workers?date=${dwDate}`
      )
      setDwData(res.data)
    } catch (e: unknown) {
      setDwError(e instanceof Error ? e.message : "Failed to load report")
    } finally {
      setDwLoading(false)
    }
  }

  async function fetchInventory() {
    setInvLoading(true)
    setInvError(null)
    setInvData(null)
    try {
      const res = await api.get<{ success: boolean; data: InventoryData }>(
        `/reports/inventory?date=${invDate}`
      )
      setInvData(res.data)
    } catch (e: unknown) {
      setInvError(e instanceof Error ? e.message : "Failed to load report")
    } finally {
      setInvLoading(false)
    }
  }

  async function fetchDamage() {
    setDmgLoading(true)
    setDmgError(null)
    setDmgData(null)
    try {
      const res = await api.get<{ success: boolean; data: DamageData }>(
        `/reports/damage?start_date=${dmgStart}&end_date=${dmgEnd}`
      )
      setDmgData(res.data)
    } catch (e: unknown) {
      setDmgError(e instanceof Error ? e.message : "Failed to load report")
    } finally {
      setDmgLoading(false)
    }
  }

  async function fetchPO() {
    setPoLoading(true)
    setPoError(null)
    setPoData(null)
    try {
      const res = await api.get<{ success: boolean; data: POEntry[] }>("/reports/po-status")
      setPoData(res.data)
    } catch (e: unknown) {
      setPoError(e instanceof Error ? e.message : "Failed to load report")
    } finally {
      setPoLoading(false)
    }
  }

  const dateInputCls =
    "h-8 px-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
  const runBtnCls =
    "h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 h-[72px] shrink-0 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Factory performance and audit reports</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 shrink-0 border-r border-border flex flex-col overflow-y-auto">
          {reportList.map((r) => {
            const active = selected === r.key
            return (
              <button
                key={r.key}
                onClick={() => setSelected(r.key)}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 text-left border-l-2 transition-colors",
                  active
                    ? "border-violet-500 text-violet-600 dark:text-violet-400 bg-violet-500/10"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <span className={cn("mt-0.5 shrink-0", active ? "text-violet-600 dark:text-violet-400" : "")}>
                  {r.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium leading-snug">{r.name}</p>
                  <p className={cn("text-xs leading-relaxed mt-0.5", active ? "text-violet-500/70 dark:text-violet-300/60" : "text-muted-foreground/70")}>
                    {r.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {selected === "daily-workers" && (
            <div className="flex flex-col gap-5 max-w-4xl">
              <div>
                <SectionHeading>Daily Workers Report</SectionHeading>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={dwDate}
                    onChange={(e) => setDwDate(e.target.value)}
                    className={dateInputCls}
                  />
                  <button
                    onClick={fetchDailyWorkers}
                    disabled={dwLoading}
                    className={runBtnCls}
                  >
                    {dwLoading ? "Loading…" : "Run Report"}
                  </button>
                </div>
                {dwError && <div className="mt-3"><ErrorBanner msg={dwError} /></div>}
              </div>

              {dwLoading && <TableSkeleton cols={6} />}

              {!dwLoading && dwData && (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatChip label="Total" value={dwData.summary.total_employees} />
                    <StatChip label="Present" value={dwData.summary.present} color="bg-green-500/8 border-green-500/20" />
                    <StatChip label="Absent" value={dwData.summary.absent} color="bg-red-500/8 border-red-500/20" />
                    <StatChip label="Half Day" value={dwData.summary.half_day} color="bg-amber-500/8 border-amber-500/20" />
                    <StatChip label="No Record" value={dwData.summary.no_record} />
                  </div>

                  {dwData.workers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">No worker data for this date.</p>
                  ) : (
                    <div className="border border-border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Role</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Attendance</th>
                            <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Pieces</th>
                            <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Rework</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Assignments</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {dwData.workers.map((w) => (
                            <tr key={w.employee_id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 text-xs font-medium">{w.name}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{w.role || "—"}</td>
                              <td className="px-4 py-3">
                                <AttendancePill status={w.attendance} />
                              </td>
                              <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-muted-foreground">
                                {w.pieces_completed}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={cn("font-mono tabular-nums text-xs", w.rework_pieces > 0 ? "text-amber-500" : "text-muted-foreground")}>
                                  {w.rework_pieces}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground max-w-[240px]">
                                {w.assignments.length === 0
                                  ? "—"
                                  : w.assignments
                                      .map((a) => `${a.article_name} ${a.stage} (${a.quantity_assigned})`)
                                      .join(", ")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {!dwLoading && !dwData && !dwError && (
                <p className="text-sm text-muted-foreground text-center py-10">
                  Select a date and run the report.
                </p>
              )}
            </div>
          )}

          {selected === "inventory" && (
            <div className="flex flex-col gap-5 max-w-3xl">
              <div>
                <SectionHeading>Inventory Report</SectionHeading>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    className={dateInputCls}
                  />
                  <button
                    onClick={fetchInventory}
                    disabled={invLoading}
                    className={runBtnCls}
                  >
                    {invLoading ? "Loading…" : "Run Report"}
                  </button>
                </div>
                {invError && <div className="mt-3"><ErrorBanner msg={invError} /></div>}
              </div>

              {invLoading && <TableSkeleton cols={5} />}

              {!invLoading && invData && (
                <>
                  {invData.materials.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">No inventory data for this date.</p>
                  ) : (
                    <div className="border border-border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Material</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Unit</th>
                            <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Current Stock</th>
                            <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Today Inward</th>
                            <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Today Consumed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {invData.materials.map((m) => (
                            <tr key={m.raw_material_id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 text-xs font-medium">{m.name}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{m.unit}</td>
                              <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-muted-foreground">{m.current_stock}</td>
                              <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-muted-foreground">{m.today_inward}</td>
                              <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-muted-foreground">{m.today_consumed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {!invLoading && !invData && !invError && (
                <p className="text-sm text-muted-foreground text-center py-10">
                  Select a date and run the report.
                </p>
              )}
            </div>
          )}

          {selected === "damage" && (
            <div className="flex flex-col gap-5 max-w-4xl">
              <div>
                <SectionHeading>Damage & Repair Report</SectionHeading>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">From</label>
                    <input
                      type="date"
                      value={dmgStart}
                      onChange={(e) => setDmgStart(e.target.value)}
                      className={dateInputCls}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">To</label>
                    <input
                      type="date"
                      value={dmgEnd}
                      onChange={(e) => setDmgEnd(e.target.value)}
                      className={dateInputCls}
                    />
                  </div>
                  <div className="self-end">
                    <button
                      onClick={fetchDamage}
                      disabled={dmgLoading}
                      className={runBtnCls}
                    >
                      {dmgLoading ? "Loading…" : "Run Report"}
                    </button>
                  </div>
                </div>
                {dmgError && <div className="mt-3"><ErrorBanner msg={dmgError} /></div>}
              </div>

              {dmgLoading && (
                <div className="flex flex-col gap-4">
                  <TableSkeleton cols={5} rows={3} />
                  <TableSkeleton cols={3} rows={2} />
                  <TableSkeleton cols={5} rows={2} />
                </div>
              )}

              {!dmgLoading && dmgData && (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatChip label="QC Failed" value={dmgData.summary.total_qc_failed} color="bg-red-500/8 border-red-500/20" />
                    <StatChip label="Rework Assigned" value={dmgData.summary.total_rework_assigned} color="bg-amber-500/8 border-amber-500/20" />
                    <StatChip label="Outward Spoiled" value={dmgData.summary.total_outward_spoiled} color="bg-orange-500/8 border-orange-500/20" />
                    <StatChip label="Provider Returned" value={dmgData.summary.total_provider_returned} />
                  </div>

                  <div className="flex flex-col gap-6">
                    <div>
                      <SectionHeading>QC Failures</SectionHeading>
                      {dmgData.qc_failures.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">No QC failures in this period.</p>
                      ) : (
                        <div className="border border-border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border bg-muted/40">
                                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
                                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Article</th>
                                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Stage</th>
                                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Qty Failed</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {dmgData.qc_failures.map((f, i) => (
                                <tr key={i} className="hover:bg-muted/30 transition-colors">
                                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(f.inspection_date)}</td>
                                  <td className="px-4 py-3 text-xs font-medium">{f.article_name} <span className="text-muted-foreground font-normal">#{f.article_number}</span></td>
                                  <td className="px-4 py-3 text-xs text-muted-foreground">{f.stage}</td>
                                  <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-red-600 dark:text-red-400">{f.quantity_failed}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div>
                      <SectionHeading>Outward Spoiled</SectionHeading>
                      {dmgData.outward_spoiled.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">No outward spoilage in this period.</p>
                      ) : (
                        <div className="border border-border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border bg-muted/40">
                                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Dispatch Date</th>
                                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">PO #</th>
                                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Qty Spoiled</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {dmgData.outward_spoiled.map((s, i) => (
                                <tr key={i} className="hover:bg-muted/30 transition-colors">
                                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(s.dispatch_date)}</td>
                                  <td className="px-4 py-3 text-xs font-medium">{s.po_number}</td>
                                  <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-orange-600 dark:text-orange-400">{s.quantity_spoiled}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div>
                      <SectionHeading>Provider Returns</SectionHeading>
                      {dmgData.provider_returns.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">No provider returns in this period.</p>
                      ) : (
                        <div className="border border-border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border bg-muted/40">
                                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Return Date</th>
                                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">PO #</th>
                                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Provider</th>
                                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Total Returned</th>
                                <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Full Return</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {dmgData.provider_returns.map((r, i) => (
                                <tr key={i} className="hover:bg-muted/30 transition-colors">
                                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(r.return_date)}</td>
                                  <td className="px-4 py-3 text-xs font-medium">{r.po_number}</td>
                                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.provider}</td>
                                  <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-muted-foreground">{r.total_returned}</td>
                                  <td className="px-4 py-3 text-center">
                                    {r.full_return ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                                        Full
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                        Partial
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {!dmgLoading && !dmgData && !dmgError && (
                <p className="text-sm text-muted-foreground text-center py-10">
                  Select a date range and run the report.
                </p>
              )}
            </div>
          )}

          {selected === "po-status" && (
            <div className="flex flex-col gap-5 max-w-5xl">
              <div className="flex items-center justify-between">
                <SectionHeading>PO Status</SectionHeading>
                <button
                  onClick={fetchPO}
                  disabled={poLoading}
                  className={runBtnCls}
                >
                  {poLoading ? "Loading…" : "Refresh"}
                </button>
              </div>

              {poError && <ErrorBanner msg={poError} />}

              {poLoading && <TableSkeleton cols={7} />}

              {!poLoading && poData && poData.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-10">No purchase orders found.</p>
              )}

              {!poLoading && poData && poData.length > 0 && (
                <div className="border border-border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">PO #</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Provider</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Arrival</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Deadline</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Days Left</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Articles</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {poData.map((po) => (
                        <tr key={po.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-xs font-medium">{po.po_number}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{po.provider}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(po.arrival_date)}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(po.deadline_date)}</td>
                          <td className="px-4 py-3">
                            <DaysRemainingBadge days={po.days_remaining} />
                          </td>
                          <td className="px-4 py-3">
                            <POStatusPill status={po.status} />
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                            {po.articles.length === 0 ? "—" : po.articles.join(", ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
