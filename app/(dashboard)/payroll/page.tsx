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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Search, Users, DollarSign, Clock, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { workers, workHistory, productionStages } from "@/lib/dummy-data"

export default function PayrollPage() {
  const [selectedWorker, setSelectedWorker] = useState("")
  const [selectedStage, setSelectedStage] = useState("")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredWorkHistory = workHistory.filter((work) => {
    const matchesWorker = selectedWorker === "all-workers" || !selectedWorker || work.workerId === selectedWorker
    const matchesStage = selectedStage === "all-stages" || !selectedStage || work.stage === selectedStage
    const matchesSearch =
      !searchTerm ||
      work.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.articleName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesWorker && matchesStage && matchesSearch
  })

  const calculateWorkerStats = (workerId: string) => {
    const workerTasks = workHistory.filter((w) => w.workerId === workerId)
    const totalHours = workerTasks.reduce((sum, task) => sum + task.hoursWorked, 0)
    const totalEarnings = workerTasks.reduce((sum, task) => sum + task.payableAmount, 0)
    const completedTasks = workerTasks.filter((task) => task.status === "Completed").length
    const reworkTasks = workerTasks.filter((task) => task.isRework).length
    const avgQuality =
      workerTasks.length > 0 ? workerTasks.reduce((sum, task) => sum + task.qualityScore, 0) / workerTasks.length : 0

    return {
      totalHours,
      totalEarnings,
      completedTasks,
      reworkTasks,
      avgQuality: avgQuality.toFixed(1),
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-600"
      case "Rework":
        return "bg-red-600"
      case "In Progress":
        return "bg-blue-600"
      default:
        return "bg-gray-600"
    }
  }

  const totalPayroll = workHistory.reduce((sum, work) => sum + work.payableAmount, 0)
  const totalHours = workHistory.reduce((sum, work) => sum + work.hoursWorked, 0)
  const reworkCount = workHistory.filter((work) => work.isRework).length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-text mb-2">Employee & Payroll Management</h1>
        <p className="text-dark-text-secondary">
          Manage workers, track work history, and calculate payroll based on completed tasks.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Total Employees</p>
                <p className="text-2xl font-bold text-dark-text">{workers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Total Payroll</p>
                <p className="text-2xl font-bold text-green-400">${totalPayroll.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Total Hours</p>
                <p className="text-2xl font-bold text-blue-400">{totalHours}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-text-secondary">Rework Tasks</p>
                <p className="text-2xl font-bold text-red-400">{reworkCount}</p>
                <p className="text-xs text-dark-text-secondary">Non-payable</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList className="bg-dark-surface border-dark-border">
          <TabsTrigger value="employees" className="data-[state=active]:bg-dark-accent">
            Employees
          </TabsTrigger>
          <TabsTrigger value="work-history" className="data-[state=active]:bg-dark-accent">
            Work History
          </TabsTrigger>
          <TabsTrigger value="payroll" className="data-[state=active]:bg-dark-accent">
            Payroll Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-dark-text">Employee Directory</CardTitle>
              <CardDescription className="text-dark-text-secondary">
                Manage employee information and view performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workers.map((worker) => {
                  const stats = calculateWorkerStats(worker.id)
                  return (
                    <Card key={worker.id} className="bg-dark-bg border-dark-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-dark-text">{worker.name}</h3>
                            <p className="text-sm text-dark-text-secondary">{worker.employeeId}</p>
                          </div>
                          <Badge className={worker.status === "Available" ? "bg-green-600" : "bg-red-600"}>
                            {worker.status}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Skill:</span>
                            <span className="text-dark-text">{worker.skill}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Rate:</span>
                            <span className="text-dark-text">${worker.hourlyRate}/hr</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Total Hours:</span>
                            <span className="text-dark-text">{stats.totalHours}h</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Earnings:</span>
                            <span className="text-green-400">${stats.totalEarnings.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Quality:</span>
                            <span className="text-dark-text">{stats.avgQuality}%</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-3">
                          <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                            {stats.completedTasks} completed
                          </Badge>
                          {stats.reworkTasks > 0 && (
                            <Badge variant="outline" className="border-red-600 text-red-400 text-xs">
                              {stats.reworkTasks} rework
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-history" className="space-y-4">
          {/* Filters */}
          <Card className="bg-dark-surface border-dark-border">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                          {worker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-dark-text">Stage</Label>
                  <Select value={selectedStage} onValueChange={setSelectedStage}>
                    <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                      <SelectValue placeholder="All stages" />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-surface border-dark-border">
                      <SelectItem value="all-stages" className="text-dark-text">
                        All stages
                      </SelectItem>
                      {productionStages.map((stage) => (
                        <SelectItem key={stage} value={stage} className="text-dark-text">
                          {stage}
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
                          !dateFrom && "text-gray-400",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "PPP") : "Pick date"}
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
                  <Label className="text-dark-text">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-text-secondary" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-dark-bg border-dark-border text-dark-text"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work History Table */}
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-dark-text">Work History</CardTitle>
              <CardDescription className="text-dark-text-secondary">
                Track all work assignments and completion status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-dark-border">
                    <TableHead className="text-dark-text">Task ID</TableHead>
                    <TableHead className="text-dark-text">Worker</TableHead>
                    <TableHead className="text-dark-text">Article</TableHead>
                    <TableHead className="text-dark-text">Stage</TableHead>
                    <TableHead className="text-dark-text">Duration</TableHead>
                    <TableHead className="text-dark-text">Hours</TableHead>
                    <TableHead className="text-dark-text">Quantity</TableHead>
                    <TableHead className="text-dark-text">Quality</TableHead>
                    <TableHead className="text-dark-text">Amount</TableHead>
                    <TableHead className="text-dark-text">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkHistory.map((work) => (
                    <TableRow key={work.id} className="border-dark-border">
                      <TableCell className="text-dark-text font-medium">{work.taskId}</TableCell>
                      <TableCell className="text-dark-text-secondary">{work.workerName}</TableCell>
                      <TableCell className="text-dark-text-secondary">
                        <div className="max-w-48">
                          <p className="text-sm">{work.articleName}</p>
                          <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs mt-1">
                            {work.articleVariant}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-dark-text-secondary">{work.stage}</TableCell>
                      <TableCell className="text-dark-text-secondary text-sm">
                        {work.startDate} - {work.endDate}
                      </TableCell>
                      <TableCell className="text-dark-text-secondary">{work.hoursWorked}h</TableCell>
                      <TableCell className="text-dark-text-secondary">{work.quantity}</TableCell>
                      <TableCell className="text-dark-text-secondary">{work.qualityScore}%</TableCell>
                      <TableCell className={work.isRework ? "text-red-400" : "text-green-400"}>
                        ${work.payableAmount.toFixed(2)}
                        {work.isRework && (
                          <Badge variant="outline" className="border-red-600 text-red-400 text-xs ml-1">
                            Non-payable
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(work.status)}>{work.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-dark-text">Payroll Summary</CardTitle>
              <CardDescription className="text-dark-text-secondary">
                Calculate wages based on completed work (excluding rework)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-dark-border">
                    <TableHead className="text-dark-text">Employee</TableHead>
                    <TableHead className="text-dark-text">Employee ID</TableHead>
                    <TableHead className="text-dark-text">Skill</TableHead>
                    <TableHead className="text-dark-text">Rate</TableHead>
                    <TableHead className="text-dark-text">Hours Worked</TableHead>
                    <TableHead className="text-dark-text">Completed Tasks</TableHead>
                    <TableHead className="text-dark-text">Rework Tasks</TableHead>
                    <TableHead className="text-dark-text">Quality Score</TableHead>
                    <TableHead className="text-dark-text">Total Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((worker) => {
                    const stats = calculateWorkerStats(worker.id)
                    return (
                      <TableRow key={worker.id} className="border-dark-border">
                        <TableCell className="text-dark-text font-medium">{worker.name}</TableCell>
                        <TableCell className="text-dark-text-secondary">{worker.employeeId}</TableCell>
                        <TableCell className="text-dark-text-secondary">{worker.skill}</TableCell>
                        <TableCell className="text-dark-text-secondary">${worker.hourlyRate}/hr</TableCell>
                        <TableCell className="text-dark-text-secondary">{stats.totalHours}h</TableCell>
                        <TableCell className="text-green-400">{stats.completedTasks}</TableCell>
                        <TableCell className="text-red-400">{stats.reworkTasks}</TableCell>
                        <TableCell className="text-dark-text-secondary">{stats.avgQuality}%</TableCell>
                        <TableCell className="text-green-400 font-medium">${stats.totalEarnings.toFixed(2)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
