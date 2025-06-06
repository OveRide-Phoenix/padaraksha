"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2, DollarSign, Package, TrendingUp, Factory, ArrowRight, AlertTriangle, LogOut } from "lucide-react"
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
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark-text">{companyData.name}</h1>
            <p className="text-dark-text-secondary mt-1">Company Performance Overview</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-green-500 text-green-400">
              Active Operations
            </Badge>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-dark-border text-dark-text hover:bg-dark-surface"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-dark-surface border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-text-secondary">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(companyData.totalRevenue)}</p>
                  <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />+{companyData.monthlyGrowth}% this month
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-text-secondary">Items Produced</p>
                  <p className="text-2xl font-bold text-blue-400">{formatNumber(companyData.totalItemsProduced)}</p>
                  <p className="text-xs text-dark-text-secondary mt-1">This month</p>
                </div>
                <Package className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-text-secondary">Total Defects</p>
                  <p className="text-2xl font-bold text-red-400">{formatNumber(companyData.totalDefects)}</p>
                  <p className="text-xs text-dark-text-secondary mt-1">Quality issues reported</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-text-secondary">Total Profit</p>
                  <p className="text-2xl font-bold text-yellow-400">{formatCurrency(companyData.totalProfit)}</p>
                  <p className="text-xs text-dark-text-secondary mt-1">Net profit this month</p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Factory Selection */}
        <Card className="bg-dark-surface border-dark-border">
          <CardHeader>
            <CardTitle className="text-dark-text flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Select Factory to Manage
            </CardTitle>
            <CardDescription className="text-dark-text-secondary">
              Choose a factory location to access detailed management tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {factories.map((factory) => (
                <Card
                  key={factory.id}
                  className={`bg-dark-bg border-dark-border cursor-pointer transition-colors hover:border-dark-accent ${
                    selectedFactory === factory.id ? "border-dark-accent bg-dark-accent/10" : ""
                  }`}
                  onClick={() => setSelectedFactory(factory.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Building2 className="h-5 w-5 text-dark-accent" />
                      {selectedFactory === factory.id && <Badge className="bg-dark-accent">Selected</Badge>}
                    </div>
                    <h3 className="font-semibold text-dark-text">{factory.name}</h3>
                    <p className="text-sm text-dark-text-secondary">{factory.location}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="outline" className="border-dark-border text-dark-text-secondary text-xs">
                        {factory.currentProduction}/{factory.capacity}
                      </Badge>
                      <Badge variant="outline" className="border-dark-border text-dark-text-secondary text-xs">
                        {factory.efficiency}% eff
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Select value={selectedFactory} onValueChange={setSelectedFactory}>
                <SelectTrigger className="w-64 bg-dark-bg border-dark-border text-dark-text">
                  <SelectValue placeholder="Or select from dropdown" />
                </SelectTrigger>
                <SelectContent className="bg-dark-surface border-dark-border">
                  {factories.map((factory) => (
                    <SelectItem key={factory.id} value={factory.id} className="text-dark-text">
                      {factory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleFactorySelect}
                disabled={!selectedFactory}
                className="bg-dark-accent hover:bg-dark-accent-hover"
              >
                Access Factory Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Factory Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-dark-text">Production Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {factories.map((factory) => (
                <div key={factory.id} className="flex justify-between">
                  <span className="text-dark-text-secondary">{factory.location}</span>
                  <span className="text-dark-text">{factory.currentProduction} units</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-dark-text">Quality Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Pass Rate</span>
                <span className="text-green-400">94.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Rework Rate</span>
                <span className="text-yellow-400">4.1%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Rejection Rate</span>
                <span className="text-red-400">1.7%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-dark-text">Workforce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Total Workers</span>
                <span className="text-dark-text">247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Active Today</span>
                <span className="text-green-400">231</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">On Leave</span>
                <span className="text-yellow-400">16</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
