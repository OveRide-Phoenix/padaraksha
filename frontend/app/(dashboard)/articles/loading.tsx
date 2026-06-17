export default function ArticlesLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="px-8 pt-8 pb-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-24 rounded bg-muted animate-pulse" />
            <div className="h-4 w-56 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-9 w-28 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="mt-5 h-9 w-64 rounded-md bg-muted animate-pulse" />
      </header>

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
    </div>
  )
}
