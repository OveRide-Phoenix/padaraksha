"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, Plus, Trash2 } from "lucide-react"
import { getSettings, saveSettings } from "@/lib/settings"
import { getSession } from "@/lib/auth"
import { api } from "@/lib/api"

interface ApiResponse<T> { success: boolean; data: T; message: string }

interface FactoryProfile {
  id: number
  name: string
  gst_number: string | null
  address: string | null
  city: string | null
  state: string | null
  is_active: boolean
}

interface CostSettings {
  tailor_wage_in_house: number
  tailor_wage_wfh: number
  helper_wage_in_house: number
  helper_wage_wfh: number
  esi_pf_pct: number
  margin_pct: number
  festival_bonus_pct: number
  festival_sweet_amount: number
  snacks_amount_per_day: number
  total_staff_capacity: number
  working_days_per_month: number
}

interface ExpenseLineItem {
  id: number
  particular: string
  amount: number
  is_active: boolean
}

const emptyCostSettings: CostSettings = {
  tailor_wage_in_house: 0,
  tailor_wage_wfh: 0,
  helper_wage_in_house: 0,
  helper_wage_wfh: 0,
  esi_pf_pct: 16.25,
  margin_pct: 25,
  festival_bonus_pct: 50,
  festival_sweet_amount: 0,
  snacks_amount_per_day: 0,
  total_staff_capacity: 1,
  working_days_per_month: 24,
}

