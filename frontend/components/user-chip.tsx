"use client"

import { useEffect, useState } from "react"
import { getSession } from "@/lib/auth"

export function UserChip() {
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null)

  useEffect(() => {
    setSession(getSession())
  }, [])

  if (!session) return null

  const name = session.fullName || session.factoryName || ""
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-2">
      <div className="text-right hidden sm:block">
        <p className="text-xs font-medium text-foreground leading-none">{name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{session.role}</p>
      </div>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white select-none"
        style={{ background: "hsl(263 42% 35%)" }}
      >
        {initial}
      </div>
    </div>
  )
}
