"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { articleVariants } from "@/lib/dummy-data"

interface ArticleVariantSelectorProps {
  value?: string
  onValueChange?: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
  allowEmpty?: boolean
}

export function ArticleVariantSelector({
  value,
  onValueChange,
  label = "Article Variant",
  placeholder = "Select article variant",
  className,
  allowEmpty = false,
}: ArticleVariantSelectorProps) {
  const selectedVariant = articleVariants.find((v) => v.id === value)

  return (
    <div className={className}>
      <Label className="text-card-foreground">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="bg-background border-border text-foreground">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border max-h-60">
          {allowEmpty && (
            <SelectItem value="all" className="text-popover-foreground">
              All article variants
            </SelectItem>
          )}
          {articleVariants.map((variant) => (
            <SelectItem key={variant.id} value={variant.id} className="text-popover-foreground">
              <div className="flex flex-col gap-1">
                <span className="font-medium">{variant.fullName}</span>
                <div className="flex gap-1 text-xs flex-wrap">
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {variant.articleNumber}
                  </Badge>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {variant.colorName}
                  </Badge>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    Size {variant.size}
                  </Badge>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {variant.genderName}
                  </Badge>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {variant.sideName}
                  </Badge>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedVariant && (
        <div className="mt-2 p-2 bg-background rounded border border-border">
          <p className="text-sm text-card-foreground font-medium">{selectedVariant.displayName}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs">
              {selectedVariant.id}
            </Badge>
            <Badge variant="outline" className="border-border text-muted-foreground text-xs">
              ${selectedVariant.price}
            </Badge>
          </div>
        </div>
      )}
    </div>
  )
}
