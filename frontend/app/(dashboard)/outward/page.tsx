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
import { Plus, Loader2, Truck } from "lucide-react"
import { toast } from "sonner"

interface OutwardDelivery {
  id: number
  po_id: number
  po_number: string
  provider_name: string
  dispatch_date: string
  total_dispatched: number
  total_shortage: number
  total_spoiled: number
  days_from_arrival: number
  incentive_eligible: boolean
}

interface PurchaseOrder {
  id: number
  po_number: string
  provider_name: string
  days_remaining: number
  status: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

const emptyForm = {
  po_id: "",
  dispatch_date: new Date().toISOString().split("T")[0],
  total_dispatched: "",
  total_shortage: "0",
  total_spoiled: "0",
  notes: "",
}

function fmtDate(d: string) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function OutwardPage() {
  const [deliveries, setDeliveries] = useState<OutwardDelivery[]>([])
  const [pos, setPOs] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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

  const loadPOs = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<PurchaseOrder[]>>("/purchase-orders")
      const filtered = (res.data ?? []).filter(
        (p) => p.status === "in_progress" || p.status === "open"
      )
      setPOs(filtered)
    } catch {
      // non-blocking — PO list is optional
    }
  }, [])

  useEffect(() => {
    loadDeliveries()
    loadPOs()
  }, [loadDeliveries, loadPOs])

  function openSheet() {
    setForm({ ...emptyForm })
    setSaveError(null)
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.po_id) {
      setSaveError("Select a Purchase Order")
      return
    }
    if (!form.dispatch_date) {
      setSaveError("Enter dispatch date")
      return
    }
    if (!form.total_dispatched || Number(form.total_dispatched) <= 0) {
      setSaveError("Enter total dispatched quantity")
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await api.post("/outward-deliveries", {
        po_id: Number(form.po_id),
        dispatch_date: form.dispatch_date,
        total_dispatched: Number(form.total_dispatched),
        total_shortage: Number(form.total_shortage) || 0,
        total_spoiled: Number(form.total_spoiled) || 0,
        notes: form.notes || undefined,
      })
      setSheetOpen(false)
      toast.success("Delivery recorded")
      await loadDeliveries()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed"
      setSaveError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-[72px] shrink-0 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Outward Delivery</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dispatch finished sandals back to provider
          </p>
        </div>
        <button
          onClick={openSheet}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          New Delivery
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
            <Truck className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No outward deliveries yet.</p>
            <button
              onClick={openSheet}
              className="h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5 inline mr-1.5" />
              Record First Delivery
            </button>
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
                    Date
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Dispatched
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Shortage
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Spoiled
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Day
                  </th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Incentive
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{d.po_number}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{d.provider_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {fmtDate(d.dispatch_date)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-xs">
                      {d.total_dispatched}
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
                          d.total_spoiled > 0 ? "text-red-500 font-medium" : "text-muted-foreground"
                        )}
                      >
                        {d.total_spoiled}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono tabular-nums text-xs text-muted-foreground">
                        {d.days_from_arrival}d
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          d.incentive_eligible
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        )}
                      >
                        {d.incentive_eligible ? "Eligible" : "Missed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Delivery Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-[480px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-base font-semibold">New Outward Delivery</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5">
            {/* PO selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Purchase Order *
              </label>
              <Select
                value={form.po_id}
                onValueChange={(v) => setForm((f) => ({ ...f, po_id: v }))}
              >
                <SelectTrigger className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
                  <SelectValue placeholder="Select PO" />
                </SelectTrigger>
                <SelectContent>
                  {pos.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No open/in-progress POs found
                    </div>
                  ) : (
                    pos.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        <span className="font-mono">{p.po_number}</span>
                        <span className="text-muted-foreground text-xs ml-2">
                          {p.provider_name} — {p.days_remaining}d left
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Dispatch date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Dispatch Date *</label>
              <input
                type="date"
                value={form.dispatch_date}
                onChange={(e) => setForm((f) => ({ ...f, dispatch_date: e.target.value }))}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>

            {/* Total dispatched */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Total Dispatched *
              </label>
              <input
                type="number"
                min="1"
                value={form.total_dispatched}
                onChange={(e) => setForm((f) => ({ ...f, total_dispatched: e.target.value }))}
                placeholder="0"
                className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 font-mono"
              />
            </div>

            {/* Shortage + Spoiled */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Shortage</label>
                <input
                  type="number"
                  min="0"
                  value={form.total_shortage}
                  onChange={(e) => setForm((f) => ({ ...f, total_shortage: e.target.value }))}
                  className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Spoiled</label>
                <input
                  type="number"
                  min="0"
                  value={form.total_spoiled}
                  onChange={(e) => setForm((f) => ({ ...f, total_spoiled: e.target.value }))}
                  className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 font-mono"
                />
                <p className="text-xs text-muted-foreground">Factory loss</p>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes…"
                rows={3}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none"
              />
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
                {saving ? "Saving…" : "Save Delivery"}
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
