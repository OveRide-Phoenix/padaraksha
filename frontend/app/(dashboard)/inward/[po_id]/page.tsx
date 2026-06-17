"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  Plus,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

// ─── Types ──────────────────────────────────────────────────────────────────

interface LineItem {
  id: number
  article_variant_id: number
  quantity_ordered: number
  article_number: string
  variant_label: string
}

interface InwardEntry {
  id: number
  received_date: string
  notes: string | null
}

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
  line_items: LineItem[]
  inward_entries: InwardEntry[]
}

interface ArticleVariant {
  id: number
  article_number: string
  variant_label: string
}

interface Article {
  id: number
  article_number: string
  variants: ArticleVariant[]
}

interface RawMaterial {
  id: number
  name: string
  unit: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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
  return "text-muted-foreground"
}

function today() {
  return new Date().toISOString().split("T")[0]
}

// ─── Inward Entry material row ───────────────────────────────────────────────

interface MaterialRow {
  raw_material_id: number
  name: string
  unit: string
  expected_quantity: string
  actual_quantity: string
  po_reference_price: string
}

// ─── Dept Bill ───────────────────────────────────────────────────────────────

interface DeptBillItem {
  raw_material_id: string
  quantity_dispatched: string
  quantity_short: string
}

interface DeptBill {
  bill_number: string
  department_name: string
  bill_date: string
  items: DeptBillItem[]
}

function emptyBill(): DeptBill {
  return {
    bill_number: "",
    department_name: "",
    bill_date: today(),
    items: [{ raw_material_id: "", quantity_dispatched: "", quantity_short: "" }],
  }
}

// ─── Add Line Item Sheet ─────────────────────────────────────────────────────

interface AddItemSheetProps {
  open: boolean
  onClose: () => void
  poId: number
  onSaved: () => void
}

