"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StockItem {
  raw_material_id: number
  name: string
  unit: string
  stock: number
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

const LOW_STOCK_THRESHOLD = 10

export default function InventoryPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInventory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<ApiResponse<StockItem[]>>("/inventory")
      setItems(res.data ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 h-[72px] shrink-0 border-b border-border">
        <h1 className="text-lg font-semibold tracking-tight">Inventory</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Current stock computed from inward receipts minus consumption
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 h-40 justify-center">
            <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </p>
            <Button variant="ghost" size="sm" onClick={loadInventory} className="text-xs">
              Retry
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm text-muted-foreground">No inventory data available.</p>
          </div>
        ) : (
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Material</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Unit</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Stock</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const isLow = item.stock <= LOW_STOCK_THRESHOLD
                  return (
                    <tr key={item.raw_material_id} className={isLow ? "bg-red-500/5" : ""}>
                      <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{item.unit}</td>
                      <td className={`px-4 py-3 text-sm font-mono text-right ${isLow ? "text-red-400 font-semibold" : ""}`}>
                        {item.stock.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Low stock
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">OK</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
