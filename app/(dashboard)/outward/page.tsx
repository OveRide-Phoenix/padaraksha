"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, Plus, Search, Truck, Package, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ArticleVariantSelector } from "@/components/article-variant-selector"
import { providerCompanies } from "@/lib/dummy-data"

const outwardDeliveries = [
  {
    id: "OUT001",
    date: "2024-01-15",
    provider: "Global Shoe Distributors",
    articleVariant: "AV001",
    articleName: "Classic Oxford - Black - Size 9 - Men - Both",
    orderedQty: 100,
    deliveredQty: 95,
    shortageQty: 3,
    spoiltQty: 2,
    status: "Partial",
    notes: "Minor quality issues with 2 pairs",
  },
  {
    id: "OUT002",
    date: "2024-01-14",
    provider: "Fashion Forward Inc",
    articleVariant: "AV003",
    articleName: "Sports Sneaker - White - Size 8 - Unisex - Both",
    orderedQty: 50,
    deliveredQty: 50,
    shortageQty: 0,
    spoiltQty: 0,
    status: "Complete",
    notes: "Full delivery completed successfully",
  },
  {
    id: "OUT003",
    date: "2024-01-13",
    provider: "Sports Gear Ltd",
    articleVariant: "AV004",
    articleName: "Casual Boot - Brown - Size 9 - Women - Left",
    orderedQty: 75,
    deliveredQty: 70,
    shortageQty: 5,
    spoiltQty: 0,
    status: "Shortage",
    notes: "Production delay caused shortage",
  },
]

