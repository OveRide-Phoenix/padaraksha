export default function PODetailLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Back + header */}
      <div className="px-6 h-[72px] shrink-0 border-b border-border">
        <div className="h-3 w-24 bg-muted animate-pulse rounded mb-3" />
        <div className="flex items-center gap-3">
          <div className="h-6 w-40 bg-muted animate-pulse rounded font-mono" />
          <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
        </div>
        <div className="flex gap-6 mt-2">
          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Two-column content */}
      <div className="flex-1 overflow-auto px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 bg-muted animate-pulse rounded" />
            <div className="h-7 w-20 bg-muted animate-pulse rounded" />
          </div>
          <div className="border border-border rounded-md overflow-hidden">
            <div className="bg-muted/40 px-4 py-2.5 flex gap-8">
              {["Article", "Variant", "Qty"].map((h) => (
                <div key={h} className="h-3 w-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
            <div className="divide-y divide-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-8 px-4 py-3">
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-12 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-7 w-28 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="border border-border rounded-md px-4 py-3 flex flex-col gap-1.5">
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                <div className="h-3 w-48 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
