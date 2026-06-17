import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "sonner"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto min-w-0">
        {children}
      </main>
      <Toaster richColors position="bottom-right" />
    </div>
  )
}
