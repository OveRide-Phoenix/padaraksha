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
import { Plus, Loader2, ShieldAlert, Trash2 } from "lucide-react"

interface OutwardDelivery {
  id: number
  po_number: string
  provider_name: string
  dispatch_date: string
  total_dispatched: number
  total_shortage: number
  total_spoiled: number
  days_from_arrival: number
  incentive_eligible: boolean
}

interface FailureRow {
  work_stage_id: string
  quantity_failed: string
}

interface VariantLabel {
  id: number
  article_number: string | null
  colour: string | null
  size: string | null
  foot: "left" | "right" | "pair"
}

interface DeliveryLineItem {
  id: number
  variant: VariantLabel | null
  quantity_dispatched: number
  quantity_shortage: number
  quantity_spoiled: number
}

interface DeliveryDetail {
  id: number
  line_items: DeliveryLineItem[]
}

interface CountingRow {
  article_variant_id: number
  variant: VariantLabel | null
  quantity_dispatched: number
  quantity_reported_by_unit: string
  quantity_counted_by_company: string
  quantity_damaged: string
}

interface ReturnLineItem {
  id: number
  variant: VariantLabel | null
  quantity_dispatched: number | null
  quantity_reported_by_unit: number
  quantity_counted_by_company: number
  quantity_damaged: number
  shortage_unit: number | null
  shortage_company: number | null
  variance: number | null
}

interface PriorReturn {
  id: number
  return_date: string
  total_returned: number
  full_return: boolean
  reason: string | null
  rework_of_return_id: number | null
  round_number: number
  line_items: ReturnLineItem[]
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

function variantLabel(v: VariantLabel | null): string {
  if (!v) return "—"
  const foot = v.foot === "pair" ? "" : ` (${v.foot})`
  return `${v.article_number ?? ""} — ${v.colour ?? ""} sz ${v.size ?? "?"}${foot}`
}

const emptyForm = {
  delivery_id: "",
  return_date: new Date().toISOString().split("T")[0],
  total_returned: "",
  full_return: false,
  reason: "",
  rework_of_return_id: "",
}

const emptyFailure = (): FailureRow => ({ work_stage_id: "", quantity_failed: "" })

function fmtDate(d: string) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function ProviderQCPage() {
  const [deliveries, setDeliveries] = useState<OutwardDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [failures, setFailures] = useState<FailureRow[]>([emptyFailure()])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // Pre-select a delivery when clicking "Log Return" from a row
  const [preselectedId, setPreselectedId] = useState<string>("")
  const [countingRows, setCountingRows] = useState<CountingRow[]>([])
  const [countingLoading, setCountingLoading] = useState(false)
  const [priorReturns, setPriorReturns] = useState<PriorReturn[]>([])

  const loadDeliveries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<ApiResponse<OutwardDelivery[]>>("/outward-deliveries")
      setDeliveries(res.data ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load deliveries")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDeliveries()
  }, [loadDeliveries])

