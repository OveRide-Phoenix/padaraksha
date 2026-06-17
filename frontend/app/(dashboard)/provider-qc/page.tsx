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

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

const emptyForm = {
  delivery_id: "",
  return_date: new Date().toISOString().split("T")[0],
  total_returned: "",
  full_return: false,
  reason: "",
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
    if (!form.total_returned || Number(form.total_returned) <= 0) {
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
        total_returned: Number(form.total_returned),
        full_return: form.full_return,
        reason: form.reason || undefined,
        failures: validFailures.map((f) => ({
          work_stage_id: Number(f.work_stage_id),
          quantity_failed: Number(f.quantity_failed),
        })),
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

            {/* Total returned */}
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
            </div>

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
