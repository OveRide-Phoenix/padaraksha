"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Search, Users, Activity, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const workers = [
  { id: "W001", name: "John Smith", skill: "Cutting", status: "Available" },
  { id: "W002", name: "Maria Garcia", skill: "Stitching", status: "Busy" },
  { id: "W003", name: "David Chen", skill: "Lasting", status: "Available" },
  { id: "W004", name: "Sarah Johnson", skill: "Finishing", status: "Available" },
  { id: "W005", name: "Ahmed Hassan", skill: "Quality Check", status: "Busy" },
]

const articles = [
  { id: "ART001", name: "Classic Oxford - Black - Men", stages: ["Cutting", "Stitching", "Lasting", "Finishing"] },
  { id: "ART002", name: "Sports Sneaker - White - Unisex", stages: ["Cutting", "Stitching", "Sole Attachment"] },
]

const productionTasks = [
  {
    id: "TASK001",
    article: "Classic Oxford - Black - Men",
    stage: "Cutting",
    worker: "John Smith",
    startDate: "2024-01-15",
    endDate: "2024-01-17",
    progress: 75,
    status: "In Progress",
    quantity: 50,
  },
  {
    id: "TASK002",
    article: "Sports Sneaker - White - Unisex",
    stage: "Stitching",
    worker: "Maria Garcia",
    startDate: "2024-01-14",
    endDate: "2024-01-16",
    progress: 90,
    status: "In Progress",
    quantity: 30,
  },
  {
    id: "TASK003",
    article: "Classic Oxford - Black - Men",
    stage: "Lasting",
    worker: "David Chen",
    startDate: "2024-01-13",
    endDate: "2024-01-15",
    progress: 100,
    status: "Completed",
    quantity: 25,
  },
]

export default function ProductionPage() {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [selectedArticle, setSelectedArticle] = useState("")
  const [selectedStage, setSelectedStage] = useState("")
  const [selectedWorker, setSelectedWorker] = useState("")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-600"
      case "In Progress":
        return "bg-blue-600"
      case "Pending":
        return "bg-yellow-600"
      case "Delayed":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const getWorkerStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-600"
      case "Busy":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="page-header">Production Tracking</h1>
        <p className="text-dark-text-secondary">Assign workers to article tasks and monitor production progress.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Task Assignment Form */}
        <div className="lg:col-span-3">
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-dark-text flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Assign New Task
              </CardTitle>
              <CardDescription className="text-dark-text-secondary">
                Assign workers to specific article production stages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-dark-text">Article</Label>
                  <Select value={selectedArticle} onValueChange={setSelectedArticle}>
                    <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                      <SelectValue placeholder="Select article" />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-surface border-dark-border">
                      {articles.map((article) => (
                        <SelectItem key={article.id} value={article.id} className="text-dark-text">
                          {article.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-dark-text">Production Stage</Label>
                  <Select value={selectedStage} onValueChange={setSelectedStage}>
                    <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-surface border-dark-border">
                      {selectedArticle &&
                        articles
                          .find((a) => a.id === selectedArticle)
                          ?.stages.map((stage) => (
                            <SelectItem key={stage} value={stage} className="text-dark-text">
                              {stage}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-dark-text">Assign Worker</Label>
                  <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                    <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                      <SelectValue placeholder="Select worker" />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-surface border-dark-border">
                      {workers
                        .filter((w) => w.status === "Available")
                        .map((worker) => (
                          <SelectItem key={worker.id} value={worker.id} className="text-dark-text">
                            {worker.name} - {worker.skill}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-dark-text">Quantity</Label>
                  <Input
                    type="number"
                    placeholder="Enter quantity"
                    className="bg-dark-bg border-dark-border text-dark-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-dark-text">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-dark-bg border-dark-border text-dark-text",
                          !startDate && "text-dark-text-secondary",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-dark-surface border-dark-border">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className="bg-dark-surface text-dark-text"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-dark-text">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-dark-bg border-dark-border text-dark-text",
                          !endDate && "text-dark-text-secondary",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-dark-surface border-dark-border">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className="bg-dark-surface text-dark-text"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button className="bg-dark-accent hover:bg-dark-accent-hover">
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Task
                </Button>
                <Button variant="outline" className="border-dark-border text-dark-text hover:bg-dark-surface">
                  Clear Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Worker Status */}
        <div>
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-dark-text flex items-center gap-2">
                <Users className="h-5 w-5" />
                Worker Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workers.map((worker) => (
                <div key={worker.id} className="p-3 bg-dark-bg rounded-lg border border-dark-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-dark-text text-sm">{worker.name}</span>
                    <Badge className={getWorkerStatusColor(worker.status)}>{worker.status}</Badge>
                  </div>
                  <p className="text-xs text-dark-text-secondary">{worker.skill}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Production Tasks Table */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-dark-text flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Production Tasks
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-text-secondary" />
                <Input
                  placeholder="Search tasks..."
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
                <TableHead className="text-dark-text">Task ID</TableHead>
                <TableHead className="text-dark-text">Article</TableHead>
                <TableHead className="text-dark-text">Stage</TableHead>
                <TableHead className="text-dark-text">Worker</TableHead>
                <TableHead className="text-dark-text">Quantity</TableHead>
                <TableHead className="text-dark-text">Timeline</TableHead>
                <TableHead className="text-dark-text">Progress</TableHead>
                <TableHead className="text-dark-text">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionTasks.map((task) => (
                <TableRow key={task.id} className="border-dark-border">
                  <TableCell className="text-dark-text font-medium">{task.id}</TableCell>
                  <TableCell className="text-dark-text-secondary">{task.article}</TableCell>
                  <TableCell className="text-dark-text-secondary">{task.stage}</TableCell>
                  <TableCell className="text-dark-text-secondary">{task.worker}</TableCell>
                  <TableCell className="text-dark-text-secondary">{task.quantity}</TableCell>
                  <TableCell className="text-dark-text-secondary">
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {task.startDate} - {task.endDate}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={task.progress} className="h-2" />
                      <span className="text-xs text-dark-text-secondary">{task.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
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