  useEffect(() => {
    if (!form.delivery_id) {
      setCountingRows([])
      setPriorReturns([])
      return
    }
    let cancelled = false
    setCountingLoading(true)
    Promise.all([
      api.get<ApiResponse<DeliveryDetail>>(`/outward-deliveries/${form.delivery_id}`),
      api.get<ApiResponse<PriorReturn[]>>(`/outward-deliveries/${form.delivery_id}/provider-returns`),
    ])
      .then(([deliveryRes, returnsRes]) => {
        if (cancelled) return
        const items = (deliveryRes.data?.line_items ?? []).map((li) => ({
          article_variant_id: li.variant?.id ?? 0,
          variant: li.variant,
          quantity_dispatched: li.quantity_dispatched,
          quantity_reported_by_unit: "",
          quantity_counted_by_company: "",
          quantity_damaged: "0",
        }))
        setCountingRows(items)
        setPriorReturns(returnsRes.data ?? [])
      })
      .catch(() => {
        if (!cancelled) {
          setCountingRows([])
          setPriorReturns([])
        }
      })
      .finally(() => {
        if (!cancelled) setCountingLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [form.delivery_id])

  function updateCountingRow(idx: number, field: keyof CountingRow, value: string) {
    setCountingRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    )
  }

  const countingTotals = countingRows.reduce(
    (acc, r) => ({
      counted: acc.counted + (Number(r.quantity_counted_by_company) || 0),
    }),
    { counted: 0 }
  )

  function openSheet(deliveryId?: string) {
    setForm({ ...emptyForm, delivery_id: deliveryId ?? "" })
    setPreselectedId(deliveryId ?? "")
    setFailures([emptyFailure()])
    setSaveError(null)
    setSheetOpen(true)
  }

  function addFailureRow() {
    setFailures((prev) => [...prev, emptyFailure()])
  }

  function removeFailureRow(idx: number) {
    setFailures((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateFailure(idx: number, field: keyof FailureRow, value: string) {
    setFailures((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    )
  }

  async function handleSave() {
    if (!form.delivery_id) {
      setSaveError("Select a delivery")
      return
    }
    if (!form.return_date) {
      setSaveError("Enter return date")
      return
    }
    const hasCountingRows = countingRows.length > 0
    const totalReturned = hasCountingRows ? countingTotals.counted : Number(form.total_returned)
    if (!totalReturned || totalReturned <= 0) {
      setSaveError("Enter total returned quantity")
      return
    }

    const validFailures = failures.filter(
      (f) => f.work_stage_id.trim() !== "" && f.quantity_failed.trim() !== ""
    )

    setSaving(true)
    setSaveError(null)
    try {
      await api.post(`/outward-deliveries/${form.delivery_id}/provider-return`, {
        return_date: form.return_date,
        total_returned: totalReturned,
        full_return: form.full_return,
        reason: form.reason || undefined,
        rework_of_return_id: form.rework_of_return_id ? Number(form.rework_of_return_id) : undefined,
        failures: validFailures.map((f) => ({
          work_stage_id: Number(f.work_stage_id),
          quantity_failed: Number(f.quantity_failed),
        })),
        line_items: hasCountingRows
          ? countingRows.map((r) => ({
              article_variant_id: r.article_variant_id,
              quantity_reported_by_unit: Number(r.quantity_reported_by_unit) || 0,
              quantity_counted_by_company: Number(r.quantity_counted_by_company) || 0,
              quantity_damaged: Number(r.quantity_damaged) || 0,
            }))
          : [],
      })
      setSheetOpen(false)
      await loadDeliveries()
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-[72px] shrink-0 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Provider QC</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Provider returns and rework tracking
          </p>
        </div>
        <button
          onClick={() => openSheet()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          Log Return
        </button>
      </div>

      {/* Content */}
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
              onClick={loadDeliveries}
              className="h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground"
            >
              Retry
            </button>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <ShieldAlert className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No outward deliveries to log returns for.</p>
            <p className="text-xs text-muted-foreground">Record a delivery first in Outward.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Select a dispatched delivery to log provider returns and rework assignments.
            </p>
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
                      Dispatched
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Shortage
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Spoiled
                    </th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {deliveries.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{d.po_number}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{d.provider_name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <span className="font-mono tabular-nums">{d.total_dispatched}</span>
                        <span className="ml-1 text-muted-foreground/60">pcs</span>
                        <span className="ml-2 text-muted-foreground/60">{fmtDate(d.dispatch_date)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            "font-mono tabular-nums text-xs",
                            d.total_shortage > 0
                              ? "text-amber-500 font-medium"
                              : "text-muted-foreground"
                          )}
                        >
                          {d.total_shortage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            "font-mono tabular-nums text-xs",
                            d.total_spoiled > 0
                              ? "text-red-500 font-medium"
                              : "text-muted-foreground"
                          )}
                        >
                          {d.total_spoiled}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openSheet(String(d.id))}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                        >
                          Log Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Log Return Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-[520px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-base font-semibold">Log Provider Return</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5">
            {/* Delivery selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Delivery *</label>
              <Select
                value={form.delivery_id}
                onValueChange={(v) => setForm((f) => ({ ...f, delivery_id: v }))}
              >
                <SelectTrigger className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
                  <SelectValue placeholder="Select delivery" />
                </SelectTrigger>
                <SelectContent>
                  {deliveries.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      <span className="font-mono">{d.po_number}</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        {d.provider_name} — {d.total_dispatched} pcs
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Previous returns / rework chain for this delivery */}
            {priorReturns.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Previous Returns for This Delivery
                </label>
                <div className="flex flex-col gap-1.5">
                  {priorReturns.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between px-3 py-2 rounded-md border border-border text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                          Round {r.round_number}
                        </span>
                        <span className="text-muted-foreground">{fmtDate(r.return_date)}</span>
                        <span className="font-mono tabular-nums">{r.total_returned} pcs</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, rework_of_return_id: String(r.id) }))}
                        className={cn(
                          "px-2 py-1 rounded border text-xs",
                          form.rework_of_return_id === String(r.id)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {form.rework_of_return_id === String(r.id) ? "Reworking this" : "Rework of this"}
                      </button>
                    </div>
                  ))}
                  {form.rework_of_return_id && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, rework_of_return_id: "" }))}
                      className="text-xs text-muted-foreground hover:text-foreground self-start"
                    >
                      Clear rework link
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Return date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Return Date *</label>
              <input
                type="date"
                value={form.return_date}
                onChange={(e) => setForm((f) => ({ ...f, return_date: e.target.value }))}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>

            {/* Per-variant dual counting, or manual total if delivery has no sizes */}
            {countingLoading ? (
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : countingRows.length > 0 ? (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Per Size — Unit Reported vs Company Recount *
                </label>
                <div className="border border-border rounded-md overflow-hidden overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Size</th>
                        <th className="text-right px-2 py-2 font-medium text-muted-foreground">Sent</th>
                        <th className="text-right px-2 py-2 font-medium text-muted-foreground">Unit Says</th>
                        <th className="text-right px-2 py-2 font-medium text-muted-foreground">Company Count</th>
                        <th className="text-right px-2 py-2 font-medium text-muted-foreground">Damaged</th>
                        <th className="text-right px-2 py-2 font-medium text-muted-foreground">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {countingRows.map((r, idx) => {
                        const reported = Number(r.quantity_reported_by_unit) || 0
                        const counted = Number(r.quantity_counted_by_company) || 0
                        const damaged = Number(r.quantity_damaged) || 0
                        const shortageUnit = r.quantity_dispatched - reported
                        const shortageCompany = r.quantity_dispatched - counted - damaged
                        const variance = shortageCompany - shortageUnit
                        return (
                          <tr key={r.article_variant_id}>
                            <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">
                              {variantLabel(r.variant)}
                            </td>
                            <td className="px-2 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                              {r.quantity_dispatched}
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                min="0"
                                value={r.quantity_reported_by_unit}
                                onChange={(e) => updateCountingRow(idx, "quantity_reported_by_unit", e.target.value)}
                                placeholder="0"
                                className="w-16 h-7 px-2 rounded border border-input bg-background text-right font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                min="0"
                                value={r.quantity_counted_by_company}
                                onChange={(e) => updateCountingRow(idx, "quantity_counted_by_company", e.target.value)}
                                placeholder="0"
                                className="w-16 h-7 px-2 rounded border border-input bg-background text-right font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                min="0"
                                value={r.quantity_damaged}
                                onChange={(e) => updateCountingRow(idx, "quantity_damaged", e.target.value)}
                                className="w-14 h-7 px-2 rounded border border-input bg-background text-right font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                              />
                            </td>
                            <td
                              className={cn(
                                "px-2 py-1.5 text-right font-mono tabular-nums",
                                variance > 0
                                  ? "text-red-500 font-medium"
                                  : variance < 0
                                  ? "text-amber-500"
                                  : "text-muted-foreground"
                              )}
                            >
                              {variance}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/20 font-medium">
                        <td className="px-3 py-1.5 text-muted-foreground">Total</td>
                        <td colSpan={3} />
                        <td className="px-2 py-1.5 text-right font-mono tabular-nums">{countingTotals.counted}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Variance = company&apos;s shortage minus the unit&apos;s own reported shortage. Positive means the
                  unit under-reported how much was missing.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Total Returned *</label>
                <input
                  type="number"
                  min="1"
                  value={form.total_returned}
                  onChange={(e) => setForm((f) => ({ ...f, total_returned: e.target.value }))}
                  placeholder="0"
                  className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  This delivery has no sizes recorded — add per-size line items in Outward for dual counting.
                </p>
              </div>
            )}

            {/* Full return toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Return Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, full_return: false }))}
                  className={cn(
                    "flex-1 h-9 rounded-md border text-xs font-medium transition-colors",
                    !form.full_return
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  Partial
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, full_return: true }))}
                  className={cn(
                    "flex-1 h-9 rounded-md border text-xs font-medium transition-colors",
                    form.full_return
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  Full Rejection
                </button>
              </div>
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Reason</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Describe the defect or reason for return…"
                rows={3}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none"
              />
            </div>

            {/* Failures section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  Failures by Work Stage
                </label>
                <button
                  type="button"
                  onClick={addFailureRow}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  Add failure
                </button>
              </div>

              {failures.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    value={row.work_stage_id}
                    onChange={(e) => updateFailure(idx, "work_stage_id", e.target.value)}
                    placeholder="Stage ID"
                    className="w-28 h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 font-mono"
                  />
                  <input
                    type="number"
                    min="1"
                    value={row.quantity_failed}
                    onChange={(e) => updateFailure(idx, "quantity_failed", e.target.value)}
                    placeholder="Qty failed"
                    className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 font-mono"
                  />
                  {failures.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFailureRow(idx)}
                      className="h-9 w-9 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Stage ID refers to the work stage responsible. Leave blank to skip.
              </p>
            </div>

            {saveError && (
              <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
                {saveError}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "Saving…" : "Save Return"}
              </button>
              <button
                onClick={() => setSheetOpen(false)}
                disabled={saving}
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
