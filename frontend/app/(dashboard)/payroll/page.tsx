"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2, Users, ChevronLeft, Edit2, CalendarDays, Banknote } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "sonner"

// ---- Types ----

interface Employee {
  id: number
  name: string
  role: string | null
  pay_type: "piece_rate" | "fixed"
  sourcing_type: "in_house" | "wfh"
  fixed_wage: number | null
  is_active: boolean
}

interface AttendanceRecord {
  id: number
  date: string
  status: "present" | "absent" | "half_day"
}

interface PayrollRun {
  id: number
  period_start: string
  period_end: string
  finalized: boolean
  created_at: string
  total_net_pay: number
}

interface PayrollLineItem {
  employee_name: string
  gross_pay: number
  piece_rate_pay: number
  fixed_pay: number
  total_deductions: number
  net_pay: number
  total_pieces: number
  rework_pieces: number
  days_present: number
  days_absent: number
}

interface PayrollRunDetail {
  id: number
  period_start: string
  period_end: string
  finalized: boolean
  line_items: PayrollLineItem[]
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// ---- Helpers ----

function fmtDate(d: string) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function fmtCurrency(n: number) {
  return `₹${n.toFixed(2)}`
}

function today() {
  return new Date().toISOString().split("T")[0]
}

// ---- Employee Sheet Form ----

const emptyEmployee = {
  name: "",
  role: "",
  pay_type: "piece_rate" as "piece_rate" | "fixed",
  sourcing_type: "in_house" as "in_house" | "wfh",
  fixed_wage: "",
  join_date: today(),
  phone: "",
  notes: "",
  is_active: true,
}

// ---- Attendance Sheet Form ----

const emptyAttendance = {
  date: today(),
  status: "present" as "present" | "absent" | "half_day",
  notes: "",
}

// ---- Advance Sheet Form ----

const emptyAdvance = {
  amount: "",
  advance_date: today(),
  notes: "",
}

// ---- Main Page ----

type Tab = "employees" | "payroll" | "detail"

export default function PayrollPage() {
  const [tab, setTab] = useState<Tab>("employees")

  // Employees
  const [employees, setEmployees] = useState<Employee[]>([])
  const [empLoading, setEmpLoading] = useState(true)
  const [empError, setEmpError] = useState<string | null>(null)

  // Employee Sheet
  const [empSheet, setEmpSheet] = useState(false)
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null)
  const [empForm, setEmpForm] = useState({ ...emptyEmployee })
  const [empSaving, setEmpSaving] = useState(false)
  const [empSaveError, setEmpSaveError] = useState<string | null>(null)

  // Attendance Sheet
  const [attSheet, setAttSheet] = useState(false)
  const [attEmpId, setAttEmpId] = useState<number | null>(null)
  const [attEmpName, setAttEmpName] = useState("")
  const [attForm, setAttForm] = useState({ ...emptyAttendance })
  const [attSaving, setAttSaving] = useState(false)
  const [attSaveError, setAttSaveError] = useState<string | null>(null)

  // Advance Sheet
  const [advSheet, setAdvSheet] = useState(false)
  const [advEmpId, setAdvEmpId] = useState<number | null>(null)
  const [advEmpName, setAdvEmpName] = useState("")
  const [advForm, setAdvForm] = useState({ ...emptyAdvance })
  const [advSaving, setAdvSaving] = useState(false)
  const [advSaveError, setAdvSaveError] = useState<string | null>(null)

  // Payroll tab
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [preview, setPreview] = useState<PayrollLineItem[] | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [runSaving, setRunSaving] = useState(false)
  const [runSaveError, setRunSaveError] = useState<string | null>(null)
  const [runSuccess, setRunSuccess] = useState(false)

  // Past runs
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [runsLoading, setRunsLoading] = useState(false)

  // Detail tab
  const [selectedRun, setSelectedRun] = useState<PayrollRunDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // ---- Load employees ----

  const loadEmployees = useCallback(async () => {
    setEmpLoading(true)
    setEmpError(null)
    try {
      const res = await api.get<ApiResponse<Employee[]>>("/employees")
      setEmployees(res.data ?? [])
    } catch (e: unknown) {
      setEmpError(e instanceof Error ? e.message : "Failed to load employees")
    } finally {
      setEmpLoading(false)
    }
  }, [])

