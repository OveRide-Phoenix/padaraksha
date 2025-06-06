"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, Package } from "lucide-react"
import {
  articleBases,
  articleVariants,
  rawMaterials,
  productionStages,
  colors,
  sizes,
  genders,
  sides,
} from "@/lib/dummy-data"

interface ArticleFormData {
  id?: string
  baseId: string
  baseName: string
  color: string
  size: string
  gender: string
  side: string
  materials: string[]
  stages: string[]
  notes: string
}

export default function ArticlesPage() {
  const [activeTab, setActiveTab] = useState("list")
  const [searchTerm, setSearchTerm] = useState("")
  const [editingArticle, setEditingArticle] = useState<ArticleFormData | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<ArticleFormData>({
    baseId: "",
    baseName: "",
    color: "",
    size: "",
    gender: "",
    side: "",
    materials: [],
    stages: [],
    notes: "",
  })

  const resetForm = () => {
    setFormData({
      baseId: "",
      baseName: "",
      color: "",
      size: "",
      gender: "",
      side: "",
      materials: [],
      stages: [],
      notes: "",
    })
  }

  const handleEdit = (variant: any) => {
    const editData: ArticleFormData = {
      id: variant.id,
      baseId: variant.baseId,
      baseName: variant.baseName,
      color: variant.color,
      size: variant.size,
      gender: variant.gender,
      side: variant.side,
      materials: variant.materials,
      stages: variant.stages,
      notes: "",
    }
    setEditingArticle(editData)
    setFormData(editData)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (variantId: string) => {
    setArticleToDelete(variantId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    console.log("Deleting article:", articleToDelete)
    setIsDeleteDialogOpen(false)
    setArticleToDelete(null)
  }

  const handleSubmit = () => {
    if (editingArticle) {
      console.log("Updating article:", formData)
    } else {
      console.log("Creating article:", formData)
    }
    resetForm()
    setIsEditDialogOpen(false)
    setEditingArticle(null)
    setActiveTab("list")
  }

  const toggleMaterial = (material: string) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.includes(material)
        ? prev.materials.filter((m) => m !== material)
        : [...prev.materials, material],
    }))
  }

  const toggleStage = (stage: string) => {
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.includes(stage) ? prev.stages.filter((s) => s !== stage) : [...prev.stages, stage],
    }))
  }

  const handleBaseChange = (baseId: string) => {
    const base = articleBases.find((b) => b.id === baseId)
    setFormData((prev) => ({
      ...prev,
      baseId,
      baseName: base?.name || "",
    }))
  }

  const filteredVariants = articleVariants.filter(
    (variant) =>
      variant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
      <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
              <div>
                  <h1 className="page-header">Article Management</h1>
                  <p className="text-dark-text-secondary">
                      Create and manage article specifications, materials, and
                      production stages.
                  </p>
              </div>
              <Button
                  onClick={() => setActiveTab("create")}
                  className="bg-dark-accent hover:bg-dark-accent-hover"
              >
                  <Plus className="h-4 w-4 mr-2" />
                  New Article Variant
              </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-dark-surface border-dark-border">
                  <TabsTrigger
                      value="list"
                      className="data-[state=active]:bg-dark-accent"
                  >
                      Article Variants
                  </TabsTrigger>
                  <TabsTrigger
                      value="create"
                      className="data-[state=active]:bg-dark-accent"
                  >
                      Create Variant
                  </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-4">
                  {/* Search */}
                  <div className="flex items-center gap-4">
                      <div className="relative flex-1 max-w-md">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-text-secondary" />
                          <Input
                              placeholder="Search article variants..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10 bg-dark-surface border-dark-border text-dark-text"
                          />
                      </div>
                  </div>

                  {/* Articles Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredVariants.map((variant) => (
                          <Card
                              key={variant.id}
                              className="bg-dark-surface border-dark-border"
                          >
                              <CardHeader>
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                          <Package className="h-5 w-5 text-dark-accent" />
                                          <CardTitle className="text-dark-text">
                                              {variant.id}
                                          </CardTitle>
                                      </div>
                                      <div className="flex gap-2">
                                          <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() =>
                                                  handleEdit(variant)
                                              }
                                              className="text-dark-text-secondary hover:text-dark-text"
                                          >
                                              <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() =>
                                                  handleDelete(variant.id)
                                              }
                                              className="text-red-400 hover:text-red-300"
                                          >
                                              <Trash2 className="h-4 w-4" />
                                          </Button>
                                      </div>
                                  </div>
                                  <CardDescription className="text-dark-text-secondary">
                                      {variant.articleName}
                                  </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                  <div>
                                      <Label className="text-sm text-dark-text-secondary">
                                          Variant Details
                                      </Label>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                          <Badge
                                              variant="secondary"
                                              className="bg-dark-bg text-dark-text"
                                          >
                                              {variant.color}
                                          </Badge>
                                          <Badge
                                              variant="secondary"
                                              className="bg-dark-bg text-dark-text"
                                          >
                                              Size {variant.size}
                                          </Badge>
                                          <Badge
                                              variant="secondary"
                                              className="bg-dark-bg text-dark-text"
                                          >
                                              {variant.gender}
                                          </Badge>
                                          <Badge
                                              variant="secondary"
                                              className="bg-dark-bg text-dark-text"
                                          >
                                              {variant.side}
                                          </Badge>
                                      </div>
                                  </div>
                                  <div>
                                      <Label className="text-sm text-dark-text-secondary">
                                          Materials ({variant.materials.length})
                                      </Label>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                          {variant.materials
                                              .slice(0, 3)
                                              .map((material) => (
                                                  <Badge
                                                      key={material}
                                                      variant="outline"
                                                      className="border-dark-border text-dark-text-secondary"
                                                  >
                                                      {material}
                                                  </Badge>
                                              ))}
                                          {variant.materials.length > 3 && (
                                              <Badge
                                                  variant="outline"
                                                  className="border-dark-border text-dark-text-secondary"
                                              >
                                                  +
                                                  {variant.materials.length - 3}{" "}
                                                  more
                                              </Badge>
                                          )}
                                      </div>
                                  </div>
                                  <div>
                                      <Label className="text-sm text-dark-text-secondary">
                                          Stages ({variant.stages.length})
                                      </Label>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                          {variant.stages
                                              .slice(0, 2)
                                              .map((stage) => (
                                                  <Badge
                                                      key={stage}
                                                      variant="outline"
                                                      className="border-dark-border text-dark-text-secondary"
                                                  >
                                                      {stage}
                                                  </Badge>
                                              ))}
                                          {variant.stages.length > 2 && (
                                              <Badge
                                                  variant="outline"
                                                  className="border-dark-border text-dark-text-secondary"
                                              >
                                                  +{variant.stages.length - 2}{" "}
                                                  more
                                              </Badge>
                                          )}
                                      </div>
                                  </div>
                              </CardContent>
                          </Card>
                      ))}
                  </div>
              </TabsContent>

              <TabsContent value="create" className="space-y-6">
                  <Card className="bg-dark-surface border-dark-border">
                      <CardHeader>
                          <CardTitle className="text-dark-text">
                              Create New Article Variant
                          </CardTitle>
                          <CardDescription className="text-dark-text-secondary">
                              Define article variant specifications, required
                              materials, and production stages.
                          </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                          {/* Basic Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label className="text-dark-text">
                                      Article Base
                                  </Label>
                                  <Select
                                      value={formData.baseId}
                                      onValueChange={handleBaseChange}
                                  >
                                      <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                                          <SelectValue placeholder="Select article base" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-dark-surface border-dark-border">
                                          {articleBases.map((base) => (
                                              <SelectItem
                                                  key={base.id}
                                                  value={base.id}
                                                  className="text-dark-text"
                                              >
                                                  {base.name} ({base.category})
                                              </SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>

                              <div className="space-y-2">
                                  <Label className="text-dark-text">
                                      Color
                                  </Label>
                                  <Select
                                      value={formData.color}
                                      onValueChange={(value) =>
                                          setFormData((prev) => ({
                                              ...prev,
                                              color: value,
                                          }))
                                      }
                                  >
                                      <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                                          <SelectValue placeholder="Select color" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-dark-surface border-dark-border">
                                          {colors.map(
                                              (color: {
                                                  id: string;
                                                  name: string;
                                                  hex: string;
                                              }) => (
                                                  <SelectItem
                                                      key={color.id}
                                                      value={color.id}
                                                      className="text-dark-text"
                                                  >
                                                      {color.name}
                                                  </SelectItem>
                                              )
                                          )}
                                      </SelectContent>
                                  </Select>
                              </div>

                              <div className="space-y-2">
                                  <Label className="text-dark-text">Size</Label>
                                  <Select
                                      value={formData.size}
                                      onValueChange={(value) =>
                                          setFormData((prev) => ({
                                              ...prev,
                                              size: value,
                                          }))
                                      }
                                  >
                                      <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                                          <SelectValue placeholder="Select size" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-dark-surface border-dark-border">
                                          {sizes.map((size) => (
                                              <SelectItem
                                                  key={size}
                                                  value={size}
                                                  className="text-dark-text"
                                              >
                                                  {size}
                                              </SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>

                              <div className="space-y-2">
                                  <Label className="text-dark-text">
                                      Gender
                                  </Label>
                                  <Select
                                      value={formData.gender}
                                      onValueChange={(value) =>
                                          setFormData((prev) => ({
                                              ...prev,
                                              gender: value,
                                          }))
                                      }
                                  >
                                      <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                                          <SelectValue placeholder="Select gender" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-dark-surface border-dark-border">
                                      {genders.map((gender) => (
  <SelectItem
    key={gender.id}
    value={gender.id}
    className="text-dark-text"
  >
    {gender.name}
  </SelectItem>
))}

                                      </SelectContent>
                                  </Select>
                              </div>

                              <div className="space-y-2">
                                  <Label className="text-dark-text">Side</Label>
                                  <Select
                                      value={formData.side}
                                      onValueChange={(value) =>
                                          setFormData((prev) => ({
                                              ...prev,
                                              side: value,
                                          }))
                                      }
                                  >
                                      <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                                          <SelectValue placeholder="Select side" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-dark-surface border-dark-border">
                                      {sides.map((side) => (
  <SelectItem
    key={side.id}
    value={side.id}
    className="text-dark-text"
  >
    {side.name}
  </SelectItem>
))}

                                      </SelectContent>
                                  </Select>
                              </div>
                          </div>

                          {/* Raw Materials */}
                          <div className="space-y-4">
                              <Label className="text-dark-text">
                                  Required Raw Materials
                              </Label>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {rawMaterials.map((material) => (
                                      <Button
                                          key={material}
                                          variant={
                                              formData.materials.includes(
                                                  material
                                              )
                                                  ? "default"
                                                  : "outline"
                                          }
                                          size="sm"
                                          onClick={() =>
                                              toggleMaterial(material)
                                          }
                                          className={
                                              formData.materials.includes(
                                                  material
                                              )
                                                  ? "bg-dark-accent hover:bg-dark-accent-hover"
                                                  : "border-dark-border text-dark-text hover:bg-dark-accent hover:border-dark-accent"
                                          }
                                      >
                                          {material}
                                      </Button>
                                  ))}
                              </div>
                              {formData.materials.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                      {formData.materials.map((material) => (
                                          <Badge
                                              key={material}
                                              variant="secondary"
                                              className="bg-dark-accent text-white"
                                          >
                                              {material}
                                              <button
                                                  onClick={() =>
                                                      toggleMaterial(material)
                                                  }
                                                  className="ml-1 hover:text-red-300"
                                              >
                                                  ×
                                              </button>
                                          </Badge>
                                      ))}
                                  </div>
                              )}
                          </div>

                          {/* Work Stages */}
                          <div className="space-y-4">
                              <Label className="text-dark-text">
                                  Production Work Stages
                              </Label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {productionStages.map((stage) => (
                                      <Button
                                          key={stage}
                                          variant={
                                              formData.stages.includes(stage)
                                                  ? "default"
                                                  : "outline"
                                          }
                                          size="sm"
                                          onClick={() => toggleStage(stage)}
                                          className={
                                              formData.stages.includes(stage)
                                                  ? "bg-dark-accent hover:bg-dark-accent-hover"
                                                  : "border-dark-border text-dark-text hover:bg-dark-accent hover:border-dark-accent"
                                          }
                                      >
                                          {stage}
                                      </Button>
                                  ))}
                              </div>
                              {formData.stages.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                      {formData.stages.map((stage) => (
                                          <Badge
                                              key={stage}
                                              variant="secondary"
                                              className="bg-dark-accent text-white"
                                          >
                                              {stage}
                                              <button
                                                  onClick={() =>
                                                      toggleStage(stage)
                                                  }
                                                  className="ml-1 hover:text-red-300"
                                              >
                                                  ×
                                              </button>
                                          </Badge>
                                      ))}
                                  </div>
                              )}
                          </div>

                          {/* Notes */}
                          <div className="space-y-2">
                              <Label className="text-dark-text">
                                  Additional Notes
                              </Label>
                              <Textarea
                                  placeholder="Any special instructions or notes for this article variant..."
                                  value={formData.notes}
                                  onChange={(e) =>
                                      setFormData((prev) => ({
                                          ...prev,
                                          notes: e.target.value,
                                      }))
                                  }
                                  className="bg-dark-bg border-dark-border text-dark-text"
                                  rows={3}
                              />
                          </div>

                          {/* Actions */}
                          <div className="flex gap-4 pt-4">
                              <Button
                                  onClick={handleSubmit}
                                  className="bg-dark-accent hover:bg-dark-accent-hover"
                              >
                                  Create Article Variant
                              </Button>
                              <Button
                                  variant="outline"
                                  onClick={() => {
                                      resetForm();
                                      setActiveTab("list");
                                  }}
                                  className="border-dark-border text-dark-text hover:bg-dark-surface"
                              >
                                  Cancel
                              </Button>
                          </div>
                      </CardContent>
                  </Card>
              </TabsContent>
          </Tabs>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="bg-dark-surface border-dark-border max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                      <DialogTitle className="text-dark-text">
                          Edit Article Variant
                      </DialogTitle>
                      <DialogDescription className="text-dark-text-secondary">
                          Modify the article variant specifications and
                          settings.
                      </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                      {/* Same form content as create tab */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label className="text-dark-text">
                                  Article Base
                              </Label>
                              <Select
                                  value={formData.baseId}
                                  onValueChange={handleBaseChange}
                              >
                                  <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                                      <SelectValue placeholder="Select article base" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-dark-surface border-dark-border">
                                      {articleBases.map((base) => (
                                          <SelectItem
                                              key={base.id}
                                              value={base.id}
                                              className="text-dark-text"
                                          >
                                              {base.name} ({base.category})
                                          </SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>

                          <div className="space-y-2">
                              <Label className="text-dark-text">Color</Label>
                              <Select
                                  value={formData.color}
                                  onValueChange={(value) =>
                                      setFormData((prev) => ({
                                          ...prev,
                                          color: value,
                                      }))
                                  }
                              >
                                  <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                                      <SelectValue placeholder="Select color" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-dark-surface border-dark-border">
                                  {colors.map((color) => (
  <SelectItem
    key={color.id}
    value={color.id}
    className="text-dark-text"
  >
    {color.name}
  </SelectItem>
))}

                                  </SelectContent>
                              </Select>
                          </div>

                          <div className="space-y-2">
                              <Label className="text-dark-text">Size</Label>
                              <Select
                                  value={formData.size}
                                  onValueChange={(value) =>
                                      setFormData((prev) => ({
                                          ...prev,
                                          size: value,
                                      }))
                                  }
                              >
                                  <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                                      <SelectValue placeholder="Select size" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-dark-surface border-dark-border">
                                      {sizes.map((size) => (
                                          <SelectItem
                                              key={size}
                                              value={size}
                                              className="text-dark-text"
                                          >
                                              {size}
                                          </SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>

                          <div className="space-y-2">
                              <Label className="text-dark-text">Gender</Label>
                              <Select
                                  value={formData.gender}
                                  onValueChange={(value) =>
                                      setFormData((prev) => ({
                                          ...prev,
                                          gender: value,
                                      }))
                                  }
                              >
                                  <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                                      <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-dark-surface border-dark-border">
                                  {genders.map((gender) => (
  <SelectItem
    key={gender.id}
    value={gender.id}
    className="text-dark-text"
  >
    {gender.name}
  </SelectItem>
))}

                                  </SelectContent>
                              </Select>
                          </div>

                          <div className="space-y-2">
                              <Label className="text-dark-text">Side</Label>
                              <Select
                                  value={formData.side}
                                  onValueChange={(value) =>
                                      setFormData((prev) => ({
                                          ...prev,
                                          side: value,
                                      }))
                                  }
                              >
                                  <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
                                      <SelectValue placeholder="Select side" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-dark-surface border-dark-border">
                                  {sides.map((side) => (
  <SelectItem
    key={side.id}
    value={side.id}
    className="text-dark-text"
  >
    {side.name}
  </SelectItem>
))}

                                  </SelectContent>
                              </Select>
                          </div>
                      </div>

                      {/* Materials and Stages sections (same as create form) */}
                      <div className="space-y-4">
                          <Label className="text-dark-text">
                              Required Raw Materials
                          </Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {rawMaterials.map((material) => (
                                  <Button
                                      key={material}
                                      variant={
                                          formData.materials.includes(material)
                                              ? "default"
                                              : "outline"
                                      }
                                      size="sm"
                                      onClick={() => toggleMaterial(material)}
                                      className={
                                          formData.materials.includes(material)
                                              ? "bg-dark-accent hover:bg-dark-accent-hover"
                                              : "border-dark-border text-dark-text hover:bg-dark-accent hover:border-dark-accent"
                                      }
                                  >
                                      {material}
                                  </Button>
                              ))}
                          </div>
                      </div>

                      <div className="space-y-4">
                          <Label className="text-dark-text">
                              Production Work Stages
                          </Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {productionStages.map((stage) => (
                                  <Button
                                      key={stage}
                                      variant={
                                          formData.stages.includes(stage)
                                              ? "default"
                                              : "outline"
                                      }
                                      size="sm"
                                      onClick={() => toggleStage(stage)}
                                      className={
                                          formData.stages.includes(stage)
                                              ? "bg-dark-accent hover:bg-dark-accent-hover"
                                              : "border-dark-border text-dark-text hover:bg-dark-accent hover:border-dark-accent"
                                      }
                                  >
                                      {stage}
                                  </Button>
                              ))}
                          </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                          <Button
                              onClick={handleSubmit}
                              className="bg-dark-accent hover:bg-dark-accent-hover"
                          >
                              Update Article Variant
                          </Button>
                          <Button
                              variant="outline"
                              onClick={() => {
                                  setIsEditDialogOpen(false);
                                  setEditingArticle(null);
                                  resetForm();
                              }}
                              className="border-dark-border text-dark-text hover:bg-dark-surface"
                          >
                              Cancel
                          </Button>
                      </div>
                  </div>
              </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
          >
              <DialogContent className="bg-dark-surface border-dark-border">
                  <DialogHeader>
                      <DialogTitle className="text-dark-text">
                          Delete Article Variant
                      </DialogTitle>
                      <DialogDescription className="text-dark-text-secondary">
                          Are you sure you want to delete this article variant?
                          This action cannot be undone.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-4 pt-4">
                      <Button onClick={confirmDelete} variant="destructive">
                          Delete
                      </Button>
                      <Button
                          variant="outline"
                          onClick={() => setIsDeleteDialogOpen(false)}
                          className="border-dark-border text-dark-text hover:bg-dark-surface"
                      >
                          Cancel
                      </Button>
                  </div>
              </DialogContent>
          </Dialog>
      </div>
  );
}
