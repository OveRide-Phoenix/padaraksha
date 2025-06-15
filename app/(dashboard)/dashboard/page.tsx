"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Package,
  ArrowDownToLine,
  Activity,
  CheckCircle,
  ArrowUpFromLine,
  AlertTriangle,
  Users,
  FileText,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowLeft,
} from "lucide-react"
import { factories } from "@/lib/dummy-data"

const modules = [
  {
    title: "Article Management",
    description: "Create and manage article specifications",
    icon: Package,
    href: "/articles",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    title: "Inward Entry",
    description: "Log incoming raw materials and supplies",
    icon: ArrowDownToLine,
    href: "/inward",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  {
    title: "Production Tracking",
    description: "Monitor production progress and worker assignments",
    icon: Activity,
    href: "/production",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  {
    title: "Internal Quality Check",
    description: "Review and approve completed items",
    icon: CheckCircle,
    href: "/quality-check",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    title: "Outward Delivery",
    description: "Track deliveries and returns",
    icon: ArrowUpFromLine,
    href: "/outward",
    color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
  {
    title: "Provider Company QC",
    description: "Handle provider quality issues",
    icon: AlertTriangle,
    href: "/provider-qc",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  {
    title: "Employee & Payroll",
    description: "Manage workers and payroll calculations",
    icon: Users,
    href: "/payroll",
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
  {
    title: "Reports",
    description: "Generate and export detailed reports",
    icon: FileText,
    href: "/reports",
    color: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
]

const stats = [
  {
    title: "Active Production",
    value: "24",
    description: "Articles in production",
    icon: Activity,
    trend: "+12%",
  },
  {
    title: "Pending QC",
    value: "8",
    description: "Items awaiting quality check",
    icon: Clock,
    trend: "-5%",
  },
  {
    title: "Quality Issues",
    value: "3",
    description: "Items requiring attention",
    icon: AlertCircle,
    trend: "+2",
  },
  {
    title: "Completed Today",
    value: "156",
    description: "Finished articles",
    icon: TrendingUp,
    trend: "+8%",
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [selectedFactory, setSelectedFactory] = useState<any>(null)

  useEffect(() => {
    const factoryId = localStorage.getItem("selectedFactory")
    if (!factoryId) {
      router.push("/company-dashboard")
      return
    }

    const factory = factories.find((f) => f.id === factoryId)
    setSelectedFactory(factory)
  }, [router])

  if (!selectedFactory) {
    return <div className="p-6 text-foreground">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/company-dashboard")}
              className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Company View
            </Button>
          </div>
          <h1 className="page-header">{selectedFactory.name}</h1>
          <p className="text-muted-foreground">Factory Dashboard - Monitor operations and access key modules</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border theme-transition">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                  <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                  <p className="text-xs text-green-400">{stat.trend} from yesterday</p>
                </div>
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Module Cards */}
      <div>
        <h2 className="section-title">System Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((module) => (
            <Card
              key={module.title}
              className="bg-card border-border hover:border-primary transition-colors theme-transition"
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${module.color} border`}>
                  <module.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg text-card-foreground">{module.title}</CardTitle>
                <CardDescription className="text-muted-foreground">{module.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href={module.href}>Access Module</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
