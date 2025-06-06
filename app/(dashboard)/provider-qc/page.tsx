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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CalendarIcon, Plus, Search, AlertTriangle, Eye, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ArticleVariantSelector } from "@/components/article-variant-selector"
import { providerCompanies, defectTypes } from "@/lib/dummy-data"

const providerQCIssues = [
  {
    id: "PQC001",
    date: "2024-01-15",
    provider: "Global Shoe Distributors",
    articleVariant: "AV001",
    articleName: "Classic Oxford - Black - Size 9 - Men - Both",
    deliveryId: "OUT001",
    issueQty: 5,
    defects: ["Poor stitching", "Color mismatch"],
    description: "Stitching quality below standard, slight color variation",
    status: "Pending Rework",
    priority: "Medium",
    reportedBy: "John Doe",
  },
  {
    id: "PQC002",
    date: "2024-01-14",
    provider: "Fashion Forward Inc",
    articleVariant: "AV003",
    articleName: "Sports Sneaker - White - Size 8 - Unisex - Both",
    deliveryId: "OUT002",
    issueQty: 2,
    defects: ["Sole detachment"],
    description: "Sole separation noticed after minimal use",
    status: "Rework Complete",
    priority: "High",
    reportedBy: "Jane Smith",
  },
  {
    id: "PQC003",
    date: "2024-01-13",
    provider: "Sports Gear Ltd",
    articleVariant: "AV004",
    articleName: "Casual Boot - Brown - Size 9 - Women - Left",
    deliveryId: "OUT003",
    issueQty: 3,
    defects: ["Size variation", "Finishing problem"],
    description: "Inconsistent sizing and poor finishing on heel area",
    status: "Under Review",
    priority: "Low",
    reportedBy: "Mike Johnson",
  },
]

