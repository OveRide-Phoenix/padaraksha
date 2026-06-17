"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Search, Plus, ArrowRight, Package } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { getSettings } from "@/lib/settings"

interface Article {
  id: number
  article_number: string
  name: string | null
  is_active: boolean
  variant_count: number
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

interface FormState {
  article_number: string
  name: string
  description: string
}

export default function ArticlesPage() {
  const router = useRouter()
  const [articles, setArticles]   = useState<Article[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm]           = useState<FormState>({ article_number: "", name: "", description: "" })
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState("")

  const loadArticles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<ApiResponse<Article[]>>("/articles")
      setArticles(res.data)
    } catch {
      // error handled silently — empty state shows
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadArticles() }, [loadArticles])

  const filtered = articles.filter(a =>
    a.article_number.toLowerCase().includes(search.toLowerCase()) ||
    (a.name ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    const prefix = getSettings().articleNumberPrefix
    setForm({ article_number: prefix, name: "", description: "" })
    setError("")
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!form.article_number.trim()) { setError("Article number is required."); return }
    setSaving(true)
    setError("")
    try {
      await api.post<ApiResponse<Article>>("/articles", {
        article_number: form.article_number.trim(),
        name: form.name.trim() || null,
        description: form.description.trim() || null,
      })
      setSheetOpen(false)
      toast.success("Article created")
      await loadArticles()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create article"
      const displayMsg = msg === "ARTICLE_NUMBER_EXISTS" ? "This article number already exists." : msg
      setError(displayMsg)
      toast.error(displayMsg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <header className="px-8 pt-8 pb-6 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Articles</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Sandal designs, bill of materials, and work stages</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all duration-150"
          >
            <Plus className="h-3.5 w-3.5" />
            New Article
          </button>
        </div>

        <div className="relative mt-5 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by number or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
        </div>
      </header>

      {/* Table */}
      <div className="flex-1">
        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={search.length > 0} onNew={openCreate} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-8 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-[160px]">Article No.</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-[100px]">Variants</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-[90px]">Status</th>
                <th className="px-8 py-3 w-[48px]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(article => (
                <tr
                  key={article.id}
                  onClick={() => router.push(`/articles/${article.id}`)}
                  className={cn(
                    "group hover:bg-muted/30 transition-colors duration-100 cursor-pointer",
                    !article.is_active && "opacity-50"
                  )}
                >
                  <td className="px-8 py-3.5">
                    <span className="font-mono text-[13px] font-medium tracking-tight">{article.article_number}</span>
                  </td>
                  <td className="px-4 py-3.5 text-foreground">
                    {article.name ?? <span className="text-muted-foreground italic">Unnamed</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="tabular-nums text-muted-foreground">{article.variant_count}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-medium",
                      article.is_active ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        article.is_active ? "bg-green-500" : "bg-zinc-400"
                      )} />
                      {article.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-8 py-3.5 text-right">
                    <Link
                      href={`/articles/${article.id}`}
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center justify-center w-7 h-7 rounded text-muted-foreground group-hover:text-foreground transition-colors duration-150"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-5 border-b border-border shrink-0">
            <SheetTitle className="text-base font-semibold">New Article</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">
                Article Number <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={form.article_number}
                onChange={e => { setForm(f => ({ ...f, article_number: e.target.value })); setError("") }}
                placeholder="e.g. PAD-001"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Classic Kolhapuri"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Contract details, special instructions…"
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none"
              />
            </div>

            <p className="text-xs text-muted-foreground pt-1">
              BOM and work stages are added from the article detail page after creation.
            </p>

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
                ? <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />Creating…</span>
                : "Create Article"}
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

function TableSkeleton() {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border bg-muted/40">
          <th className="px-8 py-3 w-[160px]"><div className="h-3 w-20 bg-muted rounded animate-pulse" /></th>
          <th className="px-4 py-3"><div className="h-3 w-12 bg-muted rounded animate-pulse" /></th>
          <th className="px-4 py-3 w-[100px]"><div className="h-3 w-14 bg-muted rounded animate-pulse" /></th>
          <th className="px-4 py-3 w-[90px]"><div className="h-3 w-10 bg-muted rounded animate-pulse" /></th>
          <th className="px-8 py-3 w-[48px]" />
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <tr key={i}>
            <td className="px-8 py-4"><div className="h-4 w-20 bg-muted rounded animate-pulse" /></td>
            <td className="px-4 py-4"><div className="h-4 rounded bg-muted animate-pulse" style={{ width: `${48 + (i * 17) % 40}%` }} /></td>
            <td className="px-4 py-4"><div className="h-4 w-6 bg-muted rounded animate-pulse" /></td>
            <td className="px-4 py-4"><div className="h-4 w-12 bg-muted rounded animate-pulse" /></td>
            <td className="px-8 py-4" />
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function EmptyState({ hasSearch, onNew }: { hasSearch: boolean; onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center mb-4">
        <Package className="h-5 w-5 text-muted-foreground" />
      </div>
      {hasSearch ? (
        <>
          <p className="text-sm font-medium">No articles match your search</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different article number or name</p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium">No articles yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
            Create your first sandal design to define its BOM and work stages.
          </p>
          <button
            onClick={onNew}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors duration-150"
          >
            <Plus className="h-3.5 w-3.5" />
            New Article
          </button>
        </>
      )}
    </div>
  )
}