export default function OutwardPage() {
  const [date, setDate] = useState<Date>()
  const [selectedProvider, setSelectedProvider] = useState("")
  const [selectedArticleVariant, setSelectedArticleVariant] = useState("")
  const [deliveryData, setDeliveryData] = useState({
    orderedQty: "",
    deliveredQty: "",
    shortageQty: "",
    spoiltQty: "",
    notes: "",
  })

  const handleSubmit = () => {
    console.log("Creating outward delivery:", {
      date,
      provider: selectedProvider,
      articleVariant: selectedArticleVariant,
      ...deliveryData,
    })
    // Reset form
    setDate(undefined)
    setSelectedProvider("")
    setSelectedArticleVariant("")
    setDeliveryData({
      orderedQty: "",
      deliveredQty: "",
      shortageQty: "",
      spoiltQty: "",
      notes: "",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Complete":
        return "bg-green-600"
      case "Partial":
        return "bg-yellow-600"
      case "Shortage":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const calculateDeliveryRate = (delivered: number, ordered: number) => {
    return ordered > 0 ? ((delivered / ordered) * 100).toFixed(1) : "0"
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="page-header">Outward Delivery</h1>
        <p className="text-dark-text-secondary">
          Log articles delivered to providers, track quantities, shortages, and spoilt goods.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Total Deliveries</p>
                <p className="text-2xl font-bold text-dark-text">{outwardDeliveries.length}</p>
              </div>
              <Truck className="h-8 w-8 text-dark-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Complete Deliveries</p>
                <p className="text-2xl font-bold text-green-400">
                  {outwardDeliveries.filter((d) => d.status === "Complete").length}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Partial/Shortage</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {outwardDeliveries.filter((d) => d.status !== "Complete").length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Spoilt Items</p>
                <p className="text-2xl font-bold text-red-400">
                  {outwardDeliveries.reduce((sum, d) => sum + d.spoiltQty, 0)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delivery Form */}
        <div className="lg:col-span-2">
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-dark-text flex items-center gap-2">
                <Plus className="h-5 w-5" />
                New Outward Delivery
              </CardTitle>
              <CardDescription className="text-dark-text-secondary">
                Log delivery details, quantities, and any issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-dark-text">Delivery Date</Label>
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
                  <Label className="text-dark-text">Provider Company</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-surface border-dark-border">
                      {providerCompanies.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id} className="text-dark-text">
                          {provider.name}
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
                placeholder="Select article variant for delivery"
              />

              {/* Quantity Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-dark-text">Ordered Qty</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={deliveryData.orderedQty}
                    onChange={(e) => setDeliveryData((prev) => ({ ...prev, orderedQty: e.target.value }))}
                    className="bg-dark-bg border-dark-border text-dark-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-dark-text">Delivered Qty</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={deliveryData.deliveredQty}
                    onChange={(e) => setDeliveryData((prev) => ({ ...prev, deliveredQty: e.target.value }))}
                    className="bg-dark-bg border-dark-border text-dark-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-dark-text">Shortage Qty</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={deliveryData.shortageQty}
                    onChange={(e) => setDeliveryData((prev) => ({ ...prev, shortageQty: e.target.value }))}
                    className="bg-dark-bg border-dark-border text-dark-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-dark-text">Spoilt Qty</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={deliveryData.spoiltQty}
                    onChange={(e) => setDeliveryData((prev) => ({ ...prev, spoiltQty: e.target.value }))}
                    className="bg-dark-bg border-dark-border text-dark-text"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-dark-text">Delivery Notes</Label>
                <Textarea
                  placeholder="Add any notes about the delivery, issues, or special instructions..."
                  value={deliveryData.notes}
                  onChange={(e) => setDeliveryData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="bg-dark-bg border-dark-border text-dark-text"
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={handleSubmit} className="bg-dark-accent hover:bg-dark-accent-hover">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Delivery
                </Button>
                <Button variant="outline" className="border-dark-border text-dark-text hover:bg-dark-surface">
                  Clear Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Deliveries */}
        <div>
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-dark-text flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Recent Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {outwardDeliveries.slice(0, 3).map((delivery) => (
                <div key={delivery.id} className="p-3 bg-dark-bg rounded-lg border border-dark-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-dark-text">{delivery.id}</span>
                    <Badge className={getStatusColor(delivery.status)}>{delivery.status}</Badge>
                  </div>
                  <p className="text-sm text-dark-text-secondary mb-1">{delivery.provider}</p>
                  <p className="text-xs text-dark-text-secondary mb-1">
                    {delivery.deliveredQty}/{delivery.orderedQty} delivered
                  </p>
                  <p className="text-xs text-dark-text-secondary">{delivery.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deliveries Table */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-dark-text">All Outward Deliveries</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-text-secondary" />
                <Input
                  placeholder="Search deliveries..."
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
                <TableHead className="text-dark-text">Delivery ID</TableHead>
                <TableHead className="text-dark-text">Date</TableHead>
                <TableHead className="text-dark-text">Provider</TableHead>
                <TableHead className="text-dark-text">Article Variant</TableHead>
                <TableHead className="text-dark-text">Ordered</TableHead>
                <TableHead className="text-dark-text">Delivered</TableHead>
                <TableHead className="text-dark-text">Shortage</TableHead>
                <TableHead className="text-dark-text">Spoilt</TableHead>
                <TableHead className="text-dark-text">Rate</TableHead>
                <TableHead className="text-dark-text">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outwardDeliveries.map((delivery) => (
                <TableRow key={delivery.id} className="border-dark-border">
                  <TableCell className="text-dark-text font-medium">{delivery.id}</TableCell>
                  <TableCell className="text-dark-text-secondary">{delivery.date}</TableCell>
                  <TableCell className="text-dark-text-secondary">{delivery.provider}</TableCell>
                  <TableCell className="text-dark-text-secondary">
                    <div className="max-w-48">
                      <p className="text-sm">{delivery.articleName}</p>
                      <Badge variant="outline" className="border-dark-border text-dark-text-secondary text-xs mt-1">
                        {delivery.articleVariant}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-dark-text-secondary">{delivery.orderedQty}</TableCell>
                  <TableCell className="text-dark-text-secondary">{delivery.deliveredQty}</TableCell>
                  <TableCell className="text-dark-text-secondary">
                    {delivery.shortageQty > 0 ? (
                      <span className="text-yellow-400">{delivery.shortageQty}</span>
                    ) : (
                      delivery.shortageQty
                    )}
                  </TableCell>
                  <TableCell className="text-dark-text-secondary">
                    {delivery.spoiltQty > 0 ? (
                      <span className="text-red-400">{delivery.spoiltQty}</span>
                    ) : (
                      delivery.spoiltQty
                    )}
                  </TableCell>
                  <TableCell className="text-dark-text-secondary">
                    {calculateDeliveryRate(delivery.deliveredQty, delivery.orderedQty)}%
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(delivery.status)}>{delivery.status}</Badge>
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