  const loadRuns = useCallback(async () => {
    setRunsLoading(true)
    try {
      const res = await api.get<ApiResponse<PayrollRun[]>>("/payroll/runs")
      setRuns(res.data ?? [])
    } catch {
      // non-blocking
    } finally {
      setRunsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEmployees()
    loadRuns()
  }, [loadEmployees, loadRuns])

  // ---- Employee sheet ----

  function openNewEmp() {
    setEditingEmp(null)
    setEmpForm({ ...emptyEmployee })
    setEmpSaveError(null)
    setEmpSheet(true)
  }

  function openEditEmp(emp: Employee) {
    setEditingEmp(emp)
    setEmpForm({
      name: emp.name,
      role: emp.role ?? "",
      pay_type: emp.pay_type,
      sourcing_type: emp.sourcing_type,
      fixed_wage: emp.fixed_wage != null ? String(emp.fixed_wage) : "",
      join_date: today(),
      phone: "",
      notes: "",
      is_active: emp.is_active,
    })
    setEmpSaveError(null)
    setEmpSheet(true)
  }

  async function handleSaveEmployee() {
    if (!empForm.name.trim()) {
      setEmpSaveError("Name is required")
      return
    }
    if (empForm.pay_type === "fixed" && !empForm.fixed_wage) {
      setEmpSaveError("Enter fixed daily wage")
      return
    }
    setEmpSaving(true)
    setEmpSaveError(null)
    try {
      const payload = {
        name: empForm.name.trim(),
        role: empForm.role || undefined,
        pay_type: empForm.pay_type,
        sourcing_type: empForm.sourcing_type,
        fixed_wage: empForm.fixed_wage ? Number(empForm.fixed_wage) : undefined,
        join_date: empForm.join_date,
        phone: empForm.phone || undefined,
        notes: empForm.notes || undefined,
        is_active: empForm.is_active,
      }
      if (editingEmp) {
        await api.put(`/employees/${editingEmp.id}`, payload)
      } else {
        await api.post("/employees", payload)
      }
      setEmpSheet(false)
      toast.success(editingEmp ? "Employee updated" : "Employee added")
      await loadEmployees()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed"
      setEmpSaveError(msg)
      toast.error(msg)
    } finally {
      setEmpSaving(false)
    }
  }

  // ---- Attendance sheet ----

  function openAttSheet(emp: Employee) {
    setAttEmpId(emp.id)
    setAttEmpName(emp.name)
    setAttForm({ ...emptyAttendance })
    setAttSaveError(null)
    setAttSheet(true)
  }

  async function handleSaveAttendance() {
    if (!attEmpId) return
    if (!attForm.date) {
      setAttSaveError("Select date")
      return
    }
    setAttSaving(true)
    setAttSaveError(null)
    try {
      await api.post(`/employees/${attEmpId}/attendance`, {
        date: attForm.date,
        status: attForm.status,
        notes: attForm.notes || undefined,
      })
      setAttSheet(false)
      toast.success(`Attendance marked for ${attEmpName}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed"
      setAttSaveError(msg)
      toast.error(msg)
    } finally {
      setAttSaving(false)
    }
  }

  // ---- Advance sheet ----

  function openAdvSheet(emp: Employee) {
    setAdvEmpId(emp.id)
    setAdvEmpName(emp.name)
    setAdvForm({ ...emptyAdvance })
    setAdvSaveError(null)
    setAdvSheet(true)
  }

  async function handleSaveAdvance() {
    if (!advEmpId) return
    if (!advForm.amount || Number(advForm.amount) <= 0) {
      setAdvSaveError("Enter amount")
      return
    }
    setAdvSaving(true)
    setAdvSaveError(null)
    try {
      await api.post(`/employees/${advEmpId}/advances`, {
        amount: Number(advForm.amount),
        advance_date: advForm.advance_date,
        notes: advForm.notes || undefined,
      })
      setAdvSheet(false)
      toast.success(`Advance logged for ${advEmpName}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed"
      setAdvSaveError(msg)
      toast.error(msg)
    } finally {
      setAdvSaving(false)
    }
  }

  // ---- Payroll preview ----

  async function handlePreview() {
    if (!periodStart || !periodEnd) {
      setPreviewError("Select both period start and end dates")
      return
    }
    setPreviewLoading(true)
    setPreviewError(null)
    setPreview(null)
    setRunSuccess(false)
    try {
      const res = await api.post<ApiResponse<{ line_items: PayrollLineItem[] }>>(
        "/payroll/calculate",
        { period_start: periodStart, period_end: periodEnd }
      )
      setPreview((res.data as { line_items: PayrollLineItem[] }).line_items ?? [])
    } catch (e: unknown) {
      setPreviewError(e instanceof Error ? e.message : "Preview failed")
    } finally {
      setPreviewLoading(false)
    }
  }

  async function handleRunPayroll() {
    if (!periodStart || !periodEnd) return
    setRunSaving(true)
    setRunSaveError(null)
    try {
      await api.post("/payroll/run", {
        period_start: periodStart,
        period_end: periodEnd,
      })
      setRunSuccess(true)
      setPreview(null)
      toast.success("Payroll run saved")
      await loadRuns()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Run failed"
      setRunSaveError(msg)
      toast.error(msg)
    } finally {
      setRunSaving(false)
    }
  }

  async function openRunDetail(run: PayrollRun) {
    setDetailLoading(true)
    setSelectedRun(null)
    setTab("detail")
    try {
      const res = await api.get<ApiResponse<PayrollRunDetail>>(`/payroll/runs/${run.id}`)
      setSelectedRun(res.data)
    } catch {
      setSelectedRun(null)
    } finally {
      setDetailLoading(false)
    }
  }

  // ---- Render helpers ----

  const tabs: { key: Tab; label: string }[] = [
    { key: "employees", label: "Employees" },
    { key: "payroll", label: "Run Payroll" },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-[72px] shrink-0 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Payroll</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage employees, attendance, and wage runs
          </p>
        </div>
        {tab === "employees" && (
          <button
            onClick={openNewEmp}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            New Employee
          </button>
        )}
      </div>

      {/* Tab bar */}
      {tab !== "detail" && (
        <div className="flex gap-0 border-b border-border px-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {/* ---- EMPLOYEES TAB ---- */}
        {tab === "employees" && (
          <>
            {empLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : empError ? (
              <div className="flex flex-col items-center gap-3 h-40 justify-center">
                <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
                  {empError}
                </p>
                <button
                  onClick={loadEmployees}
                  className="h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground"
                >
                  Retry
                </button>
              </div>
            ) : employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <Users className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No employees yet.</p>
                <button
                  onClick={openNewEmp}
                  className="h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5 inline mr-1.5" />
                  Add First Employee
                </button>
              </div>
            ) : (
              <div className="border border-border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        Role
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        Pay Type
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        Sourcing
                      </th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        Rate
                      </th>
                      <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-xs font-medium">{emp.name}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {emp.role ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {emp.pay_type === "piece_rate" ? "Piece Rate" : "Fixed Daily"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
                            emp.sourcing_type === "wfh"
                              ? "bg-accent/15 text-accent-foreground"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {emp.sourcing_type === "wfh" ? "WFH" : "In-house"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-muted-foreground">
                          {emp.pay_type === "fixed" && emp.fixed_wage != null
                            ? fmtCurrency(emp.fixed_wage) + "/day"
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                              emp.is_active
                                ? "bg-green-500/10 text-green-500"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {emp.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditEmp(emp)}
                              title="Edit"
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => openAttSheet(emp)}
                              title="Mark Attendance"
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                            >
                              <CalendarDays className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => openAdvSheet(emp)}
                              title="Log Advance"
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                            >
                              <Banknote className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ---- PAYROLL TAB ---- */}
        {tab === "payroll" && (
          <div className="flex flex-col gap-6 max-w-3xl">
            {/* Period picker */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">Payroll Period</p>
              <div className="flex items-end gap-3 flex-wrap">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">From</label>
                  <DatePicker
                    value={periodStart}
                    onChange={(v) => { setPeriodStart(v); setPreview(null); setRunSuccess(false) }}
                    placeholder="Start date"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">To</label>
                  <DatePicker
                    value={periodEnd}
                    onChange={(v) => { setPeriodEnd(v); setPreview(null); setRunSuccess(false) }}
                    placeholder="End date"
                  />
                </div>
                <div>
                  <button
                    onClick={handlePreview}
                    disabled={previewLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Preview
                  </button>
                </div>
              </div>
              {previewError && (
                <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2 mt-3">
                  {previewError}
                </p>
              )}
            </div>

            {/* Preview table */}
            {preview && preview.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Preview — {fmtDate(periodStart)} to {fmtDate(periodEnd)}
                </p>
                <div className="border border-border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Worker</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Present</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Pieces</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Rework</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Piece Pay</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Fixed Pay</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Deductions</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {preview.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-xs font-medium">{row.employee_name}</td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-muted-foreground">
                            {row.days_present}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-muted-foreground">
                            {row.total_pieces}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={cn(
                                "font-mono tabular-nums text-xs",
                                row.rework_pieces > 0 ? "text-amber-500" : "text-muted-foreground"
                              )}
                            >
                              {row.rework_pieces}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-muted-foreground">
                            {fmtCurrency(row.piece_rate_pay)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-muted-foreground">
                            {fmtCurrency(row.fixed_pay)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-muted-foreground">
                            {fmtCurrency(row.total_deductions)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs font-semibold">
                            {fmtCurrency(row.net_pay)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/40">
                        <td colSpan={7} className="px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          Total
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-xs font-bold">
                          {fmtCurrency(preview.reduce((sum, r) => sum + r.net_pay, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {runSaveError && (
                  <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
                    {runSaveError}
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRunPayroll}
                    disabled={runSaving}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {runSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {runSaving ? "Running…" : "Run & Save Payroll"}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    This will save the payroll run for this period.
                  </p>
                </div>
              </div>
            )}

            {preview && preview.length === 0 && (
              <p className="text-sm text-muted-foreground">No payroll data for this period.</p>
            )}

            {runSuccess && (
              <p className="text-xs text-green-600 bg-green-500/10 border border-green-500/20 rounded-md px-3 py-2">
                Payroll run saved successfully.
              </p>
            )}

            {/* Past runs */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Past Payroll Runs
              </p>
              {runsLoading ? (
                <div className="flex items-center gap-2 h-10">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Loading…</span>
                </div>
              ) : runs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payroll runs yet.</p>
              ) : (
                <div className="border border-border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Period</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Run Date</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Total Net Pay</th>
                        <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {runs.map((run) => (
                        <tr
                          key={run.id}
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => openRunDetail(run)}
                        >
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {fmtDate(run.period_start)} – {fmtDate(run.period_end)}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {fmtDate(run.created_at)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs font-semibold">
                            {fmtCurrency(run.total_net_pay)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                run.finalized
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-amber-500/10 text-amber-500"
                              )}
                            >
                              {run.finalized ? "Finalized" : "Draft"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs text-muted-foreground hover:text-foreground">
                              View →
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

        {/* ---- DETAIL TAB ---- */}
        {tab === "detail" && (
          <div className="flex flex-col gap-4 max-w-4xl">
            <button
              onClick={() => setTab("payroll")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Payroll
            </button>

            {detailLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !selectedRun ? (
              <p className="text-sm text-muted-foreground">Could not load run details.</p>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">
                      {fmtDate(selectedRun.period_start)} – {fmtDate(selectedRun.period_end)}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Payroll Run #{selectedRun.id}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                      selectedRun.finalized
                        ? "bg-green-500/10 text-green-500"
                        : "bg-amber-500/10 text-amber-500"
                    )}
                  >
                    {selectedRun.finalized ? "Finalized" : "Draft"}
                  </span>
                </div>

                <div className="border border-border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Worker</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Present</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Pieces</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Rework</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Piece Pay</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Fixed Pay</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Deductions</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedRun.line_items.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-xs font-medium">{row.employee_name}</td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-muted-foreground">
                            {row.days_present}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-muted-foreground">
                            {row.total_pieces}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={cn(
                                "font-mono tabular-nums text-xs",
                                row.rework_pieces > 0 ? "text-amber-500" : "text-muted-foreground"
                              )}
                            >
                              {row.rework_pieces}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-muted-foreground">
                            {fmtCurrency(row.piece_rate_pay)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-muted-foreground">
                            {fmtCurrency(row.fixed_pay)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-muted-foreground">
                            {fmtCurrency(row.total_deductions)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs font-semibold">
                            {fmtCurrency(row.net_pay)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/40">
                        <td colSpan={7} className="px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          Total
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-xs font-bold">
                          {fmtCurrency(
                            selectedRun.line_items.reduce((sum, r) => sum + r.net_pay, 0)
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ---- Employee Sheet ---- */}
      <Sheet open={empSheet} onOpenChange={setEmpSheet}>
        <SheetContent side="right" className="w-full max-w-[480px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-base font-semibold">
              {editingEmp ? `Edit — ${editingEmp.name}` : "New Employee"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name *</label>
              <input
                type="text"
                value={empForm.name}
                onChange={(e) => setEmpForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Worker name"
                className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Role</label>
              <input
                type="text"
                value={empForm.role}
                onChange={(e) => setEmpForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Stitching, Sole, QC"
                className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Pay Type *</label>
              <Select
                value={empForm.pay_type}
                onValueChange={(v) =>
                  setEmpForm((f) => ({ ...f, pay_type: v as "piece_rate" | "fixed" }))
                }
              >
                <SelectTrigger className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece_rate">Piece Rate</SelectItem>
                  <SelectItem value="fixed">Fixed Daily Wage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Sourcing *</label>
              <Select
                value={empForm.sourcing_type}
                onValueChange={(v) =>
                  setEmpForm((f) => ({ ...f, sourcing_type: v as "in_house" | "wfh" }))
                }
              >
                <SelectTrigger className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_house">In-house</SelectItem>
                  <SelectItem value="wfh">Work From Home</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Determines which stage piece-rate they're paid at.</p>
            </div>

            {empForm.pay_type === "fixed" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Daily Wage (₹) *</label>
                <input
                  type="number"
                  min="0"
                  value={empForm.fixed_wage}
                  onChange={(e) => setEmpForm((f) => ({ ...f, fixed_wage: e.target.value }))}
                  placeholder="0.00"
                  className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 font-mono"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Join Date</label>
              <DatePicker
                value={empForm.join_date}
                onChange={(v) => setEmpForm((f) => ({ ...f, join_date: v }))}
                placeholder="Pick a date"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Phone</label>
              <input
                type="tel"
                value={empForm.phone}
                onChange={(e) => setEmpForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Optional"
                className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <textarea
                value={empForm.notes}
                onChange={(e) => setEmpForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none"
              />
            </div>

            {editingEmp && (
              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={empForm.is_active}
                  onChange={(e) => setEmpForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="is_active" className="text-xs font-medium text-muted-foreground cursor-pointer">
                  Active employee
                </label>
              </div>
            )}

            {empSaveError && (
              <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
                {empSaveError}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveEmployee}
                disabled={empSaving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {empSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {empSaving ? "Saving…" : editingEmp ? "Save Changes" : "Add Employee"}
              </button>
              <button
                onClick={() => setEmpSheet(false)}
                disabled={empSaving}
                className="h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ---- Attendance Sheet ---- */}
      <Sheet open={attSheet} onOpenChange={setAttSheet}>
        <SheetContent side="right" className="w-full max-w-[380px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-base font-semibold">
              Mark Attendance — {attEmpName}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date *</label>
              <DatePicker
                value={attForm.date}
                onChange={(v) => setAttForm((f) => ({ ...f, date: v }))}
                placeholder="Pick a date"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status *</label>
              <Select
                value={attForm.status}
                onValueChange={(v) =>
                  setAttForm((f) => ({ ...f, status: v as "present" | "absent" | "half_day" }))
                }
              >
                <SelectTrigger className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="half_day">Half Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <input
                type="text"
                value={attForm.notes}
                onChange={(e) => setAttForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional"
                className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>

            {attSaveError && (
              <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
                {attSaveError}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveAttendance}
                disabled={attSaving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {attSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {attSaving ? "Saving…" : "Save Attendance"}
              </button>
              <button
                onClick={() => setAttSheet(false)}
                disabled={attSaving}
                className="h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ---- Advance Sheet ---- */}
      <Sheet open={advSheet} onOpenChange={setAdvSheet}>
        <SheetContent side="right" className="w-full max-w-[380px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-base font-semibold">
              Log Advance — {advEmpName}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Amount (₹) *</label>
              <input
                type="number"
                min="1"
                value={advForm.amount}
                onChange={(e) => setAdvForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date *</label>
              <DatePicker
                value={advForm.advance_date}
                onChange={(v) => setAdvForm((f) => ({ ...f, advance_date: v }))}
                placeholder="Pick a date"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <textarea
                value={advForm.notes}
                onChange={(e) => setAdvForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Optional reason…"
                className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none"
              />
            </div>

            {advSaveError && (
              <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
                {advSaveError}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveAdvance}
                disabled={advSaving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {advSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {advSaving ? "Saving…" : "Save Advance"}
              </button>
              <button
                onClick={() => setAdvSheet(false)}
                disabled={advSaving}
                className="h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
