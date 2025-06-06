"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Download, FileText, BarChart3, TrendingUp, Package, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ArticleVariantSelector } from "@/components/article-variant-selector"
import { workers, articleVariants, factories, workHistory, reportTemplates } from "@/lib/dummy-data"

export default function ReportsPage() {
  const [selectedArticle, setSelectedArticle] = useState("")
  const [selectedWorker, setSelectedWorker] = useState("")
  const [selectedFactory, setSelectedFactory] = useState("")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [reportType, setReportType] = useState("")

  const generateReport = (format: "csv" | "pdf") => {
    console.log("Generating report:", {
      format,
      filters: {
        article: selectedArticle,
        worker: selectedWorker,
        factory: selectedFactory,
        dateFrom,
        dateTo,
        reportType,
      },
    })
    // Simulate report generation
    alert(`${format.toUpperCase()} report generated successfully!`)
  }

  // Calculate summary statistics
  const totalProduced = workHistory.filter((w) => w.status === "Completed").reduce((sum, w) => sum + w.quantity, 0)
  const totalDefects = workHistory.filter((w) => w.isRework).length
  const totalPayroll = workHistory.reduce((sum, w) => sum + w.payableAmount, 0)
  const avgQuality =
    workHistory.length > 0 ? workHistory.reduce((sum, w) => sum + w.qualityScore, 0) / workHistory.length : 0

  const productionByArticle = articleVariants.map((article) => {
    const articleWork = workHistory.filter((w) => w.articleVariant === article.id)
    const produced = articleWork.filter((w) => w.status === "Completed").reduce((sum, w) => sum + w.quantity, 0)
    const defects = articleWork.filter((w) => w.isRework).length
    return {
      ...article,
      produced,
      defects,
      defectRate: produced > 0 ? ((defects / (produced + defects)) * 100).toFixed(1) : "0",
    }
  })

  const workerPerformance = workers.map((worker) => {
    const workerTasks = workHistory.filter((w) => w.workerId === worker.id)
    const completed = workerTasks.filter((w) => w.status === "Completed").length
    const rework = workerTasks.filter((w) => w.isRework).length
    const totalHours = workerTasks.reduce((sum, w) => sum + w.hoursWorked, 0)
    const earnings = workerTasks.reduce((sum, w) => sum + w.payableAmount, 0)
    const avgQuality =
      workerTasks.length > 0 ? workerTasks.reduce((sum, w) => sum + w.qualityScore, 0) / workerTasks.length : 0

    return {
      ...worker,
      completed,
      rework,
      totalHours,
      earnings,
      avgQuality: avgQuality.toFixed(1),
      efficiency: totalHours > 0 ? ((completed / totalHours) * 10).toFixed(1) : "0",
    }
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-text mb-2">Reports & Analytics</h1>
        <p className="text-dark-text-secondary">
          Generate comprehensive reports and analyze factory performance metrics.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Total Produced</p>
                <p className="text-2xl font-bold text-blue-400">{totalProduced.toLocaleString()}</p>
                <p className="text-xs text-dark-text-secondary">Units completed</p>
              </div>
              <Package className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Quality Score</p>
                <p className="text-2xl font-bold text-green-400">{avgQuality.toFixed(1)}%</p>
                <p className="text-xs text-dark-text-secondary">Average quality</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Total Defects</p>
                <p className="text-2xl font-bold text-red-400">{totalDefects}</p>
                <p className="text-xs text-dark-text-secondary">Rework required</p>
              </div>
              <BarChart3 className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Payroll Cost</p>
                <p className="text-2xl font-bold text-yellow-400">${totalPayroll.toFixed(0)}</p>
                <p className="text-xs text-dark-text-secondary">Total wages</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="bg-dark-surface border-dark-border">
          <TabsTrigger value="generate" className="data-[state=active]:bg-dark-accent hover:bg-dark-accent-hover">
            Generate Reports
          </TabsTrigger>
          <TabsTrigger
            value="article-analysis"
            className="data-[state=active]:bg-dark-accent hover:bg-dark-accent-hover"
          >
            Article Analysis
          </TabsTrigger>
          <TabsTrigger
            value="worker-performance"
            className="data-[state=active]:bg-dark-accent hover:bg-dark-accent-hover"
          >
            Worker Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Generation Form */}
            <div className="lg:col-span-2">
              <Card className="bg-dark-surface border-dark-border">
                <CardHeader>
                  <CardTitle className="text-dark-text flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Generate Custom Report
                  </CardTitle>
                  <CardDescription className="text-dark-text-secondary">
                    Configure filters and generate detailed reports in CSV or PDF format
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Report Type */}
                  <div className="space-y-2">
                    <Label className="text-dark-text">Report Template</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-surface border-dark-border">
                        {reportTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id} className="text-dark-text">
                            <div>
                              <p className="font-medium">{template.name}</p>
                              <p className="text-xs text-dark-text-secondary">{template.description}</p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-dark-text">Factory</Label>
                      <Select value={selectedFactory} onValueChange={setSelectedFactory}>
                        <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                          <SelectValue placeholder="All factories" />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-surface border-dark-border">
                          <SelectItem value="all-factories" className="text-dark-text">
                            All factories
                          </SelectItem>
                          {factories.map((factory) => (
                            <SelectItem key={factory.id} value={factory.id} className="text-dark-text">
                              {factory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-dark-text">Worker</Label>
                      <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                        <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                          <SelectValue placeholder="All workers" />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-surface border-dark-border">
                          <SelectItem value="all-workers" className="text-dark-text">
                            All workers
                          </SelectItem>
                          {workers.map((worker) => (
                            <SelectItem key={worker.id} value={worker.id} className="text-dark-text">
                              {worker.name} - {worker.skill}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-dark-text">From Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-dark-bg border-dark-border text-dark-text",
                              !dateFrom && "text-dark-text-secondary",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFrom ? format(dateFrom, "PPP") : "Pick start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-dark-surface border-dark-border">
                          <Calendar
                            mode="single"
                            selected={dateFrom}
                            onSelect={setDateFrom}
                            initialFocus
                            className="bg-dark-surface text-dark-text"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-dark-text">To Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-dark-bg border-dark-border text-dark-text",
                              !dateTo && "text-dark-text-secondary",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateTo ? format(dateTo, "PPP") : "Pick end date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-dark-surface border-dark-border">
                          <Calendar
                            mode="single"
                            selected={dateTo}
                            onSelect={setDateTo}
                            initialFocus
                            className="bg-dark-surface text-dark-text"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <ArticleVariantSelector
                    value={selectedArticle}
                    onValueChange={setSelectedArticle}
                    label="Article Variant (Optional)"
                    placeholder="All article variants"
                  />

                  {/* Generate Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button onClick={() => generateReport("csv")} className="bg-green-600 hover:bg-green-700">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button onClick={() => generateReport("pdf")} className="bg-red-600 hover:bg-red-700">
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Reports */}
            <div>
              <Card className="bg-dark-surface border-dark-border">
                <CardHeader>
                  <CardTitle className="text-dark-text">Quick Reports</CardTitle>
                  <CardDescription className="text-dark-text-secondary">
                    Generate common reports instantly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reportTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      className="w-full justify-start border-dark-border text-dark-text hover:bg-gray-800"
                      onClick={() => generateReport("pdf")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-dark-text-secondary">{template.description}</p>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="article-analysis" className="space-y-4">
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-dark-text">Article Performance Analysis</CardTitle>
              <CardDescription className="text-dark-text-secondary">
                Production metrics and quality analysis by article variant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productionByArticle.map((article) => (
                  <Card key={article.id} className="bg-dark-bg border-dark-border">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-dark-text">{article.articleName}</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                              {article.articleNumber}
                            </Badge>
                            <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                              {article.colorName}
                            </Badge>
                            <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                              Size {article.size}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Produced:</span>
                            <span className="text-dark-text">{article.produced}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Defects:</span>
                            <span className="text-red-400">{article.defects}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Defect Rate:</span>
                            <span
                              className={Number.parseFloat(article.defectRate) > 5 ? "text-red-400" : "text-green-400"}
                            >
                              {article.defectRate}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Revenue:</span>
                            <span className="text-green-400">${(article.produced * article.price).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="worker-performance" className="space-y-4">
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-dark-text">Worker Performance Analysis</CardTitle>
              <CardDescription className="text-dark-text-secondary">
                Individual worker productivity, quality, and earnings metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workerPerformance.map((worker) => (
                  <Card key={worker.id} className="bg-dark-bg border-dark-border">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-dark-text">{worker.name}</h3>
                          <p className="text-sm text-dark-text-secondary">
                            {worker.employeeId} - {worker.skill}
                          </p>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Completed Tasks:</span>
                            <span className="text-green-400">{worker.completed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Rework Tasks:</span>
                            <span className="text-red-400">{worker.rework}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Total Hours:</span>
                            <span className="text-dark-text">{worker.totalHours}h</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Avg Quality:</span>
                            <span className="text-dark-text">{worker.avgQuality}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Efficiency:</span>
                            <span className="text-blue-400">{worker.efficiency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Total Earnings:</span>
                            <span className="text-green-400">${worker.earnings.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          <Badge className={worker.status === "Available" ? "bg-green-600" : "bg-red-600"}>
                            {worker.status}
                          </Badge>
                          <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                            ${worker.hourlyRate}/hr
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