function AddItemSheet({ open, onClose, poId, onSaved }: AddItemSheetProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loadingArticles, setLoadingArticles] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState("")
  const [qty, setQty] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedVariantId("")
    setQty("")
    setError(null)
    setLoadingArticles(true)
    api
      .get<ApiResponse<Article[]>>("/articles")
      .then((r) => setArticles(r.data ?? []))
      .catch(() => setArticles([]))
      .finally(() => setLoadingArticles(false))
  }, [open])

  const allVariants = articles.flatMap((a) =>
    (a.variants ?? []).map((v) => ({
      ...v,
      article_number: a.article_number,
    }))
  )

  const handleSave = async () => {
    setError(null)
    if (!selectedVariantId) { setError("Select an article variant"); return }
    if (!qty || Number(qty) <= 0) { setError("Enter a valid quantity"); return }
    setSaving(true)
    try {
      await api.post(`/purchase-orders/${poId}/line-items`, {
        article_variant_id: Number(selectedVariantId),
        quantity_ordered: Number(qty),
      })
      toast.success("Line item added")
      onSaved()
      onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add item"
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-[480px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-base font-semibold">Add Line Item</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Article Variant *</label>
            {loadingArticles ? (
              <div className="flex items-center gap-2 h-9">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Loading…</span>
              </div>
            ) : (
              <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                <SelectTrigger className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {allVariants.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.article_number} — {v.variant_label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Quantity Ordered *</label>
            <input
              type="number"
              min="1"
              step="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 font-mono"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] h-9 text-sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Item
            </Button>
            <Button variant="outline" className="h-9 text-sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Record Receipt Sheet ────────────────────────────────────────────────────

interface ReceiptSheetProps {
  open: boolean
  onClose: () => void
  poId: number
  onSaved: () => void
}

function ReceiptSheet({ open, onClose, poId, onSaved }: ReceiptSheetProps) {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(false)

  const [receivedDate, setReceivedDate] = useState(today())
  const [notes, setNotes] = useState("")
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([])
  const [deptBills, setDeptBills] = useState<DeptBill[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setReceivedDate(today())
    setNotes("")
    setDeptBills([])
    setError(null)

    setLoadingMaterials(true)
    api
      .get<ApiResponse<RawMaterial[]>>("/raw-materials")
      .then((r) => {
        const mats = r.data ?? []
        setRawMaterials(mats)
        setMaterialRows(
          mats.map((m) => ({
            raw_material_id: m.id,
            name: m.name,
            unit: m.unit,
            expected_quantity: "",
            actual_quantity: "",
            po_reference_price: "",
          }))
        )
      })
      .catch(() => {
        setRawMaterials([])
        setMaterialRows([])
      })
      .finally(() => setLoadingMaterials(false))
  }, [open])

  const updateMaterialRow = (idx: number, field: keyof MaterialRow, value: string) => {
    setMaterialRows((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }

  const addMaterialRow = () => {
    setMaterialRows((rows) => [
      ...rows,
      { raw_material_id: 0, name: "", unit: "", expected_quantity: "", actual_quantity: "", po_reference_price: "" },
    ])
  }

  const removeMaterialRow = (idx: number) => {
    setMaterialRows((rows) => rows.filter((_, i) => i !== idx))
  }

  // Dept bills helpers
  const addBill = () => setDeptBills((b) => [...b, emptyBill()])
  const removeBill = (idx: number) => setDeptBills((b) => b.filter((_, i) => i !== idx))

  const updateBill = (billIdx: number, field: keyof Omit<DeptBill, "items">, value: string) => {
    setDeptBills((bills) =>
      bills.map((b, i) => (i === billIdx ? { ...b, [field]: value } : b))
    )
  }

  const addBillItem = (billIdx: number) => {
    setDeptBills((bills) =>
      bills.map((b, i) =>
        i === billIdx
          ? { ...b, items: [...b.items, { raw_material_id: "", quantity_dispatched: "", quantity_short: "" }] }
          : b
      )
    )
  }

  const removeBillItem = (billIdx: number, itemIdx: number) => {
    setDeptBills((bills) =>
      bills.map((b, i) =>
        i === billIdx ? { ...b, items: b.items.filter((_, j) => j !== itemIdx) } : b
      )
    )
  }

  const updateBillItem = (billIdx: number, itemIdx: number, field: keyof DeptBillItem, value: string) => {
    setDeptBills((bills) =>
      bills.map((b, i) =>
        i === billIdx
          ? {
              ...b,
              items: b.items.map((item, j) =>
                j === itemIdx ? { ...item, [field]: value } : item
              ),
            }
          : b
      )
    )
  }

  const handleSave = async () => {
    setError(null)
    if (!receivedDate) { setError("Received date is required"); return }

    const lineItems = materialRows
      .filter((r) => r.raw_material_id && r.expected_quantity && r.actual_quantity)
      .map((r) => ({
        raw_material_id: r.raw_material_id,
        expected_quantity: Number(r.expected_quantity),
        actual_quantity: Number(r.actual_quantity),
        po_reference_price: r.po_reference_price ? Number(r.po_reference_price) : null,
      }))

    const deptBillsPayload = deptBills
      .filter((b) => b.bill_number.trim())
      .map((b) => ({
        bill_number: b.bill_number.trim(),
        department_name: b.department_name.trim(),
        bill_date: b.bill_date,
        items: b.items
          .filter((it) => it.raw_material_id && it.quantity_dispatched)
          .map((it) => ({
            raw_material_id: Number(it.raw_material_id),
            quantity_dispatched: Number(it.quantity_dispatched),
            quantity_short: it.quantity_short ? Number(it.quantity_short) : 0,
          })),
      }))

    setSaving(true)
    try {
      await api.post(`/purchase-orders/${poId}/inward-entry`, {
        received_date: receivedDate,
        notes: notes.trim() || null,
        line_items: lineItems,
        dept_bills: deptBillsPayload,
      })
      toast.success("Receipt recorded")
      onSaved()
      onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to record receipt"
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-[480px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-base font-semibold">Record Receipt</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6">
          {/* Basic */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Received Date *</label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes…"
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          </div>

          {/* Materials */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Materials</h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addMaterialRow}>
                <Plus className="h-3 w-3 mr-1" />
                Add Row
              </Button>
            </div>

            {loadingMaterials ? (
              <div className="flex items-center gap-2 h-8">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Loading materials…</span>
              </div>
            ) : (
              <div className="border border-border rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Material</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Expected</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Actual</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Price</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {materialRows.map((row, idx) => {
                      const shortage =
                        row.actual_quantity &&
                        row.expected_quantity &&
                        Number(row.actual_quantity) < Number(row.expected_quantity)
                      return (
                        <tr key={idx} className={shortage ? "bg-amber-500/5" : ""}>
                          <td className="px-2 py-1.5">
                            {row.name ? (
                              <span className="text-xs">{row.name}</span>
                            ) : (
                              <Select
                                value={String(row.raw_material_id) || ""}
                                onValueChange={(v) => {
                                  const mat = rawMaterials.find((m) => String(m.id) === v)
                                  setMaterialRows((rows) =>
                                    rows.map((r, i) =>
                                      i === idx
                                        ? { ...r, raw_material_id: Number(v), name: mat?.name ?? "", unit: mat?.unit ?? "" }
                                        : r
                                    )
                                  )
                                }}
                              >
                                <SelectTrigger className="h-7 text-xs border-border bg-background">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {rawMaterials.map((m) => (
                                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.expected_quantity}
                              onChange={(e) => updateMaterialRow(idx, "expected_quantity", e.target.value)}
                              className="h-7 w-20 px-2 rounded border border-input bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={row.actual_quantity}
                                onChange={(e) => updateMaterialRow(idx, "actual_quantity", e.target.value)}
                                className={`h-7 w-20 px-2 rounded border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring ${shortage ? "border-amber-400 text-amber-400" : "border-input"}`}
                              />
                              {shortage && <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />}
                            </div>
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.po_reference_price}
                              onChange={(e) => updateMaterialRow(idx, "po_reference_price", e.target.value)}
                              placeholder="—"
                              className="h-7 w-20 px-2 rounded border border-input bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <button
                              onClick={() => removeMaterialRow(idx)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {materialRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-xs text-muted-foreground">
                          No material rows. Click "Add Row" to add one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Dept Bills */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dept Bills</h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addBill}>
                <Plus className="h-3 w-3 mr-1" />
                Add Bill
              </Button>
            </div>

            {deptBills.length === 0 && (
              <p className="text-xs text-muted-foreground">No dept bills. Add one if applicable.</p>
            )}

            {deptBills.map((bill, bIdx) => (
              <div key={bIdx} className="border border-border rounded-md p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Bill {bIdx + 1}</span>
                  <button
                    onClick={() => removeBill(bIdx)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Bill No.</label>
                    <input
                      type="text"
                      value={bill.bill_number}
                      onChange={(e) => updateBill(bIdx, "bill_number", e.target.value)}
                      placeholder="DB-001"
                      className="h-8 px-2 rounded border border-input bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Department</label>
                    <input
                      type="text"
                      value={bill.department_name}
                      onChange={(e) => updateBill(bIdx, "department_name", e.target.value)}
                      placeholder="Insole Dept"
                      className="h-8 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-xs text-muted-foreground">Bill Date</label>
                    <input
                      type="date"
                      value={bill.bill_date}
                      onChange={(e) => updateBill(bIdx, "bill_date", e.target.value)}
                      className="h-8 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* Bill Items */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Items</span>
                    <button
                      onClick={() => addBillItem(bIdx)}
                      className="text-xs text-primary hover:underline"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="border border-border rounded overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border">
                          <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Material</th>
                          <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Dispatched</th>
                          <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Short</th>
                          <th className="px-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {bill.items.map((item, iIdx) => (
                          <tr key={iIdx}>
                            <td className="px-2 py-1">
                              <Select
                                value={item.raw_material_id}
                                onValueChange={(v) => updateBillItem(bIdx, iIdx, "raw_material_id", v)}
                              >
                                <SelectTrigger className="h-7 text-xs border-border bg-background">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {rawMaterials.map((m) => (
                                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={item.quantity_dispatched}
                                onChange={(e) => updateBillItem(bIdx, iIdx, "quantity_dispatched", e.target.value)}
                                className="h-7 w-16 px-2 rounded border border-input bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={item.quantity_short}
                                onChange={(e) => updateBillItem(bIdx, iIdx, "quantity_short", e.target.value)}
                                className="h-7 w-16 px-2 rounded border border-input bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <button
                                onClick={() => removeBillItem(bIdx, iIdx)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] h-9 text-sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Receipt
            </Button>
            <Button variant="outline" className="h-9 text-sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PODetailPage() {
  const params = useParams()
  const router = useRouter()
  const poId = Number(params.po_id)

  const [po, setPO] = useState<PO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [addItemOpen, setAddItemOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)

  const loadPO = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<ApiResponse<PO>>(`/purchase-orders/${poId}`)
      setPO(res.data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load purchase order")
    } finally {
      setLoading(false)
    }
  }, [poId])

  useEffect(() => {
    loadPO()
  }, [loadPO])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !po) {
    return (
      <div className="flex flex-col items-center gap-3 h-40 justify-center px-6">
        <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
          {error ?? "Purchase order not found"}
        </p>
        <Button variant="ghost" size="sm" onClick={loadPO} className="text-xs">Retry</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 h-[72px] shrink-0 border-b border-border">
        <button
          onClick={() => router.push("/inward")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Inward
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold font-mono tracking-tight">{po.po_number}</h1>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusPill(po.status)}`}>
            {statusLabel(po.status)}
          </span>
          <span className="text-sm text-muted-foreground">{po.provider_name}</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-2 text-xs text-muted-foreground">
          <span>PO Date: <span className="font-mono text-foreground">{po.po_date}</span></span>
          <span>Arrived: <span className="font-mono text-foreground">{po.arrival_date}</span></span>
          <span>Deadline: <span className="font-mono text-foreground">{po.deadline_date}</span></span>
          <span>
            Days left:{" "}
            <span className={`font-mono ${daysClass(po.days_remaining)}`}>
              {po.days_remaining <= 0 ? "Overdue" : `${po.days_remaining}d`}
            </span>
          </span>
        </div>

        {po.notes && (
          <p className="mt-2 text-xs text-muted-foreground italic">{po.notes}</p>
        )}
      </div>

      {/* Two-column content */}
      <div className="flex-1 overflow-auto px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Line Items */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">PO Line Items</h2>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setAddItemOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Item
            </Button>
          </div>

          {po.line_items.length === 0 ? (
            <div className="border border-border rounded-md flex items-center justify-center h-28 text-xs text-muted-foreground">
              No line items yet. Add an article variant to this PO.
            </div>
          ) : (
            <div className="border border-border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Article</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Variant</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Qty Ordered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {po.line_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2.5 text-xs font-mono">{item.article_number}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{item.variant_label}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-right">{item.quantity_ordered}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Inward Entries */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Inward Entries</h2>
            <Button
              size="sm"
              className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
              onClick={() => setReceiptOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Record Receipt
            </Button>
          </div>

          {po.inward_entries.length === 0 ? (
            <div className="border border-border rounded-md flex items-center justify-center h-28 text-xs text-muted-foreground">
              No receipts recorded yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {po.inward_entries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-border rounded-md px-4 py-3 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-foreground">{entry.received_date}</span>
                    <span className="text-xs text-muted-foreground">#{entry.id}</span>
                  </div>
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground">{entry.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sheets */}
      <AddItemSheet
        open={addItemOpen}
        onClose={() => setAddItemOpen(false)}
        poId={poId}
        onSaved={loadPO}
      />

      <ReceiptSheet
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        poId={poId}
        onSaved={loadPO}
      />
    </div>
  )
}
