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
import { Plus, ClipboardCheck, Layers, GripVertical, User, X, ArrowRight, ChevronUp } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Assignment {
  id: number
  po_id: number
  po_number: string
  article_id: number
  article_number: string
  work_stage_id: number
  stage_name: string
  employee_id: number
  employee_name: string
  quantity_assigned: number
  quantity_completed: number
  start_date: string
  is_rework: boolean
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

interface Employee {
  id: number
  name: string
  role: string
  pay_type: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

// A piece of work that's been defined (article + stage + qty) but not yet
// dragged onto a worker. Lives client-side only until assigned.
interface QueuedWork {
  queueId: string
  po_id: number
  po_number: string
  article_id: number
  article_number: string
  work_stage_id: number
  stage_name: string
  pay_rate: number
  quantity_assigned: number
  start_date: string
  notes: string
  is_rework: boolean
}

// ─── Default values ────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split("T")[0]

interface WorkForm {
  po_id: string
  article_id: string
  work_stage_id: string
  quantity_assigned: string
  start_date: string
  notes: string
  is_rework: boolean
}

const emptyWorkForm = (): WorkForm => ({
  po_id: "",
  article_id: "",
  work_stage_id: "",
  quantity_assigned: "",
  start_date: today(),
  notes: "",
  is_rework: false,
})

interface CompletionForm {
  quantity_completed: string
  end_date: string
  notes: string
}

const emptyCompletionForm = (): CompletionForm => ({
  quantity_completed: "",
  end_date: today(),
  notes: "",
})

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductionPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [workStages, setWorkStages] = useState<WorkStage[]>([])
  const [loading, setLoading] = useState(true)

  // Work queue — defined but unassigned work, lives client-side
  const [queue, setQueue] = useState<QueuedWork[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverEmployeeId, setDragOverEmployeeId] = useState<number | null>(null)
  const [assigningId, setAssigningId] = useState<string | null>(null)

  // Filters
  const [filterPO, setFilterPO] = useState("")
  const [assignedExpanded, setAssignedExpanded] = useState(false)

  // New work sheet
  const [workSheetOpen, setWorkSheetOpen] = useState(false)
  const [workForm, setWorkForm] = useState<WorkForm>(emptyWorkForm())
  const [workError, setWorkError] = useState("")
  const [stagesLoading, setStagesLoading] = useState(false)

  // Log completion sheet
  const [completionSheetOpen, setCompletionSheetOpen] = useState(false)
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null)
  const [completionForm, setCompletionForm] = useState<CompletionForm>(emptyCompletionForm())
  const [completionSaving, setCompletionSaving] = useState(false)
  const [completionError, setCompletionError] = useState("")

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadAssignments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<ApiResponse<Assignment[]>>("/work-assignments")
      setAssignments(res.data)
    } catch {
      // silent — empty state shows
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDropdowns = useCallback(async () => {
    try {
      const [posRes, articlesRes, employeesRes] = await Promise.all([
        api.get<ApiResponse<PurchaseOrder[]>>("/purchase-orders"),
        api.get<ApiResponse<Article[]>>("/articles"),
        api.get<ApiResponse<Employee[]>>("/employees"),
      ])
      setPurchaseOrders(posRes.data)
      setArticles(articlesRes.data)
      setEmployees(employeesRes.data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    loadAssignments()
    loadDropdowns()
  }, [loadAssignments, loadDropdowns])

  // When article_id changes in work form, fetch its work stages
  useEffect(() => {
    if (!workForm.article_id) {
      setWorkStages([])
      setWorkForm(f => ({ ...f, work_stage_id: "" }))
      return
    }
    let cancelled = false
    setStagesLoading(true)
    api
      .get<ApiResponse<{ work_stages: WorkStage[] }>>(`/articles/${workForm.article_id}`)
      .then(res => {
        if (!cancelled) {
          const stages = res.data.work_stages ?? []
          setWorkStages(stages.sort((a, b) => a.sequence_order - b.sequence_order))
          setWorkForm(f => ({ ...f, work_stage_id: "" }))
        }
      })
      .catch(() => {
        if (!cancelled) setWorkStages([])
      })
      .finally(() => {
        if (!cancelled) setStagesLoading(false)
      })
    return () => { cancelled = true }
  }, [workForm.article_id])

  // ── Filtered list ───────────────────────────────────────────────────────────

  const filtered = assignments.filter(a =>
    !filterPO || String(a.po_id) === filterPO
  )

  // ── New work (queue it, don't assign yet) ──────────────────────────────────

  const openWorkSheet = () => {
    setWorkForm(emptyWorkForm())
    setWorkStages([])
    setWorkError("")
    setWorkSheetOpen(true)
  }

  const handleQueueWork = () => {
    if (!workForm.po_id) { setWorkError("Select a purchase order."); return }
    if (!workForm.article_id) { setWorkError("Select an article."); return }
    if (!workForm.work_stage_id) { setWorkError("Select a work stage."); return }
    if (!workForm.quantity_assigned || Number(workForm.quantity_assigned) <= 0) {
      setWorkError("Enter a valid quantity.")
      return
    }

    const po = purchaseOrders.find(p => String(p.id) === workForm.po_id)
    const article = articles.find(a => String(a.id) === workForm.article_id)
    const stage = workStages.find(s => String(s.id) === workForm.work_stage_id)
    if (!po || !article || !stage) { setWorkError("Something went wrong — try again."); return }

    const item: QueuedWork = {
      queueId: crypto.randomUUID(),
      po_id: po.id,
      po_number: po.po_number,
      article_id: article.id,
      article_number: article.article_number,
      work_stage_id: stage.id,
      stage_name: stage.name,
      pay_rate: stage.pay_rate,
      quantity_assigned: Number(workForm.quantity_assigned),
      start_date: workForm.start_date,
      notes: workForm.notes.trim(),
      is_rework: workForm.is_rework,
    }
    setQueue(q => [...q, item])
    setWorkSheetOpen(false)
    toast.success("Work added — drag it onto a worker to assign")
  }

  const removeFromQueue = (queueId: string) => {
    setQueue(q => q.filter(item => item.queueId !== queueId))
  }

  // ── Assign a queued work item to a worker (drag-drop or fallback select) ────

  const assignToWorker = async (item: QueuedWork, employeeId: number) => {
    setAssigningId(item.queueId)
    try {
      await api.post<ApiResponse<Assignment>>("/work-assignments", {
        po_id: item.po_id,
        article_id: item.article_id,
        work_stage_id: item.work_stage_id,
        employee_id: employeeId,
        quantity_assigned: item.quantity_assigned,
        start_date: item.start_date,
        notes: item.notes || undefined,
        is_rework: item.is_rework,
      })
      const employee = employees.find(e => e.id === employeeId)
      removeFromQueue(item.queueId)
      toast.success(`Assigned ${item.stage_name} to ${employee?.name ?? "worker"}`)
      await loadAssignments()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to assign work."
      toast.error(msg)
    } finally {
      setAssigningId(null)
    }
  }

  // ── Drag handlers ────────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, queueId: string) => {
    e.dataTransfer.setData("text/plain", queueId)
    e.dataTransfer.effectAllowed = "move"
    setDraggingId(queueId)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverEmployeeId(null)
  }

  const handleDropOnWorker = (e: React.DragEvent, employeeId: number) => {
    e.preventDefault()
    const queueId = e.dataTransfer.getData("text/plain")
    const item = queue.find(q => q.queueId === queueId)
    setDragOverEmployeeId(null)
    setDraggingId(null)
    if (item) assignToWorker(item, employeeId)
  }

  // ── Log completion ──────────────────────────────────────────────────────────

  const openCompletion = (assignment: Assignment) => {
    setActiveAssignment(assignment)
    setCompletionForm(emptyCompletionForm())
    setCompletionError("")
    setCompletionSheetOpen(true)
  }

  const handleCompletionSave = async () => {
    if (!activeAssignment) return
    const qty = Number(completionForm.quantity_completed)
    if (!qty || qty <= 0) { setCompletionError("Enter a valid quantity."); return }
    if (qty > activeAssignment.quantity_assigned) {
      setCompletionError(`Cannot exceed assigned quantity of ${activeAssignment.quantity_assigned}.`)
      return
    }
    setCompletionSaving(true)
    setCompletionError("")
    try {
      await api.post<ApiResponse<unknown>>(
        `/work-assignments/${activeAssignment.id}/completions`,
        {
          quantity_completed: qty,
          end_date: completionForm.end_date,
          notes: completionForm.notes.trim() || undefined,
        }
      )
      setCompletionSheetOpen(false)
      toast.success("Completion logged")
      await loadAssignments()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log completion."
      setCompletionError(msg)
      toast.error(msg)
    } finally {
      setCompletionSaving(false)
    }
  }

  // ── Open POs for the work form ──────────────────────────────────────────────

  const openPOs = purchaseOrders.filter(p =>
    p.status === "open" || p.status === "in_progress"
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <header className="px-6 h-[72px] shrink-0 border-b border-border flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Production</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Define work, then drag it onto a worker to assign</p>
        </div>
        <button
          onClick={openWorkSheet}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all duration-150"
        >
          <Plus className="h-3.5 w-3.5" />
          New Work
        </button>
      </header>

      {/* Scrollable middle: queue + workers */}
      <div className="flex-1 overflow-y-auto min-h-0">

      {/* ── Work queue ──────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-muted/20 px-6 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
          Unassigned Work {queue.length > 0 && `(${queue.length})`}
        </p>
        {queue.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No pending work. Click <span className="font-medium text-foreground">New Work</span> to define an article + stage, then drag it onto a worker below.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {queue.map(item => (
              <div
                key={item.queueId}
                draggable={assigningId !== item.queueId}
                onDragStart={e => handleDragStart(e, item.queueId)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "group relative flex items-center gap-2.5 pl-2.5 pr-3 py-2 rounded-lg border bg-card cursor-grab active:cursor-grabbing transition-all duration-150 select-none",
                  draggingId === item.queueId
                    ? "opacity-40 border-primary"
                    : "border-border hover:border-primary/40 hover:shadow-sm",
                  assigningId === item.queueId && "opacity-50 pointer-events-none"
                )}
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="font-mono text-[12px] text-muted-foreground">{item.article_number}</span>
                    <span className="text-foreground font-medium">{item.stage_name}</span>
                    {item.is_rework && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                        Rework
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <span>{item.po_number}</span>
                    <span>·</span>
                    <span className="tabular-nums">{item.quantity_assigned} pcs</span>
                    <span>·</span>
                    <span className="tabular-nums">₹{item.pay_rate}/pc</span>
                  </div>
                </div>
                <button
                  onClick={() => removeFromQueue(item.queueId)}
                  className="ml-1 shrink-0 text-muted-foreground/60 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Workers — drop targets ──────────────────────────────────────────── */}
      {employees.length > 0 && (
        <div className="border-b border-border px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
            Workers
          </p>
          <div className="flex flex-wrap gap-2.5">
            {employees.map(emp => (
              <WorkerDropCard
                key={emp.id}
                employee={emp}
                isDragOver={dragOverEmployeeId === emp.id}
                hasQueueItems={queue.length > 0}
                onDragOver={e => { e.preventDefault(); setDragOverEmployeeId(emp.id) }}
                onDragLeave={() => setDragOverEmployeeId(prev => (prev === emp.id ? null : prev))}
                onDrop={e => handleDropOnWorker(e, emp.id)}
                onQuickAssign={
                  queue.length > 0
                    ? (queueId) => {
                        const item = queue.find(q => q.queueId === queueId)
                        if (item) assignToWorker(item, emp.id)
                      }
                    : undefined
                }
                queue={queue}
              />
            ))}
          </div>
        </div>
      )}

      </div>
      {/* end scrollable middle */}

      {/* ── Assigned work — collapsible bottom panel ────────────────────────── */}
      <div className="shrink-0 border-t border-border bg-card">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setAssignedExpanded(v => !v)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setAssignedExpanded(v => !v)
            }
          }}
          className="flex items-center justify-between gap-3 px-6 h-12 cursor-pointer hover:bg-muted/30 transition-colors duration-150 select-none"
        >
          <div className="flex items-center gap-2">
            <ChevronUp
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                !assignedExpanded && "rotate-180"
              )}
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Assigned Work
            </p>
            <span className="text-xs text-muted-foreground tabular-nums">({assignments.length})</span>
          </div>
          {assignedExpanded && (
            <div onClick={e => e.stopPropagation()} className="flex items-center gap-3">
              <Select value={filterPO || "__all__"} onValueChange={v => setFilterPO(v === "__all__" ? "" : v)}>
                <SelectTrigger className="h-9 w-[260px] text-sm">
                  <SelectValue placeholder="All POs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All POs</SelectItem>
                  {purchaseOrders.map(po => (
                    <SelectItem key={po.id} value={String(po.id)}>
                      {po.po_number} — {po.provider_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filterPO && (
                <button
                  onClick={() => setFilterPO("")}
                  className="h-9 px-3 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        <div
          className="overflow-hidden transition-[max-height] duration-300 ease-out"
          style={{ maxHeight: assignedExpanded ? "55vh" : "0px" }}
        >
          <div className="overflow-y-auto border-t border-border" style={{ maxHeight: "55vh" }}>
        {loading ? (
          <ProductionSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState onNew={openWorkSheet} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-8 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-[120px]">PO No.</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-[110px]">Article</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Stage</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Worker</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-[100px]">Assigned</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-[100px]">Completed</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-[110px]">Status</th>
                <th className="px-8 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground w-[130px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(a => {
                const done = a.quantity_completed >= a.quantity_assigned
                return (
                  <tr
                    key={a.id}
                    className={cn(
                      "group hover:bg-muted/30 transition-colors duration-100",
                      a.is_rework && "opacity-60"
                    )}
                  >
                    <td className="px-8 py-3.5">
                      <span className="font-mono text-[13px] font-medium tracking-tight">{a.po_number}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[13px] text-muted-foreground">{a.article_number}</span>
                    </td>
                    <td className="px-4 py-3.5 text-foreground">{a.stage_name}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-foreground">{a.employee_name}</span>
                      {a.is_rework && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                          Rework
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-mono tabular-nums text-foreground">{a.quantity_assigned}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={cn(
                        "font-mono tabular-nums",
                        done ? "text-green-600 dark:text-green-400" : "text-foreground"
                      )}>
                        {a.quantity_completed}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[11px] font-medium",
                        done
                          ? "text-green-600 dark:text-green-400"
                          : "text-blue-600 dark:text-blue-400"
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          done ? "bg-green-500" : "bg-blue-500"
                        )} />
                        {done ? "Done" : "In progress"}
                      </span>
                    </td>
                    <td className="px-8 py-3.5 text-right">
                      {!done && (
                        <button
                          onClick={() => openCompletion(a)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors duration-150"
                        >
                          <ClipboardCheck className="h-3 w-3" />
                          Log Completion
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
          </div>
        </div>
      </div>

      {/* ── New Work Sheet ──────────────────────────────────────────────────── */}
      <Sheet open={workSheetOpen} onOpenChange={setWorkSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-5 border-b border-border shrink-0">
            <SheetTitle className="text-base font-semibold">New Work</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

            {/* PO */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">
                Purchase Order <span className="text-destructive">*</span>
              </label>
              <Select value={workForm.po_id || ""} onValueChange={v => setWorkForm(f => ({ ...f, po_id: v }))}>
                <SelectTrigger className="h-9 text-sm w-full">
                  <SelectValue placeholder="Select PO" />
                </SelectTrigger>
                <SelectContent>
                  {openPOs.map(po => (
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
              <Select value={workForm.article_id || ""} onValueChange={v => setWorkForm(f => ({ ...f, article_id: v }))}>
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

            {/* Work Stage — only after article is chosen */}
            {workForm.article_id && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80">
                  Work Stage <span className="text-destructive">*</span>
                </label>
                {stagesLoading ? (
                  <div className="h-9 rounded-md border border-input bg-muted/40 animate-pulse" />
                ) : workStages.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No work stages found for this article.</p>
                ) : (
                  <Select value={workForm.work_stage_id || ""} onValueChange={v => setWorkForm(f => ({ ...f, work_stage_id: v }))}>
                    <SelectTrigger className="h-9 text-sm w-full">
                      <SelectValue placeholder="Select Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {workStages.map(s => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name} — ₹{s.pay_rate}/pc
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">
                Quantity <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={workForm.quantity_assigned}
                onChange={e => setWorkForm(f => ({ ...f, quantity_assigned: e.target.value }))}
                placeholder="e.g. 50"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Start Date</label>
              <DatePicker
                value={workForm.start_date}
                onChange={v => setWorkForm(f => ({ ...f, start_date: v }))}
                placeholder="Pick a date"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Notes</label>
              <textarea
                value={workForm.notes}
                onChange={e => setWorkForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes…"
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none"
              />
            </div>

            {/* Rework checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_rework"
                checked={workForm.is_rework}
                onChange={e => setWorkForm(f => ({ ...f, is_rework: e.target.checked }))}
                className="h-4 w-4 rounded border border-input accent-primary"
              />
              <label htmlFor="is_rework" className="text-xs text-muted-foreground select-none cursor-pointer">
                Mark as rework (unpaid)
              </label>
            </div>

            <p className="text-xs text-muted-foreground pt-1">
              This adds the work to the unassigned queue. Drag it onto a worker on the Production page to assign it.
            </p>

            {workError && (
              <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
                {workError}
              </p>
            )}
          </div>

          <div className="shrink-0 px-6 py-4 border-t border-border flex gap-2">
            <button
              onClick={handleQueueWork}
              className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all duration-150"
            >
              Add to Queue
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setWorkSheetOpen(false)}
              className="h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors duration-150"
            >
              Cancel
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Log Completion Sheet ───────────────────────────────────────────────── */}
      <Sheet open={completionSheetOpen} onOpenChange={setCompletionSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-5 border-b border-border shrink-0">
            <SheetTitle className="text-base font-semibold">Log Completion</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {activeAssignment && (
              <>
                {/* Assignment summary */}
                <div className="rounded-md border border-border bg-muted/30 px-4 py-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Worker</span>
                    <span className="font-medium text-foreground">{activeAssignment.employee_name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Stage</span>
                    <span className="font-medium text-foreground">{activeAssignment.stage_name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Article</span>
                    <span className="font-mono font-medium text-foreground">{activeAssignment.article_number}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Assigned Qty</span>
                    <span className="font-mono tabular-nums font-medium text-foreground">{activeAssignment.quantity_assigned}</span>
                  </div>
                </div>

                {/* Quantity completed */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">
                    Quantity Completed <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={activeAssignment.quantity_assigned}
                    value={completionForm.quantity_completed}
                    onChange={e => setCompletionForm(f => ({ ...f, quantity_completed: e.target.value }))}
                    placeholder={`Max ${activeAssignment.quantity_assigned}`}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  />
                  <p className="text-[11px] text-muted-foreground">Maximum: {activeAssignment.quantity_assigned} pairs</p>
                </div>

                {/* End date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">Completion Date</label>
                  <input
                    type="date"
                    value={completionForm.end_date}
                    onChange={e => setCompletionForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">Notes</label>
                  <textarea
                    value={completionForm.notes}
                    onChange={e => setCompletionForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional notes…"
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none"
                  />
                </div>

                {activeAssignment.is_rework && (
                  <p className="text-[11px] text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md px-3 py-2">
                    This is a rework assignment — completion will not count toward payroll.
                  </p>
                )}

                {completionError && (
                  <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
                    {completionError}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="shrink-0 px-6 py-4 border-t border-border flex gap-2">
            <button
              onClick={handleCompletionSave}
              disabled={completionSaving}
              className="flex-1 h-9 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 transition-all duration-150"
            >
              {completionSaving
                ? <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />Saving…</span>
                : "Log Completion"}
            </button>
            <button
              onClick={() => setCompletionSheetOpen(false)}
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

// ─── Worker drop card ───────────────────────────────────────────────────────────

function WorkerDropCard({
  employee,
  isDragOver,
  hasQueueItems,
  onDragOver,
  onDragLeave,
  onDrop,
  onQuickAssign,
  queue,
}: {
  employee: Employee
  isDragOver: boolean
  hasQueueItems: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onQuickAssign?: (queueId: string) => void
  queue: QueuedWork[]
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const initials = employee.name
    .split(" ")
    .map(p => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg border-2 bg-card transition-all duration-150 min-w-[180px]",
        isDragOver
          ? "border-primary bg-primary/5 scale-[1.02] shadow-md"
          : hasQueueItems
            ? "border-dashed border-border"
            : "border-border"
      )}
    >
      <div className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-semibold shrink-0">
        {initials || <User className="h-4 w-4" />}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{employee.name}</p>
        <p className="text-[11px] text-muted-foreground truncate capitalize">{employee.role} · {employee.pay_type}</p>
      </div>

      {/* Fallback: tap-to-assign for touch/keyboard users */}
      {onQuickAssign && (
        <div className="relative shrink-0">
          <button
            onClick={() => setPickerOpen(v => !v)}
            className="text-[10px] text-muted-foreground hover:text-foreground border border-border rounded px-1.5 py-1 transition-colors duration-150"
            title="Assign without dragging"
          >
            Assign
          </button>
          {pickerOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-popover border border-border rounded-md shadow-md overflow-hidden">
              {queue.map(item => (
                <button
                  key={item.queueId}
                  onClick={() => { onQuickAssign(item.queueId); setPickerOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
                >
                  <span className="font-mono text-muted-foreground">{item.article_number}</span>{" "}
                  <span className="text-foreground">{item.stage_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProductionSkeleton() {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border bg-muted/40">
          {["w-[120px]", "w-[110px]", "", "", "w-[100px]", "w-[100px]", "w-[110px]", "w-[130px]"].map((w, i) => (
            <th key={i} className={cn("px-4 py-3", i === 0 && "px-8", i === 7 && "px-8")}>
              <div className={cn("h-3 bg-muted rounded animate-pulse", w || "w-full")} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <tr key={i}>
            <td className="px-8 py-4"><div className="h-4 w-20 bg-muted rounded animate-pulse" /></td>
            <td className="px-4 py-4"><div className="h-4 w-16 bg-muted rounded animate-pulse" /></td>
            <td className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${50 + (i * 13) % 30}%` }} /></td>
            <td className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${40 + (i * 19) % 35}%` }} /></td>
            <td className="px-4 py-4"><div className="h-4 w-10 bg-muted rounded animate-pulse ml-auto" /></td>
            <td className="px-4 py-4"><div className="h-4 w-10 bg-muted rounded animate-pulse ml-auto" /></td>
            <td className="px-4 py-4"><div className="h-4 w-20 bg-muted rounded animate-pulse" /></td>
            <td className="px-8 py-4"><div className="h-6 w-24 bg-muted rounded animate-pulse ml-auto" /></td>
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
        <Layers className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No assignments yet</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
        Add work to the queue, then drag it onto a worker to start tracking production.
      </p>
      <button
        onClick={onNew}
        className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors duration-150"
      >
        <Plus className="h-3.5 w-3.5" />
        New Work
      </button>
    </div>
  )
}
