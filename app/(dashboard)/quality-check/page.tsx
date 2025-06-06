"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, Search, Eye, AlertTriangle, Package } from "lucide-react"

const completedItems = [
  {
    id: "QC001",
    taskId: "TASK001",
    article: "Classic Oxford - Black - Men",
    worker: "John Smith",
    stage: "Cutting",
    quantity: 50,
    completedDate: "2024-01-15",
    status: "Pending Review",
    defects: [],
  },
  {
    id: "QC002",
    taskId: "TASK002",
    article: "Sports Sneaker - White - Unisex",
    worker: "Maria Garcia",
    stage: "Stitching",
    quantity: 30,
    completedDate: "2024-01-14",
    status: "Approved",
    defects: [],
  },
  {
    id: "QC003",
    taskId: "TASK003",
    article: "Classic Oxford - Black - Men",
    worker: "David Chen",
    stage: "Lasting",
    quantity: 25,
    completedDate: "2024-01-13",
    status: "Rejected",
    defects: ["Uneven lasting", "Poor alignment"],
  },
]

const defectTypes = [
  "Poor stitching",
  "Uneven cutting",
  "Color mismatch",
  "Size variation",
  "Material defect",
  "Alignment issue",
  "Finishing problem",
  "Other",
]

export default function QualityCheckPage() {
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [qcNotes, setQcNotes] = useState("")
  const [selectedDefects, setSelectedDefects] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const handleApprove = (itemId: string) => {
    console.log(`Approved item: ${itemId}`)
    // Update item status to approved
  }

  const handleReject = (itemId: string, defects: string[], notes: string) => {
    console.log(`Rejected item: ${itemId}`, { defects, notes })
    // Update item status to rejected and send back for correction
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-600"
      case "Rejected":
        return "bg-red-600"
      case "Pending Review":
        return "bg-yellow-600"
      default:
        return "bg-gray-600"
    }
  }

  const toggleDefect = (defect: string) => {
    setSelectedDefects((prev) => (prev.includes(defect) ? prev.filter((d) => d !== defect) : [...prev, defect]))
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="page-header">Internal Quality Check</h1>
        <p className="text-dark-text-secondary">
          Review completed items, approve quality work, or send faulty items back for correction.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {completedItems.filter((item) => item.status === "Pending Review").length}
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
                <p className="text-sm text-dark-text-secondary">Approved Today</p>
                <p className="text-2xl font-bold text-green-400">
                  {completedItems.filter((item) => item.status === "Approved").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Rejected Items</p>
                <p className="text-2xl font-bold text-red-400">
                  {completedItems.filter((item) => item.status === "Rejected").length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Total Items</p>
                <p className="text-2xl font-bold text-dark-text">{completedItems.length}</p>
              </div>
              <Package className="h-8 w-8 text-dark-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Check Table */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-dark-text">Items for Quality Check</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-text-secondary" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                <TableHead className="text-dark-text">QC ID</TableHead>
                <TableHead className="text-dark-text">Article</TableHead>
                <TableHead className="text-dark-text">Stage</TableHead>
                <TableHead className="text-dark-text">Worker</TableHead>
                <TableHead className="text-dark-text">Quantity</TableHead>
                <TableHead className="text-dark-text">Completed Date</TableHead>
                <TableHead className="text-dark-text">Status</TableHead>
                <TableHead className="text-dark-text">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedItems.map((item) => (
                <TableRow key={item.id} className="border-dark-border">
                  <TableCell className="text-dark-text font-medium">{item.id}</TableCell>
                  <TableCell className="text-dark-text-secondary">{item.article}</TableCell>
                  <TableCell className="text-dark-text-secondary">{item.stage}</TableCell>
                  <TableCell className="text-dark-text-secondary">{item.worker}</TableCell>
                  <TableCell className="text-dark-text-secondary">{item.quantity}</TableCell>
                  <TableCell className="text-dark-text-secondary">{item.completedDate}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedItem(item)}
                            className="text-dark-text-secondary hover:text-dark-text"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-dark-surface border-dark-border max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-dark-text">Quality Check - {item.id}</DialogTitle>
                            <DialogDescription className="text-dark-text-secondary">
                              Review and approve or reject this completed item
                            </DialogDescription>
                          </DialogHeader>

                          {selectedItem && (
                            <div className="space-y-6">
                              {/* Item Details */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-dark-text">Article</Label>
                                  <p className="text-dark-text-secondary">{selectedItem.article}</p>
                                </div>
                                <div>
                                  <Label className="text-dark-text">Stage</Label>
                                  <p className="text-dark-text-secondary">{selectedItem.stage}</p>
                                </div>
                                <div>
                                  <Label className="text-dark-text">Worker</Label>
                                  <p className="text-dark-text-secondary">{selectedItem.worker}</p>
                                </div>
                                <div>
                                  <Label className="text-dark-text">Quantity</Label>
                                  <p className="text-dark-text-secondary">{selectedItem.quantity}</p>
                                </div>
                              </div>

                              {/* Quality Assessment */}
                              <div className="space-y-4">
                                <Label className="text-dark-text">Quality Assessment</Label>

                                {/* Defect Selection */}
                                <div className="space-y-2">
                                  <Label className="text-sm text-dark-text-secondary">Select Defects (if any)</Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {defectTypes.map((defect) => (
                                      <Button
                                        key={defect}
                                        variant={selectedDefects.includes(defect) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleDefect(defect)}
                                        className={
                                          selectedDefects.includes(defect)
                                            ? "bg-red-600 hover:bg-red-700"
                                            : "border-dark-border text-dark-text hover:bg-dark-accent hover:border-dark-accent"
                                        }
                                      >
                                        {defect}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                {/* QC Notes */}
                                <div className="space-y-2">
                                  <Label className="text-dark-text">QC Notes</Label>
                                  <Textarea
                                    placeholder="Add quality check notes..."
                                    value={qcNotes}
                                    onChange={(e) => setQcNotes(e.target.value)}
                                    className="bg-dark-bg border-dark-border text-dark-text"
                                    rows={3}
                                  />
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-4 pt-4">
                                <Button
                                  onClick={() => handleApprove(selectedItem.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                  disabled={selectedDefects.length > 0}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleReject(selectedItem.id, selectedDefects, qcNotes)}
                                  variant="destructive"
                                  disabled={selectedDefects.length === 0}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject & Send Back
                                </Button>
                              </div>

                              {selectedDefects.length > 0 && (
                                <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
                                  <p className="text-red-400 text-sm font-medium mb-2">
                                    Item will be rejected and sent back for correction
                                  </p>
                                  <p className="text-red-300 text-xs">
                                    Note: Rejected items are not eligible for payroll until corrected and re-approved.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {item.status === "Pending Review" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(item.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(item.id, [], "")}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
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
