export default function SettingsLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="px-8 pt-8 pb-6 border-b border-border">
        <div className="h-5 w-20 rounded bg-muted animate-pulse" />
        <div className="mt-1.5 h-4 w-56 rounded bg-muted animate-pulse" />
      </header>
      <div className="px-8 py-8 max-w-xl space-y-6">
        <div className="h-3 w-16 rounded bg-muted animate-pulse" />
        <div className="flex items-start justify-between gap-8">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            <div className="h-3 w-64 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-9 w-32 rounded-md bg-muted animate-pulse shrink-0" />
        </div>
      </div>
    </div>
  )
}
