"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { ArrowLeft, Plus, Pencil, Loader2, Trash2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { api } from "@/lib/api"

// ── Types ─────────────────────────────────────────────────────────────────────

interface BomItem {
  id: number
  raw_material_name: string
  unit: string
  quantity: number
}

interface WorkStage {
  id: number
  name: string
  sequence_order: number
  is_parallel: boolean
  pay_rate: number
  is_active: boolean
}

interface Variant {
  id: number
  colour: string | null
  size: string | null
  gender: string
  foot: string
  is_active: boolean
}

interface Article {
  id: number
  article_number: string
  name: string | null
  description: string | null
  is_active: boolean
  bom_items: BomItem[]
  work_stages: WorkStage[]
  variants: Variant[]
}

interface RawMaterial {
  id: number
  name: string
  unit: string
}

interface ApiResponse<T> { success: boolean; data: T; message: string }

type Panel = null | "edit" | "bom" | "stage" | "variant"

// ── Helper components ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
      {children}
    </p>
  )
}

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors duration-150 group"
    >
      <Plus className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
      {label}
    </button>
  )
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
      {msg}
    </p>
  )
}

function SaveButton({ saving, label, onClick }: { saving: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex-1 h-9 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 transition-all duration-150"
    >
      {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {saving ? "Saving…" : label}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ArticleDetailPage() {
  const params = useParams()
  const articleId = Number(params.id)

  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [panel, setPanel] = useState<Panel>(null)

  // Raw materials for BOM autocomplete
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])

  const loadArticle = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<Article>>(`/articles/${articleId}`)
      setArticle(res.data)
    } catch {
      // 404 handled below via null check
    } finally {
      setLoading(false)
    }
  }, [articleId])

  useEffect(() => { loadArticle() }, [loadArticle])

  const openPanel = async (p: Panel) => {
    if (p === "bom") {
      try {
        const res = await api.get<ApiResponse<RawMaterial[]>>("/raw-materials")
        setRawMaterials(res.data)
      } catch { /* proceed with empty list */ }
    }
    setPanel(p)
  }

  const closePanel = () => setPanel(null)
  const refresh = async () => { closePanel(); await loadArticle() }

  const deleteStage = async (stageId: number) => {
    if (!confirm("Delete this work stage?")) return
    try {
      await api.del(`/articles/${articleId}/stages/${stageId}`)
      await loadArticle()
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-[400px]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[400px]">
        <p className="text-sm text-muted-foreground">Article not found.</p>
        <Link href="/articles" className="mt-3 text-xs text-primary hover:underline">Back to articles</Link>
      </div>
    )
  }

  const totalPayRate = article.work_stages.reduce((s, st) => s + st.pay_rate, 0)

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <header className="px-8 pt-6 pb-5 border-b border-border">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors duration-150"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Articles
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl font-semibold tracking-tight truncate">
                <span className="font-mono">{article.article_number}</span>
                {article.name && <>: {article.name}</>}
              </span>
              <span className={cn(
                "shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full",
                article.is_active
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", article.is_active ? "bg-green-500" : "bg-zinc-400")} />
                {article.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            {article.description && (
              <p className="text-sm text-muted-foreground mt-1 max-w-prose leading-relaxed">{article.description}</p>
            )}
          </div>
          <button
            onClick={() => openPanel("edit")}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors duration-150"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
      </header>

      {/* Body: two-column spec layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">

        {/* Left: BOM */}
        <div className="p-8">
          <SectionLabel>Bill of Materials</SectionLabel>
          {article.bom_items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No materials added yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-left text-[11px] font-medium text-muted-foreground">Material</th>
                  <th className="pb-2 text-right text-[11px] font-medium text-muted-foreground pr-4">Qty</th>
                  <th className="pb-2 text-left text-[11px] font-medium text-muted-foreground">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {article.bom_items.map(item => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 pr-4">{item.raw_material_name}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums font-mono text-[13px]">
                      {item.quantity % 1 === 0 ? item.quantity.toFixed(0) : item.quantity}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <AddRowButton label="Add material" onClick={() => openPanel("bom")} />
        </div>

        {/* Right: Work Stages */}
        <div className="p-8">
          <SectionLabel>Work Stages</SectionLabel>
          {article.work_stages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No work stages yet.</p>
          ) : (
            <div>
              {article.work_stages.map((stage, i) => (
                <div
                  key={stage.id}
                  className={cn(
                    "flex items-center justify-between py-2.5 gap-3 group",
                    i < article.work_stages.length - 1 && "border-b border-border"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-semibold text-muted-foreground bg-muted shrink-0 tabular-nums">
                      {stage.sequence_order}
                    </span>
                    <span className="text-sm truncate">{stage.name}</span>
                    {stage.is_parallel && (
                      <span className="text-[10px] text-muted-foreground border border-border rounded px-1">parallel</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[13px] text-muted-foreground tabular-nums">
                      ₹{stage.pay_rate.toFixed(2)}
                    </span>
                    <button
                      onClick={() => deleteStage(stage.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
                      title="Delete stage"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 mt-1 border-t border-border">
                <span className="text-xs font-medium text-muted-foreground">Total per pair</span>
                <span className="font-mono text-sm font-semibold tabular-nums">₹{totalPayRate.toFixed(2)}</span>
              </div>
            </div>
          )}
          <AddRowButton label="Add stage" onClick={() => openPanel("stage")} />
        </div>
      </div>

      {/* Variants footer */}
      <div className="border-t border-border px-8 py-6">
        <SectionLabel>Variants</SectionLabel>
        {article.variants.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-3">No variants added.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-1">
            {article.variants.map(v => (
              <span
                key={v.id}
                className={cn(
                  "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border",
                  v.is_active
                    ? "border-border text-foreground bg-muted/30"
                    : "border-dashed border-border text-muted-foreground opacity-50"
                )}
              >
                {[v.colour, v.size, v.gender !== "unisex" ? v.gender : null].filter(Boolean).join(" · ")}
              </span>
            ))}
          </div>
        )}
        <button
          onClick={() => openPanel("variant")}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors duration-150"
        >
          <Plus className="h-3 w-3" />
          Add variant
        </button>
      </div>

      {/* ── Panels ── */}

      <EditPanel
        article={article}
        open={panel === "edit"}
        onClose={closePanel}
        onSaved={refresh}
      />

      <BomPanel
        articleId={articleId}
        rawMaterials={rawMaterials}
        open={panel === "bom"}
        onClose={closePanel}
        onSaved={refresh}
      />

      <StagePanel
        articleId={articleId}
        nextOrder={article.work_stages.length + 1}
        open={panel === "stage"}
        onClose={closePanel}
        onSaved={refresh}
      />

      <VariantPanel
        articleId={articleId}
        open={panel === "variant"}
        onClose={closePanel}
        onSaved={refresh}
      />
    </div>
  )
}

// ── Edit article panel ────────────────────────────────────────────────────────

function EditPanel({ article, open, onClose, onSaved }: {
  article: Article
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName]             = useState(article.name ?? "")
  const [description, setDesc]      = useState(article.description ?? "")
  const [isActive, setIsActive]     = useState(article.is_active)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState("")

  // Reset when article changes
  useEffect(() => {
    setName(article.name ?? "")
    setDesc(article.description ?? "")
    setIsActive(article.is_active)
    setError("")
  }, [article, open])

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      await api.put<ApiResponse<Article>>(`/articles/${article.id}`, {
        name: name.trim() || null,
        description: description.trim() || null,
        is_active: isActive,
      })
      onSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-5 border-b border-border shrink-0">
          <SheetTitle className="text-base font-semibold">Edit Article</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">Article Number</label>
            <p className="h-9 px-3 flex items-center rounded-md border border-input bg-muted/40 text-sm font-mono text-muted-foreground">
              {article.article_number}
            </p>
            <p className="text-[11px] text-muted-foreground">Article number cannot be changed after creation.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Classic Kolhapuri"
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">Description</label>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none"
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Inactive articles won't appear in production flows.</p>
            </div>
            <button
              onClick={() => setIsActive(v => !v)}
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors duration-200",
                isActive ? "bg-primary" : "bg-muted"
              )}
            >
              <span className={cn(
                "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
                isActive && "translate-x-5"
              )} />
            </button>
          </div>
          {error && <FieldError msg={error} />}
        </div>
        <div className="shrink-0 px-6 py-4 border-t border-border flex gap-2">
          <SaveButton saving={saving} label="Save Changes" onClick={handleSave} />
          <button onClick={onClose} className="h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">Cancel</button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Add BOM item panel ────────────────────────────────────────────────────────

function BomPanel({ articleId, rawMaterials, open, onClose, onSaved }: {
  articleId: number
  rawMaterials: RawMaterial[]
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [matName, setMatName]   = useState("")
  const [unit, setUnit]         = useState("piece")
  const [quantity, setQuantity] = useState("")
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) { setMatName(""); setUnit("piece"); setQuantity(""); setError("") }
  }, [open])

  const suggestions = rawMaterials.filter(m =>
    m.name.toLowerCase().includes(matName.toLowerCase()) && matName.length > 0
  ).slice(0, 6)

  const selectMaterial = (m: RawMaterial) => {
    setMatName(m.name)
    setUnit(m.unit)
    setShowSuggestions(false)
  }

  const handleSave = async () => {
    if (!matName.trim()) { setError("Material name is required."); return }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) { setError("Enter a valid quantity."); return }
    setSaving(true)
    setError("")
    try {
      // Find or create the raw material, then add BOM item
      const matRes = await api.post<ApiResponse<RawMaterial>>("/raw-materials", { name: matName.trim(), unit: unit.trim() || "piece" })
      await api.post(`/articles/${articleId}/bom`, { raw_material_id: matRes.data.id, quantity: Number(quantity) })
      onSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add material")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-5 border-b border-border shrink-0">
          <SheetTitle className="text-base font-semibold">Add Material</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="space-y-1.5 relative">
            <label className="text-xs font-medium text-foreground/80">Material name <span className="text-destructive">*</span></label>
            <input
              ref={inputRef}
              type="text"
              value={matName}
              onChange={e => { setMatName(e.target.value); setShowSuggestions(true); setError("") }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="e.g. Buffalo Leather Upper"
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md overflow-hidden">
                {suggestions.map(m => (
                  <button
                    key={m.id}
                    onMouseDown={() => selectMaterial(m)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
                  >
                    <span>{m.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{m.unit}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Quantity <span className="text-destructive">*</span></label>
              <input
                type="number"
                value={quantity}
                onChange={e => { setQuantity(e.target.value); setError("") }}
                placeholder="1"
                min="0"
                step="0.001"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="piece"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            New material names are saved to your factory's raw materials library for reuse.
          </p>
          {error && <FieldError msg={error} />}
        </div>
        <div className="shrink-0 px-6 py-4 border-t border-border flex gap-2">
          <SaveButton saving={saving} label="Add Material" onClick={handleSave} />
          <button onClick={onClose} className="h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">Cancel</button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Add work stage panel ──────────────────────────────────────────────────────

function StagePanel({ articleId, nextOrder, open, onClose, onSaved }: {
  articleId: number
  nextOrder: number
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName]             = useState("")
  const [seqOrder, setSeqOrder]     = useState(String(nextOrder))
  const [isParallel, setIsParallel] = useState(false)
  const [payRate, setPayRate]       = useState("")
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState("")

  useEffect(() => {
    if (open) { setName(""); setSeqOrder(String(nextOrder)); setIsParallel(false); setPayRate(""); setError("") }
  }, [open, nextOrder])

  const handleSave = async () => {
    if (!name.trim()) { setError("Stage name is required."); return }
    setSaving(true)
    setError("")
    try {
      await api.post(`/articles/${articleId}/stages`, {
        name: name.trim(),
        sequence_order: Number(seqOrder) || nextOrder,
        is_parallel: isParallel,
        pay_rate: Number(payRate) || 0,
      })
      onSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add stage")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-5 border-b border-border shrink-0">
          <SheetTitle className="text-base font-semibold">Add Work Stage</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">Stage name <span className="text-destructive">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError("") }}
              placeholder="e.g. Upper Cutting"
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Sequence order</label>
              <input
                type="number"
                value={seqOrder}
                onChange={e => setSeqOrder(e.target.value)}
                min="1"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Pay rate (₹)</label>
              <input
                type="number"
                value={payRate}
                onChange={e => setPayRate(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Parallel stage</p>
              <p className="text-xs text-muted-foreground">Runs simultaneously with the previous stage.</p>
            </div>
            <button
              onClick={() => setIsParallel(v => !v)}
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors duration-200",
                isParallel ? "bg-primary" : "bg-muted"
              )}
            >
              <span className={cn(
                "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
                isParallel && "translate-x-5"
              )} />
            </button>
          </div>
          {error && <FieldError msg={error} />}
        </div>
        <div className="shrink-0 px-6 py-4 border-t border-border flex gap-2">
          <SaveButton saving={saving} label="Add Stage" onClick={handleSave} />
          <button onClick={onClose} className="h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">Cancel</button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Add variant panel ─────────────────────────────────────────────────────────

function VariantPanel({ articleId, open, onClose, onSaved }: {
  articleId: number
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [colour, setColour]     = useState("")
  const [size, setSize]         = useState("")
  const [gender, setGender]     = useState<"men" | "women" | "kids" | "unisex">("unisex")
  const [foot, setFoot]         = useState<"left" | "right" | "pair">("pair")
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState("")

  useEffect(() => {
    if (open) { setColour(""); setSize(""); setGender("unisex"); setFoot("pair"); setError("") }
  }, [open])

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      await api.post(`/articles/${articleId}/variants`, {
        colour: colour.trim() || null,
        size: size.trim() || null,
        gender,
        foot,
      })
      onSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add variant")
    } finally {
      setSaving(false)
    }
  }

  const genderOptions = ["men", "women", "kids", "unisex"] as const
  const footOptions   = ["left", "right", "pair"] as const

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-5 border-b border-border shrink-0">
          <SheetTitle className="text-base font-semibold">Add Variant</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Colour</label>
              <input
                type="text"
                value={colour}
                onChange={e => setColour(e.target.value)}
                placeholder="e.g. Tan"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Size</label>
              <input
                type="text"
                value={size}
                onChange={e => setSize(e.target.value)}
                placeholder="e.g. 8"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">Gender</label>
            <div className="flex gap-2">
              {genderOptions.map(g => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={cn(
                    "flex-1 h-9 rounded-md border text-sm font-medium capitalize transition-colors duration-150",
                    gender === g
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">Foot</label>
            <div className="flex gap-2">
              {footOptions.map(f => (
                <button
                  key={f}
                  onClick={() => setFoot(f)}
                  className={cn(
                    "flex-1 h-9 rounded-md border text-sm font-medium capitalize transition-colors duration-150",
                    foot === f
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {error && <FieldError msg={error} />}
        </div>
        <div className="shrink-0 px-6 py-4 border-t border-border flex gap-2">
          <SaveButton saving={saving} label="Add Variant" onClick={handleSave} />
          <button onClick={onClose} className="h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">Cancel</button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
