"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Plus, ShieldCheck, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Inspection {
  id: number
  po_id: number
  po_number: string
  article_id: number
  article_number: string
  inspection_date: string
  total_inspected: number
  total_passed: number
  total_failed: number
  pass_rate: number
  notes: string | null
}

interface PurchaseOrder {
  id: number
  po_number: string
  status: string
  provider_name: string
}

interface Article {
  id: number
  article_number: string
  name: string | null
}

interface WorkStage {
  id: number
  name: string
  pay_rate: number
  sequence_order: number
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

interface FailureRow {
  work_stage_id: string
  quantity_failed: string
}

// ─── Default values ────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split("T")[0]

// ─── Form state ───────────────────────────────────────────────────────────────

interface InspectionForm {
  po_id: string
  article_id: string
  inspection_date: string
  total_inspected: string
  total_passed: string
  total_failed: string
  notes: string
  failures: FailureRow[]
}

const emptyForm = (): InspectionForm => ({
  po_id: "",
  article_id: "",
  inspection_date: today(),
  total_inspected: "",
  total_passed: "",
  total_failed: "",
  notes: "",
  failures: [],
})

// ─── Pass rate helpers ────────────────────────────────────────────────────────

function computePassRate(passed: number, inspected: number): number {
  if (!inspected) return 0
  return (passed / inspected) * 100
}

function passRateColor(rate: number): string {
  if (rate >= 95) return "text-green-600 dark:text-green-400"
  if (rate >= 80) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

function formatPassRate(passed: number, inspected: number): string {
  if (!inspected) return "—"
  return computePassRate(passed, inspected).toFixed(1) + "%"
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QualityCheckPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [workStages, setWorkStages] = useState<WorkStage[]>([])
  const [loading, setLoading] = useState(true)

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm] = useState<InspectionForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [stagesLoading, setStagesLoading] = useState(false)

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadInspections = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<ApiResponse<Inspection[]>>("/qc-inspections")
      setInspections(res.data)
    } catch {
      // silent — empty state shows
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDropdowns = useCallback(async () => {
    try {
      const [posRes, articlesRes] = await Promise.all([
        api.get<ApiResponse<PurchaseOrder[]>>("/purchase-orders"),
        api.get<ApiResponse<Article[]>>("/articles"),
      ])
      setPurchaseOrders(posRes.data)
      setArticles(articlesRes.data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    loadInspections()
    loadDropdowns()
  }, [loadInspections, loadDropdowns])

  // When article_id changes in form, fetch work stages for that article
  useEffect(() => {
    if (!form.article_id) {
      setWorkStages([])
      setForm(f => ({ ...f, failures: [] }))
      return
    }
    let cancelled = false
    setStagesLoading(true)
    api
      .get<ApiResponse<{ work_stages: WorkStage[] }>>(`/articles/${form.article_id}`)
      .then(res => {
        if (!cancelled) {
          const stages = res.data.work_stages ?? []
          setWorkStages(stages.sort((a, b) => a.sequence_order - b.sequence_order))
          setForm(f => ({ ...f, failures: [] }))
        }
      })
      .catch(() => {
        if (!cancelled) setWorkStages([])
      })
      .finally(() => {
        if (!cancelled) setStagesLoading(false)
      })
    return () => { cancelled = true }
  }, [form.article_id])

  // ── Form helpers ────────────────────────────────────────────────────────────

  const setField = <K extends keyof InspectionForm>(key: K, value: InspectionForm[K]) => {
    setForm(f => ({ ...f, [key]: value }))
    setError("")
  }

  // When total_failed changes, recompute total_passed
  const handleFailedChange = (val: string) => {
    const inspected = Number(form.total_inspected)
    const failed = Number(val)
    const passed = inspected - failed
    setForm(f => ({
      ...f,
      total_failed: val,
      total_passed: inspected ? String(Math.max(0, passed)) : "",
    }))
    setError("")
  }

  // When total_inspected changes, recompute total_passed
  const handleInspectedChange = (val: string) => {
    const inspected = Number(val)
    const failed = Number(form.total_failed)
    const passed = inspected - failed
    setForm(f => ({
      ...f,
      total_inspected: val,
      total_passed: val ? String(Math.max(0, passed)) : "",
    }))
    setError("")
  }

  // Failure rows management
  const addFailureRow = () => {
    setForm(f => ({
      ...f,
      failures: [...f.failures, { work_stage_id: "", quantity_failed: "" }],
    }))
  }

  const removeFailureRow = (index: number) => {
    setForm(f => ({
      ...f,
      failures: f.failures.filter((_, i) => i !== index),
    }))
  }

  const updateFailureRow = (index: number, key: keyof FailureRow, value: string) => {
    setForm(f => ({
      ...f,
      failures: f.failures.map((row, i) => i === index ? { ...row, [key]: value } : row),
    }))
  }

  // Validation: total of failure qty must equal total_failed
  const failureTotal = form.failures.reduce((sum, r) => sum + (Number(r.quantity_failed) || 0), 0)
  const failureMismatch =
    Number(form.total_failed) > 0 &&
    form.failures.length > 0 &&
    failureTotal !== Number(form.total_failed)

  const totalFailed = Number(form.total_failed)
  const showFailures = totalFailed > 0

  // ── Open / save ─────────────────────────────────────────────────────────────

  const openSheet = () => {
    setForm(emptyForm())
    setWorkStages([])
    setError("")
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!form.po_id) { setError("Select a purchase order."); return }
    if (!form.article_id) { setError("Select an article."); return }
    if (!form.total_inspected || Number(form.total_inspected) <= 0) {
      setError("Enter a valid total inspected quantity.")
      return
    }
    if (Number(form.total_failed) < 0) { setError("Failed quantity cannot be negative."); return }
    if (Number(form.total_failed) > Number(form.total_inspected)) {
      setError("Failed quantity cannot exceed total inspected.")
      return
    }
    if (showFailures && form.failures.length > 0 && failureMismatch) {
      setError(`Failure quantities total ${failureTotal}, but total failed is ${form.total_failed}. They must match.`)
      return
    }
    if (showFailures && form.failures.some(r => !r.work_stage_id || !r.quantity_failed)) {
      setError("Fill in all failure rows or remove incomplete ones.")
      return
    }

    setSaving(true)
    setError("")
    try {
      await api.post<ApiResponse<Inspection>>("/qc-inspections", {
        po_id: Number(form.po_id),
        article_id: Number(form.article_id),
        inspection_date: form.inspection_date,
        total_inspected: Number(form.total_inspected),
        total_passed: Number(form.total_passed),
        total_failed: Number(form.total_failed),
        notes: form.notes.trim() || undefined,
        failures: showFailures
          ? form.failures
              .filter(r => r.work_stage_id && r.quantity_failed)
              .map(r => ({
                work_stage_id: Number(r.work_stage_id),
                quantity_failed: Number(r.quantity_failed),
              }))
          : [],
      })
      setSheetOpen(false)
      toast.success("Inspection submitted")
      await loadInspections()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create inspection."
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <header className="px-8 pt-8 pb-6 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Internal QC</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Quality inspections and rework assignments</p>
          </div>
          <button
            onClick={openSheet}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all duration-150"
          >
            <Plus className="h-3.5 w-3.5" />
            New Inspection
          </button>
        </div>
      </header>

      {/* Table */}
      <div className="flex-1">
        {loading ? (
          <QCSkeleton />
        ) : inspections.length === 0 ? (
          <EmptyState onNew={openSheet} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-8 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-[130px]">PO No.</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-[110px]">Article</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-[110px]">Date</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-[110px]">Inspected</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-[100px]">Passed</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-[100px]">Failed</th>
                <th className="px-8 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-[110px]">Pass Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inspections.map(ins => {
                const rate = computePassRate(ins.total_passed, ins.total_inspected)
                return (
                  <tr
                    key={ins.id}
                    className="group hover:bg-muted/30 transition-colors duration-100"
                  >
                    <td className="px-8 py-3.5">
                      <span className="font-mono text-[13px] font-medium tracking-tight">{ins.po_number}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[13px] text-muted-foreground">{ins.article_number}</span>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground tabular-nums">
                      {ins.inspection_date}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-mono tabular-nums text-foreground">{ins.total_inspected}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-mono tabular-nums text-foreground">{ins.total_passed}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={cn(
                        "font-mono tabular-nums",
                        ins.total_failed > 0 ? "text-red-600 dark:text-red-400 font-medium" : "text-foreground"
                      )}>
                        {ins.total_failed}
                      </span>
                    </td>
                    <td className="px-8 py-3.5 text-right">
                      <span className={cn("font-mono tabular-nums font-medium", passRateColor(rate))}>
                        {formatPassRate(ins.total_passed, ins.total_inspected)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── New Inspection Sheet ───────────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-5 border-b border-border shrink-0">
            <SheetTitle className="text-base font-semibold">New Inspection</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

            {/* ── Step 1: Basic info ─────────────────────────────────────────── */}
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Basic Information
            </p>

            {/* PO */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">
                Purchase Order <span className="text-destructive">*</span>
              </label>
              <Select value={form.po_id || ""} onValueChange={v => setField("po_id", v)}>
                <SelectTrigger className="h-9 text-sm w-full">
                  <SelectValue placeholder="Select PO" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders.map(po => (
                    <SelectItem key={po.id} value={String(po.id)}>
                      {po.po_number} — {po.provider_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Article */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">
                Article <span className="text-destructive">*</span>
              </label>
              <Select value={form.article_id || ""} onValueChange={v => setField("article_id", v)}>
                <SelectTrigger className="h-9 text-sm w-full">
                  <SelectValue placeholder="Select Article" />
                </SelectTrigger>
                <SelectContent>
                  {articles.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.article_number}{a.name ? ` — ${a.name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Inspection Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Inspection Date</label>
              <DatePicker
                value={form.inspection_date}
                onChange={v => setField("inspection_date", v)}
                placeholder="Pick a date"
              />
            </div>

            {/* Quantities row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80">
                  Inspected <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.total_inspected}
                  onChange={e => handleInspectedChange(e.target.value)}
                  placeholder="0"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80">Failed</label>
                <input
                  type="number"
                  min={0}
                  max={Number(form.total_inspected) || undefined}
                  value={form.total_failed}
                  onChange={e => handleFailedChange(e.target.value)}
                  placeholder="0"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80">Passed</label>
                <input
                  type="number"
                  readOnly
                  value={form.total_passed}
                  placeholder="—"
                  className="w-full h-9 px-3 rounded-md border border-input bg-muted/40 text-sm font-mono text-muted-foreground cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setField("notes", e.target.value)}
                placeholder="Optional notes…"
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none"
              />
            </div>

            {/* ── Step 2: Failures ───────────────────────────────────────────── */}
            {showFailures && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Failure Breakdown
                  </p>
                  <span className={cn(
                    "text-[11px] font-mono tabular-nums",
                    failureMismatch ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {failureTotal} / {form.total_failed} attributed
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground -mt-2">
                  Rework will be automatically assigned to the responsible workers.
                </p>

                {stagesLoading ? (
                  <div className="h-9 rounded-md border border-input bg-muted/40 animate-pulse" />
                ) : (
                  <div className="space-y-2">
                    {form.failures.map((row, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Select value={row.work_stage_id || ""} onValueChange={v => updateFailureRow(i, "work_stage_id", v)}>
                          <SelectTrigger className="h-9 text-sm flex-1">
                            <SelectValue placeholder="Select Stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {workStages.map(s => (
                              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <input
                          type="number"
                          min={1}
                          value={row.quantity_failed}
                          onChange={e => updateFailureRow(i, "quantity_failed", e.target.value)}
                          placeholder="Qty"
                          className="w-20 h-9 px-3 rounded-md border border-input bg-background text-sm font-mono placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        />
                        <button
                          onClick={() => removeFailureRow(i)}
                          className="h-9 w-9 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors duration-150 shrink-0"
                          title="Remove row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={addFailureRow}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors duration-150"
                    >
                      <Plus className="h-3 w-3" />
                      Add failure row
                    </button>
                  </div>
                )}

                {failureMismatch && (
                  <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
                    Failure quantities total {failureTotal}, but {form.total_failed} failures were recorded. Adjust the rows to match.
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <div className="shrink-0 px-6 py-4 border-t border-border flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-9 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 transition-all duration-150"
            >
              {saving
                ? <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />Saving…</span>
                : "Submit Inspection"}
            </button>
            <button
              onClick={() => setSheetOpen(false)}
              className="h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors duration-150"
            >
              Cancel
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function QCSkeleton() {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border bg-muted/40">
          {["w-[130px]", "w-[110px]", "w-[110px]", "w-[110px]", "w-[100px]", "w-[100px]", "w-[110px]"].map((w, i) => (
            <th key={i} className={cn("px-4 py-3", i === 0 && "px-8", i === 6 && "px-8")}>
              <div className={cn("h-3 bg-muted rounded animate-pulse", w)} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <tr key={i}>
            <td className="px-8 py-4"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></td>
            <td className="px-4 py-4"><div className="h-4 w-16 bg-muted rounded animate-pulse" /></td>
            <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></td>
            <td className="px-4 py-4"><div className="h-4 w-12 bg-muted rounded animate-pulse ml-auto" /></td>
            <td className="px-4 py-4"><div className="h-4 w-12 bg-muted rounded animate-pulse ml-auto" /></td>
            <td className="px-4 py-4"><div className="h-4 w-10 bg-muted rounded animate-pulse ml-auto" /></td>
            <td className="px-8 py-4"><div className="h-4 w-14 bg-muted rounded animate-pulse ml-auto" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center mb-4">
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No inspections yet</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
        Record your first quality inspection to track pass rates and trigger rework assignments.
      </p>
      <button
        onClick={onNew}
        className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors duration-150"
      >
        <Plus className="h-3.5 w-3.5" />
        New Inspection
      </button>
    </div>
  )
}
