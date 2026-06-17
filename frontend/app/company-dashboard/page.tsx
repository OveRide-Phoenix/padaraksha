"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2, DollarSign, Package, TrendingUp, Factory, ArrowRight, AlertTriangle, LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { companyData, factories } from "@/lib/dummy-data"

export default function CompanyDashboardPage() {
  const [selectedFactory, setSelectedFactory] = useState("")
  const router = useRouter()

  const handleFactorySelect = () => {
    if (!selectedFactory) return

    // Store selected factory and navigate to factory dashboard
    localStorage.setItem("selectedFactory", selectedFactory)
    router.push("/dashboard")
  }

  const handleLogout = () => {
    localStorage.removeItem("selectedFactory")
    router.push("/")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{companyData.name}</h1>
            <p className="text-muted-foreground mt-1">Company Performance Overview</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-green-500 text-green-400">
              Active Operations
            </Badge>
            <Button variant="outline" onClick={handleLogout} className="border-border text-foreground hover:bg-accent">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(companyData.totalRevenue)}</p>
                  <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />+{companyData.monthlyGrowth}% this month
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Items Produced</p>
                  <p className="text-2xl font-bold text-blue-400">{formatNumber(companyData.totalItemsProduced)}</p>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </div>
                <Package className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Defects</p>
                  <p className="text-2xl font-bold text-red-400">{formatNumber(companyData.totalDefects)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Quality issues reported</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  <p className="text-2xl font-bold text-yellow-400">{formatCurrency(companyData.totalProfit)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Net profit this month</p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Factory Selection */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Select Factory to Manage
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Choose a factory location to access detailed management tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {factories.map((factory) => (
                <Card
                  key={factory.id}
                  className={`bg-background border-border cursor-pointer transition-colors hover:border-primary ${
                    selectedFactory === factory.id ? "border-primary bg-primary/10" : ""
                  }`}
                  onClick={() => setSelectedFactory(factory.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {selectedFactory === factory.id && <Badge className="bg-primary">Selected</Badge>}
                    </div>
                    <h3 className="font-semibold text-card-foreground">{factory.name}</h3>
                    <p className="text-sm text-muted-foreground">{factory.location}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                        {factory.currentProduction}/{factory.capacity}
                      </Badge>
                      <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                        {factory.efficiency}% eff
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Select value={selectedFactory} onValueChange={setSelectedFactory}>
                <SelectTrigger className="w-64 bg-background border-border text-foreground">
                  <SelectValue placeholder="Or select from dropdown" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {factories.map((factory) => (
                    <SelectItem key={factory.id} value={factory.id} className="text-popover-foreground">
                      {factory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleFactorySelect}
                disabled={!selectedFactory}
                className="bg-primary hover:bg-primary/90"
              >
                Access Factory Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Factory Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Production Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {factories.map((factory) => (
                <div key={factory.id} className="flex justify-between">
                  <span className="text-muted-foreground">{factory.location}</span>
                  <span className="text-card-foreground">{factory.currentProduction} units</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Quality Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pass Rate</span>
                <span className="text-green-400">94.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rework Rate</span>
                <span className="text-yellow-400">4.1%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rejection Rate</span>
                <span className="text-red-400">1.7%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Workforce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Workers</span>
                <span className="text-card-foreground">247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Today</span>
                <span className="text-green-400">231</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">On Leave</span>
                <span className="text-yellow-400">16</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