export default function ProviderQCPage() {
  const [date, setDate] = useState<Date>()
  const [selectedProvider, setSelectedProvider] = useState("")
  const [selectedArticleVariant, setSelectedArticleVariant] = useState("")
  const [selectedIssue, setSelectedIssue] = useState<any>(null)
  const [selectedDefects, setSelectedDefects] = useState<string[]>([])
  const [issueData, setIssueData] = useState({
    deliveryId: "",
    issueQty: "",
    description: "",
    priority: "",
    reportedBy: "",
  })

  const handleSubmit = () => {
    console.log("Creating provider QC issue:", {
      date,
      provider: selectedProvider,
      articleVariant: selectedArticleVariant,
      defects: selectedDefects,
      ...issueData,
    })
    // Reset form
    setDate(undefined)
    setSelectedProvider("")
    setSelectedArticleVariant("")
    setSelectedDefects([])
    setIssueData({
      deliveryId: "",
      issueQty: "",
      description: "",
      priority: "",
      reportedBy: "",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Rework Complete":
        return "bg-green-600"
      case "Pending Rework":
        return "bg-yellow-600"
      case "Under Review":
        return "bg-blue-600"
      case "Rejected":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-600"
      case "Medium":
        return "bg-yellow-600"
      case "Low":
        return "bg-green-600"
      default:
        return "bg-gray-600"
    }
  }

  const toggleDefect = (defect: string) => {
    setSelectedDefects((prev) => (prev.includes(defect) ? prev.filter((d) => d !== defect) : [...prev, defect]))
  }

  const updateStatus = (issueId: string, newStatus: string) => {
    console.log(`Updating issue ${issueId} status to ${newStatus}`)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="page-header">Provider Company QC</h1>
        <p className="text-dark-text-secondary">
          Track quality issues reported by provider companies and manage rework processes.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Total Issues</p>
                <p className="text-2xl font-bold text-dark-text">{providerQCIssues.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-dark-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Pending Rework</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {providerQCIssues.filter((issue) => issue.status === "Pending Rework").length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Rework Complete</p>
                <p className="text-2xl font-bold text-green-400">
                  {providerQCIssues.filter((issue) => issue.status === "Rework Complete").length}
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
                <p className="text-sm text-dark-text-secondary">High Priority</p>
                <p className="text-2xl font-bold text-red-400">
                  {providerQCIssues.filter((issue) => issue.priority === "High").length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issue Form */}
        <div className="lg:col-span-2">
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-dark-text flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Log Provider QC Issue
              </CardTitle>
              <CardDescription className="text-dark-text-secondary">
                Record quality issues reported by provider companies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-dark-text">Issue Date</Label>
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

                <div className="space-y-2">
                  <Label className="text-dark-text">Delivery ID</Label>
                  <Input
                    placeholder="e.g., OUT001"
                    value={issueData.deliveryId}
                    onChange={(e) => setIssueData((prev) => ({ ...prev, deliveryId: e.target.value }))}
                    className="bg-dark-bg border-dark-border text-dark-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-dark-text">Issue Quantity</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={issueData.issueQty}
                    onChange={(e) => setIssueData((prev) => ({ ...prev, issueQty: e.target.value }))}
                    className="bg-dark-bg border-dark-border text-dark-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-dark-text">Priority</Label>
                  <Select
                    value={issueData.priority}
                    onValueChange={(value) => setIssueData((prev) => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-surface border-dark-border">
                      <SelectItem value="Low" className="text-dark-text">
                        Low
                      </SelectItem>
                      <SelectItem value="Medium" className="text-dark-text">
                        Medium
                      </SelectItem>
                      <SelectItem value="High" className="text-dark-text">
                        High
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-dark-text">Reported By</Label>
                  <Input
                    placeholder="Reporter name"
                    value={issueData.reportedBy}
                    onChange={(e) => setIssueData((prev) => ({ ...prev, reportedBy: e.target.value }))}
                    className="bg-dark-bg border-dark-border text-dark-text"
                  />
                </div>
              </div>

              <ArticleVariantSelector
                value={selectedArticleVariant}
                onValueChange={setSelectedArticleVariant}
                label="Article Variant"
                placeholder="Select affected article variant"
              />

              {/* Defect Types */}
              <div className="space-y-4">
                <Label className="text-dark-text">Defect Types</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {defectTypes.map((defect) => (
                    <Button
                      key={defect}
                      variant={selectedDefects.includes(defect) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDefect(defect)}
                      className={
                        selectedDefects.includes(defect)
                          ? "bg-red-600 hover:bg-red-700"
                          : "border-dark-border text-dark-text hover:bg-red-600 hover:border-red-600"
                      }
                    >
                      {defect}
                    </Button>
                  ))}
                </div>
                {selectedDefects.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedDefects.map((defect) => (
                      <Badge key={defect} variant="secondary" className="bg-red-600 text-white">
                        {defect}
                        <button onClick={() => toggleDefect(defect)} className="ml-1 hover:text-red-300">
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-dark-text">Issue Description</Label>
                <Textarea
                  placeholder="Detailed description of the quality issue..."
                  value={issueData.description}
                  onChange={(e) => setIssueData((prev) => ({ ...prev, description: e.target.value }))}
                  className="bg-dark-bg border-dark-border text-dark-text"
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={handleSubmit} className="bg-dark-accent hover:bg-dark-accent-hover">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Issue
                </Button>
                <Button variant="outline" className="border-dark-border text-dark-text hover:bg-dark-surface">
                  Clear Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Issues */}
        <div>
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-dark-text flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {providerQCIssues.slice(0, 3).map((issue) => (
                <div key={issue.id} className="p-3 bg-dark-bg rounded-lg border border-dark-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-dark-text">{issue.id}</span>
                    <div className="flex gap-1">
                      <Badge className={getPriorityColor(issue.priority)} style={{ fontSize: "10px" }}>
                        {issue.priority}
                      </Badge>
                      <Badge className={getStatusColor(issue.status)} style={{ fontSize: "10px" }}>
                        {issue.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-dark-text-secondary mb-1">{issue.provider}</p>
                  <p className="text-xs text-dark-text-secondary mb-1">{issue.issueQty} items affected</p>
                  <p className="text-xs text-dark-text-secondary">{issue.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Issues Table */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-dark-text">All Provider QC Issues</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-text-secondary" />
                <Input
                  placeholder="Search issues..."
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
                <TableHead className="text-dark-text">Issue ID</TableHead>
                <TableHead className="text-dark-text">Date</TableHead>
                <TableHead className="text-dark-text">Provider</TableHead>
                <TableHead className="text-dark-text">Article Variant</TableHead>
                <TableHead className="text-dark-text">Delivery ID</TableHead>
                <TableHead className="text-dark-text">Issue Qty</TableHead>
                <TableHead className="text-dark-text">Defects</TableHead>
                <TableHead className="text-dark-text">Priority</TableHead>
                <TableHead className="text-dark-text">Status</TableHead>
                <TableHead className="text-dark-text">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providerQCIssues.map((issue) => (
                <TableRow key={issue.id} className="border-dark-border">
                  <TableCell className="text-dark-text font-medium">{issue.id}</TableCell>
                  <TableCell className="text-dark-text-secondary">{issue.date}</TableCell>
                  <TableCell className="text-dark-text-secondary">{issue.provider}</TableCell>
                  <TableCell className="text-dark-text-secondary">
                    <div className="max-w-48">
                      <p className="text-sm">{issue.articleName}</p>
                      <Badge variant="outline" className="border-dark-border text-dark-text-secondary text-xs mt-1">
                        {issue.articleVariant}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-dark-text-secondary">{issue.deliveryId}</TableCell>
                  <TableCell className="text-dark-text-secondary">{issue.issueQty}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {issue.defects.slice(0, 2).map((defect) => (
                        <Badge key={defect} variant="outline" className="border-red-600 text-red-400 text-xs">
                          {defect}
                        </Badge>
                      ))}
                      {issue.defects.length > 2 && (
                        <Badge variant="outline" className="border-red-600 text-red-400 text-xs">
                          +{issue.defects.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(issue.priority)}>{issue.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(issue.status)}>{issue.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedIssue(issue)}
                            className="text-dark-text-secondary hover:text-dark-text"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-dark-surface border-dark-border max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-dark-text">QC Issue Details - {issue.id}</DialogTitle>
                            <DialogDescription className="text-dark-text-secondary">
                              Review and manage provider quality control issue
                            </DialogDescription>
                          </DialogHeader>

                          {selectedIssue && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-dark-text">Provider</Label>
                                  <p className="text-dark-text-secondary">{selectedIssue.provider}</p>
                                </div>
                                <div>
                                  <Label className="text-dark-text">Reported By</Label>
                                  <p className="text-dark-text-secondary">{selectedIssue.reportedBy}</p>
                                </div>
                                <div>
                                  <Label className="text-dark-text">Article Variant</Label>
                                  <p className="text-dark-text-secondary">{selectedIssue.articleName}</p>
                                </div>
                                <div>
                                  <Label className="text-dark-text">Issue Quantity</Label>
                                  <p className="text-dark-text-secondary">{selectedIssue.issueQty}</p>
                                </div>
                              </div>

                              <div>
                                <Label className="text-dark-text">Defects</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedIssue.defects.map((defect) => (
                                    <Badge key={defect} className="bg-red-600 text-white">
                                      {defect}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label className="text-dark-text">Description</Label>
                                <p className="text-dark-text-secondary mt-1">{selectedIssue.description}</p>
                              </div>

                              <div className="flex gap-4 pt-4">
                                <Button
                                  onClick={() => updateStatus(selectedIssue.id, "Rework Complete")}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Mark Rework Complete
                                </Button>
                                <Button
                                  onClick={() => updateStatus(selectedIssue.id, "Pending Rework")}
                                  className="bg-yellow-600 hover:bg-yellow-700"
                                >
                                  Send for Rework
                                </Button>
                              </div>

                              <div className="p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                                <p className="text-yellow-400 text-sm font-medium mb-1">Non-Payable Work Notice</p>
                                <p className="text-yellow-300 text-xs">
                                  Items sent back for rework due to provider QC issues are not eligible for payroll
                                  until successfully corrected and re-approved.
                                </p>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
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
