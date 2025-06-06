"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Plus, Search, Package, Truck } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ArticleVariantSelector } from "@/components/article-variant-selector"
import { purchaseOrders, articleVariants } from "@/lib/dummy-data"

const inwardEntries = [
  {
    id: "IN001",
    date: "2024-01-15",
    poNumber: "PO001",
    supplier: "Leather Suppliers Ltd",
    articleVariant: "AV001",
    articleName: "Classic Oxford - Black - Size 9 - Men - Both",
    materials: [
      { name: "Upper Leather", quantity: 100, unit: "sq ft" },
      { name: "Insole", quantity: 50, unit: "pairs" },
    ],
    status: "Completed",
  },
  {
    id: "IN002",
    date: "2024-01-14",
    poNumber: "PO002",
    supplier: "Sole Manufacturing Co",
    articleVariant: "AV003",
    articleName: "Sports Sneaker - White - Size 8 - Unisex - Both",
    materials: [{ name: "Rubber Outsole", quantity: 75, unit: "pairs" }],
    status: "Pending",
  },
]

export default function InwardPage() {
  const [date, setDate] = useState<Date>()
  const [selectedPO, setSelectedPO] = useState("")
  const [selectedArticleVariant, setSelectedArticleVariant] = useState("")
  const [materialQuantities, setMaterialQuantities] = useState<Record<string, { quantity: string; unit: string }>>({})

  const updateMaterialQuantity = (material: string, quantity: string, unit: string) => {
    setMaterialQuantities((prev) => ({
      ...prev,
      [material]: { quantity, unit },
    }))
  }

  const selectedVariant = articleVariants.find((v) => v.id === selectedArticleVariant)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="page-header">Inward Entry</h1>
        <p className="text-dark-text-secondary">Log incoming raw materials and supplies for production.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-2">
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-dark-text flex items-center gap-2">
                <Package className="h-5 w-5" />
                New Inward Entry
              </CardTitle>
              <CardDescription className="text-dark-text-secondary">
                Record incoming materials and quantities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-dark-text">Entry Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-dark-bg border-dark-border text-dark-text",
                          !date && "text-dark-text-secondary",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-dark-surface border-dark-border">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className="bg-dark-surface text-dark-text"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-dark-text">Purchase Order</Label>
                  <Select value={selectedPO} onValueChange={setSelectedPO}>
                    <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                      <SelectValue placeholder="Select PO" />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-surface border-dark-border">
                      {purchaseOrders.map((po) => (
                        <SelectItem key={po.id} value={po.id} className="text-dark-text">
                          {po.id} - {po.supplier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ArticleVariantSelector
                value={selectedArticleVariant}
                onValueChange={setSelectedArticleVariant}
                label="Article Variant"
                placeholder="Select article variant"
              />

              {/* Material Quantities */}
              {selectedVariant && (
                <div className="space-y-4">
                  <Label className="text-dark-text">Raw Material Quantities for {selectedVariant.baseName}</Label>
                  <div className="grid grid-cols-1 gap-4">
                    {selectedVariant.materials.map((material) => (
                      <div key={material} className="grid grid-cols-3 gap-2 items-end">
                        <div className="col-span-1">
                          <Label className="text-sm text-dark-text-secondary">{material}</Label>
                        </div>
                        <div>
                          <Input
                            type="number"
                            placeholder="Quantity"
                            value={materialQuantities[material]?.quantity || ""}
                            onChange={(e) =>
                              updateMaterialQuantity(
                                material,
                                e.target.value,
                                materialQuantities[material]?.unit || "pcs",
                              )
                            }
                            className="bg-dark-bg border-dark-border text-dark-text"
                          />
                        </div>
                        <div>
                          <Select
                            value={materialQuantities[material]?.unit || ""}
                            onValueChange={(value) =>
                              updateMaterialQuantity(material, materialQuantities[material]?.quantity || "", value)
                            }
                          >
                            <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent className="bg-dark-surface border-dark-border">
                              <SelectItem value="pcs">Pcs</SelectItem>
                              <SelectItem value="pairs">Pairs</SelectItem>
                              <SelectItem value="sqft">Sq Ft</SelectItem>
                              <SelectItem value="kg">Kg</SelectItem>
                              <SelectItem value="meters">Meters</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button className="bg-dark-accent hover:bg-dark-accent-hover">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Entry
                </Button>
                <Button variant="outline" className="border-dark-border text-dark-text hover:bg-dark-surface">
                  Clear Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Entries */}
        <div>
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-dark-text flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Recent Entries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {inwardEntries.slice(0, 3).map((entry) => (
                <div key={entry.id} className="p-3 bg-dark-bg rounded-lg border border-dark-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-dark-text">{entry.id}</span>
                    <Badge
                      variant={entry.status === "Completed" ? "default" : "secondary"}
                      className={entry.status === "Completed" ? "bg-green-600" : "bg-yellow-600"}
                    >
                      {entry.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-dark-text-secondary mb-1">{entry.supplier}</p>
                  <p className="text-xs text-dark-text-secondary">{entry.articleName}</p>
                  <p className="text-xs text-dark-text-secondary">{entry.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Entries Table */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-dark-text">All Inward Entries</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-text-secondary" />
                <Input
                  placeholder="Search entries..."
                  className="pl-10 w-64 bg-dark-bg border-dark-border text-dark-text"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-dark-border">
                <TableHead className="text-dark-text">Entry ID</TableHead>
                <TableHead className="text-dark-text">Date</TableHead>
                <TableHead className="text-dark-text">PO Number</TableHead>
                <TableHead className="text-dark-text">Supplier</TableHead>
                <TableHead className="text-dark-text">Article Variant</TableHead>
                <TableHead className="text-dark-text">Materials</TableHead>
                <TableHead className="text-dark-text">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inwardEntries.map((entry) => (
                <TableRow key={entry.id} className="border-dark-border">
                  <TableCell className="text-dark-text font-medium">{entry.id}</TableCell>
                  <TableCell className="text-dark-text-secondary">{entry.date}</TableCell>
                  <TableCell className="text-dark-text-secondary">{entry.poNumber}</TableCell>
                  <TableCell className="text-dark-text-secondary">{entry.supplier}</TableCell>
                  <TableCell className="text-dark-text-secondary">
                    <div className="max-w-48">
                      <p className="text-sm font-medium">{entry.articleName}</p>
                      <Badge variant="outline" className="border-dark-border text-dark-text-secondary text-xs mt-1">
                        {entry.articleVariant}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {entry.materials.map((material, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-dark-border text-dark-text-secondary text-xs"
                        >
                          {material.name}: {material.quantity} {material.unit}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={entry.status === "Completed" ? "default" : "secondary"}
                      className={entry.status === "Completed" ? "bg-green-600" : "bg-yellow-600"}
                    >
                      {entry.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
