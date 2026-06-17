"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import { getSettings, saveSettings } from "@/lib/settings"

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

  if (!mounted) return null

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-8 pt-8 pb-6 border-b border-border">
        <h1 className="text-base font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Factory-level defaults and configuration</p>
      </header>

      <div className="flex-1 px-8 py-8 max-w-xl space-y-10">

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
        </section>

        {/* Save */}
        <div className="flex items-center gap-3 pt-2">
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

      </div>
    </div>
  )
}
