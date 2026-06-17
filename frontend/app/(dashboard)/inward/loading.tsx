export default function InwardLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-6 h-[72px] shrink-0 border-b border-border">
        <div className="flex flex-col gap-1.5">
          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
          <div className="h-3 w-52 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-8 w-20 bg-muted animate-pulse rounded" />
      </div>

      {/* Table skeleton */}
      <div className="px-6 py-4">
        <div className="border border-border rounded-md overflow-hidden">
          <div className="bg-muted/40 px-4 py-2.5 flex gap-8">
            {["PO No.", "Provider", "Arrived", "Deadline", "Days Left", "Status"].map((h) => (
              <div key={h} className="h-3 w-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-8 px-4 py-3">
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                <div className="h-3 w-10 bg-muted animate-pulse rounded" />
                <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
