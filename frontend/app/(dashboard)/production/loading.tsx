import { cn } from "@/lib/utils"

export default function Loading() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Header skeleton */}
      <div className="px-8 pt-8 pb-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-56 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-9 w-36 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="mt-5">
          <div className="h-9 w-48 bg-muted rounded-md animate-pulse" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {[
                "w-[120px]",
                "w-[110px]",
                "w-full",
                "w-full",
                "w-[100px]",
                "w-[100px]",
                "w-[110px]",
                "w-[130px]",
              ].map((w, i) => (
                <th
                  key={i}
                  className={cn("px-4 py-3", i === 0 && "px-8", i === 7 && "px-8")}
                >
                  <div className={cn("h-3 bg-muted rounded animate-pulse", w)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="px-8 py-4">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                </td>
                <td className="px-4 py-4">
                  <div
                    className="h-4 bg-muted rounded animate-pulse"
                    style={{ width: `${50 + (i * 13) % 30}%` }}
                  />
                </td>
                <td className="px-4 py-4">
                  <div
                    className="h-4 bg-muted rounded animate-pulse"
                    style={{ width: `${40 + (i * 19) % 35}%` }}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-10 bg-muted rounded animate-pulse ml-auto" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-10 bg-muted rounded animate-pulse ml-auto" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                </td>
                <td className="px-8 py-4">
                  <div className="h-6 w-24 bg-muted rounded animate-pulse ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