export default function SettingsPage() {
  const [prefix, setPrefix] = useState("")
  const [saved, setSaved] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const s = getSettings()
    setPrefix(s.articleNumberPrefix)
    setMounted(true)
  }, [])

  const handleSave = () => {
    saveSettings({ articleNumberPrefix: prefix.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const preview = prefix.trim()
    ? `${prefix.trim()}001, ${prefix.trim()}002, ${prefix.trim()}003…`
    : "001, 002, 003…"

  // ── Factory profile ────────────────────────────────────────────────────────
  const isAdmin = getSession()?.role === "admin"
  const [factory, setFactory] = useState<FactoryProfile | null>(null)
  const [factoryLoading, setFactoryLoading] = useState(true)
  const [factorySaving, setFactorySaving] = useState(false)
  const [factorySaved, setFactorySaved] = useState(false)
  const [factoryError, setFactoryError] = useState("")

  useEffect(() => {
    api.get<ApiResponse<FactoryProfile>>("/factories/me")
      .then(res => setFactory(res.data))
      .catch(() => {})
      .finally(() => setFactoryLoading(false))
  }, [])

  const setFactoryField = (field: keyof FactoryProfile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFactory(f => f ? { ...f, [field]: e.target.value } : f)
  }

  const handleSaveFactory = async () => {
    if (!factory) return
    setFactorySaving(true)
    setFactoryError("")
    try {
      const res = await api.put<ApiResponse<FactoryProfile>>("/factories/me", {
        name: factory.name,
        gst_number: factory.gst_number,
        address: factory.address,
        city: factory.city,
        state: factory.state,
      })
      setFactory(res.data)
      setFactorySaved(true)
      setTimeout(() => setFactorySaved(false), 2000)
    } catch (err: unknown) {
      setFactoryError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setFactorySaving(false)
    }
  }

  // ── Cost settings ──────────────────────────────────────────────────────────
  const [cost, setCost] = useState<CostSettings>(emptyCostSettings)
  const [costLoading, setCostLoading] = useState(true)
  const [costSaving, setCostSaving] = useState(false)
  const [costSaved, setCostSaved] = useState(false)
  const [costError, setCostError] = useState("")

  useEffect(() => {
    api.get<ApiResponse<CostSettings | null>>("/settings/cost")
      .then(res => { if (res.data) setCost(res.data) })
      .catch(() => {})
      .finally(() => setCostLoading(false))
  }, [])

  const handleSaveCost = async () => {
    setCostSaving(true)
    setCostError("")
    try {
      const res = await api.put<ApiResponse<CostSettings>>("/settings/cost", cost)
      setCost(res.data)
      setCostSaved(true)
      setTimeout(() => setCostSaved(false), 2000)
    } catch (err: unknown) {
      setCostError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setCostSaving(false)
    }
  }

  const setCostField = (field: keyof CostSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCost(c => ({ ...c, [field]: Number(e.target.value) || 0 }))
  }

  // ── Overhead expenses ──────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState<ExpenseLineItem[]>([])
  const [expLoading, setExpLoading] = useState(true)
  const [newParticular, setNewParticular] = useState("")
  const [newAmount, setNewAmount] = useState("")
  const [expSaving, setExpSaving] = useState(false)

  const loadExpenses = () => {
    api.get<ApiResponse<ExpenseLineItem[]>>("/settings/expenses")
      .then(res => setExpenses(res.data ?? []))
      .catch(() => {})
      .finally(() => setExpLoading(false))
  }

  useEffect(() => { loadExpenses() }, [])

  const handleAddExpense = async () => {
    if (!newParticular.trim() || !newAmount || Number(newAmount) <= 0) return
    setExpSaving(true)
    try {
      await api.post("/settings/expenses", { particular: newParticular.trim(), amount: Number(newAmount) })
      setNewParticular("")
      setNewAmount("")
      loadExpenses()
    } catch { /* ignore */ } finally {
      setExpSaving(false)
    }
  }

  const handleDeleteExpense = async (id: number) => {
    setExpenses(es => es.filter(e => e.id !== id))
    try {
      await api.del(`/settings/expenses/${id}`)
    } catch {
      loadExpenses()
    }
  }

  const updateExpenseLocal = (id: number, field: "particular" | "amount", value: string) => {
    setExpenses(es => es.map(e =>
      e.id === id ? { ...e, [field]: field === "amount" ? (Number(value) || 0) : value } : e
    ))
  }

  const commitExpense = async (item: ExpenseLineItem) => {
    try {
      await api.put(`/settings/expenses/${item.id}`, { particular: item.particular, amount: item.amount })
    } catch {
      loadExpenses()
    }
  }

  const overheadTotal = expenses.reduce((sum, e) => sum + e.amount, 0)

  if (!mounted) return null

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-8 pt-8 pb-6 border-b border-border">
        <h1 className="text-base font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Factory-level defaults and configuration</p>
      </header>

      <div className="flex-1 px-8 py-8 max-w-3xl space-y-10">

        {/* Factory profile */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            Factory Profile
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            {isAdmin ? "Your factory's registered details." : "Only admins can edit these details."}
          </p>

          {factoryLoading ? (
            <div className="flex items-center gap-2 h-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading…</span>
            </div>
          ) : factory ? (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-foreground/80">Factory name</label>
                  <input
                    type="text"
                    value={factory.name}
                    onChange={setFactoryField("name")}
                    disabled={!isAdmin}
                    className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-60"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-foreground/80">GST number</label>
                  <input
                    type="text"
                    value={factory.gst_number ?? ""}
                    onChange={setFactoryField("gst_number")}
                    disabled={!isAdmin}
                    className="h-9 px-3 rounded-md border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-60"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-foreground/80">City</label>
                  <input
                    type="text"
                    value={factory.city ?? ""}
                    onChange={setFactoryField("city")}
                    disabled={!isAdmin}
                    className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-60"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-foreground/80">State</label>
                  <input
                    type="text"
                    value={factory.state ?? ""}
                    onChange={setFactoryField("state")}
                    disabled={!isAdmin}
                    className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-60"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-foreground/80">Address</label>
                  <input
                    type="text"
                    value={factory.address ?? ""}
                    onChange={setFactoryField("address")}
                    disabled={!isAdmin}
                    className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-60"
                  />
                </div>
              </div>

              {factoryError && (
                <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2 mt-5">
                  {factoryError}
                </p>
              )}

              {isAdmin && (
                <div className="flex items-center gap-3 pt-6">
                  <button
                    onClick={handleSaveFactory}
                    disabled={factorySaving}
                    className="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-all"
                  >
                    {factorySaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {!factorySaving && factorySaved && <Check className="h-3.5 w-3.5" />}
                    {factorySaving ? "Saving…" : factorySaved ? "Saved" : "Save changes"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-destructive">Could not load factory profile.</p>
          )}
        </section>

        {/* Articles section */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">
            Articles
          </h2>

          <div className="space-y-6 divide-y divide-border">
            <div className="pt-0">
              <div className="flex items-start justify-between gap-8">
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="article-prefix"
                    className="text-sm font-medium text-foreground"
                  >
                    Article number prefix
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Prepended to every new article number. Leave blank to use plain numbers.
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-2 font-mono">
                    Preview: {preview}
                  </p>
                </div>
                <input
                  id="article-prefix"
                  type="text"
                  value={prefix}
                  onChange={e => { setPrefix(e.target.value); setSaved(false) }}
                  placeholder="e.g. PAD-"
                  maxLength={12}
                  className="w-32 h-9 px-3 rounded-md border border-input bg-background text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 shrink-0"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <button
              onClick={handleSave}
              className="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-all"
            >
              {saved && <Check className="h-3.5 w-3.5" />}
              {saved ? "Saved" : "Save changes"}
            </button>
            {saved && (
              <span className="text-xs text-muted-foreground">Changes will apply to new articles.</span>
            )}
          </div>
        </section>

        {/* Wage & Cost Settings */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            Wage &amp; Cost Settings
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            Factory-wide constants used to price every article — wage tiers, statutory %, margin, and bonus provisions.
          </p>

          {costLoading ? (
            <div className="flex items-center gap-2 h-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading…</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <CostField label="Tailor wage — in-house (₹/month)" value={cost.tailor_wage_in_house} onChange={setCostField("tailor_wage_in_house")} />
                <CostField label="Tailor wage — WFH (₹/month)" value={cost.tailor_wage_wfh} onChange={setCostField("tailor_wage_wfh")} />
                <CostField label="Helper wage — in-house (₹/month)" value={cost.helper_wage_in_house} onChange={setCostField("helper_wage_in_house")} />
                <CostField label="Helper wage — WFH (₹/month)" value={cost.helper_wage_wfh} onChange={setCostField("helper_wage_wfh")} />
                <CostField label="Snacks (₹/staff/day)" value={cost.snacks_amount_per_day} onChange={setCostField("snacks_amount_per_day")} step="0.01" />
                <CostField label="ESI &amp; PF (%)" value={cost.esi_pf_pct} onChange={setCostField("esi_pf_pct")} step="0.01" />
                <CostField label="Margin (%)" value={cost.margin_pct} onChange={setCostField("margin_pct")} step="0.01" />
                <CostField label="Festival bonus (% of monthly wage, annual)" value={cost.festival_bonus_pct} onChange={setCostField("festival_bonus_pct")} step="0.01" />
                <CostField label="Festival sweet (₹/staff/year)" value={cost.festival_sweet_amount} onChange={setCostField("festival_sweet_amount")} />
                <CostField label="Total factory staff capacity" value={cost.total_staff_capacity} onChange={setCostField("total_staff_capacity")} />
                <CostField label="Working days per month" value={cost.working_days_per_month} onChange={setCostField("working_days_per_month")} />
              </div>

              {costError && (
                <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2 mt-5">
                  {costError}
                </p>
              )}

              <div className="flex items-center gap-3 pt-6">
                <button
                  onClick={handleSaveCost}
                  disabled={costSaving}
                  className="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-all"
                >
                  {costSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {!costSaving && costSaved && <Check className="h-3.5 w-3.5" />}
                  {costSaving ? "Saving…" : costSaved ? "Saved" : "Save changes"}
                </button>
                {costSaved && (
                  <span className="text-xs text-muted-foreground">Applies to every article's costing from now on.</span>
                )}
              </div>
            </>
          )}
        </section>

        {/* Overhead Expenses */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            Overhead Expenses
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            Monthly factory overhead (rent, salaries, utilities…), spread across articles by staff-time consumed.
          </p>

          {expLoading ? (
            <div className="flex items-center gap-2 h-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading…</span>
            </div>
          ) : (
            <>
              <div className="border border-border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Particular</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Amount (₹/mo)</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {expenses.map(e => (
                      <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={e.particular}
                            onChange={ev => updateExpenseLocal(e.id, "particular", ev.target.value)}
                            onBlur={() => commitExpense(e)}
                            className="w-full h-8 px-2 rounded border border-transparent bg-transparent hover:border-input focus:border-input text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={e.amount}
                            onChange={ev => updateExpenseLocal(e.id, "amount", ev.target.value)}
                            onBlur={() => commitExpense(e)}
                            className="w-full h-8 px-2 rounded border border-transparent bg-transparent hover:border-input focus:border-input text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
                          />
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteExpense(e.id)}
                            className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={newParticular}
                          onChange={e => setNewParticular(e.target.value)}
                          placeholder="e.g. RENT"
                          className="w-full h-8 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={newAmount}
                          onChange={e => setNewAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full h-8 px-2 rounded border border-input bg-background text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          onClick={handleAddExpense}
                          disabled={expSaving}
                          className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-muted/40">
                      <td className="px-4 py-2.5 text-xs font-medium">Total overhead</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-xs font-bold">
                        ₹{overheadTotal.toFixed(2)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </section>

      </div>
    </div>
  )
}

function CostField({ label, value, onChange, step = "1" }: {
  label: string
  value: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  step?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground/80">{label}</label>
      <input
        type="number"
        value={value}
        onChange={onChange}
        step={step}
        min="0"
        className="h-9 px-3 rounded-md border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
      />
    </div>
  )
}
