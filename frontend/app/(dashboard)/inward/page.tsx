"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, ChevronRight, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface PO {
  id: number
  po_number: string
  po_date: string
  arrival_date: string
  deadline_date: string
  days_remaining: number
  status: "open" | "in_progress" | "delivered" | "overdue"
  provider_name: string
  notes: string | null
}

interface Provider {
  id: number
  name: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

function statusLabel(status: PO["status"]) {
  const map: Record<PO["status"], string> = {
    open: "Open",
    in_progress: "In Progress",
    delivered: "Delivered",
    overdue: "Overdue",
  }
  return map[status] ?? status
}

function statusPill(status: PO["status"]) {
  const map: Record<PO["status"], string> = {
    open: "bg-blue-500/10 text-blue-400",
    in_progress: "bg-amber-500/10 text-amber-400",
    delivered: "bg-green-500/10 text-green-400",
    overdue: "bg-red-500/10 text-red-400",
  }
  return map[status] ?? ""
}

function daysClass(days: number) {
  if (days <= 0) return "text-red-400 font-semibold"
  if (days <= 2) return "text-amber-400 font-semibold"
  return ""
}

function addDays(dateStr: string, n: number): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().split("T")[0]
}

function today(): string {
  return new Date().toISOString().split("T")[0]
}

export default function InwardPage() {
  const router = useRouter()

  const [pos, setPos] = useState<PO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [providersLoading, setProvidersLoading] = useState(false)

  // Form state
  const [form, setForm] = useState({
    provider_id: "",
    po_number: "",
    po_date: today(),
    arrival_date: today(),
    notes: "",
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadPOs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<ApiResponse<PO[]>>("/purchase-orders")
      setPos(res.data ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load purchase orders")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPOs()
  }, [loadPOs])

  const openSheet = async () => {
    setSheetOpen(true)
    setSaveError(null)
    setForm({
      provider_id: "",
      po_number: "",
      po_date: today(),
      arrival_date: today(),
      notes: "",
    })
    if (providers.length === 0) {
      setProvidersLoading(true)
      try {
        const res = await api.get<ApiResponse<Provider[]>>("/providers")
        setProviders(res.data ?? [])
      } catch {
        // ignore provider load error
      } finally {
        setProvidersLoading(false)
      }
    }
  }

  const handleSave = async () => {
    setSaveError(null)
    if (!form.provider_id) { setSaveError("Please select a provider"); return }
    if (!form.po_number.trim()) { setSaveError("PO number is required"); return }
    if (!form.po_date) { setSaveError("PO date is required"); return }
    if (!form.arrival_date) { setSaveError("Arrival date is required"); return }

    setSaving(true)
    try {
      await api.post("/purchase-orders", {
        provider_id: Number(form.provider_id),
        po_number: form.po_number.trim(),
        po_date: form.po_date,
        arrival_date: form.arrival_date,
        notes: form.notes.trim() || null,
      })
      setSheetOpen(false)
      toast.success("Purchase order created")
      await loadPOs()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create purchase order"
      setSaveError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const computedDeadline = form.arrival_date ? addDays(form.arrival_date, 5) : null

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 h-[72px] shrink-0 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Inward Entry</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage purchase orders and inward receipts</p>
        </div>
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] h-8 px-3 text-xs"
          onClick={openSheet}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          New PO
        </Button>
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
            <Button variant="ghost" size="sm" onClick={loadPOs} className="text-xs">Retry</Button>
          </div>
        ) : pos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <p className="text-sm text-muted-foreground">No purchase orders yet.</p>
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={openSheet}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create First PO
            </Button>
          </div>
        ) : (
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">PO No.</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Provider</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Arrived</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Deadline</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Days Left</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pos.map((po) => (
                  <tr
                    key={po.id}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/inward/${po.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium">{po.po_number}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{po.provider_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{po.arrival_date}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{po.deadline_date}</td>
                    <td className={`px-4 py-3 text-xs font-mono ${daysClass(po.days_remaining)}`}>
                      {po.days_remaining <= 0 ? "Overdue" : `${po.days_remaining}d`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusPill(po.status)}`}>
                        {statusLabel(po.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create PO Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-[480px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-base font-semibold">New Purchase Order</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5">
            {/* Provider */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Provider *</label>
              {providersLoading ? (
                <div className="flex items-center gap-2 h-9">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Loading providers…</span>
                </div>
              ) : (
                <Select
                  value={form.provider_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, provider_id: v }))}
                >
                  <SelectTrigger className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* PO Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">PO Number *</label>
              <input
                type="text"
                value={form.po_number}
                onChange={(e) => setForm((f) => ({ ...f, po_number: e.target.value }))}
                placeholder="e.g. PO-2024-001"
                className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 font-mono"
              />
            </div>

            {/* PO Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">PO Date *</label>
              <input
                type="date"
                value={form.po_date}
                onChange={(e) => setForm((f) => ({ ...f, po_date: e.target.value }))}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>

            {/* Arrival Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Arrival Date *</label>
              <input
                type="date"
                value={form.arrival_date}
                onChange={(e) => setForm((f) => ({ ...f, arrival_date: e.target.value }))}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
              {computedDeadline && (
                <p className="text-xs text-muted-foreground">
                  Computed deadline: <span className="font-mono text-foreground">{computedDeadline}</span> (arrival + 5 days)
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes…"
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            {saveError && (
              <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
                {saveError}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] h-9 text-sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create PO
              </Button>
              <Button
                variant="outline"
                className="h-9 text-sm"
                onClick={() => setSheetOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
