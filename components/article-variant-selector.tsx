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
      <Label className="text-dark-text">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="bg-dark-bg border-dark-border text-dark-text">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-dark-surface border-dark-border max-h-60">
          {allowEmpty && (
            <SelectItem value="all" className="text-dark-text">
              All article variants
            </SelectItem>
          )}
          {articleVariants.map((variant) => (
            <SelectItem key={variant.id} value={variant.id} className="text-dark-text">
              <div className="flex flex-col gap-1">
                <span className="font-medium">{variant.fullName}</span>
                <div className="flex gap-1 text-xs flex-wrap">
                  <Badge variant="outline" className="border-dark-border text-dark-text-secondary">
                    {variant.articleNumber}
                  </Badge>
                  <Badge variant="outline" className="border-dark-border text-dark-text-secondary">
                    {variant.colorName}
                  </Badge>
                  <Badge variant="outline" className="border-dark-border text-dark-text-secondary">
                    Size {variant.size}
                  </Badge>
                  <Badge variant="outline" className="border-dark-border text-dark-text-secondary">
                    {variant.genderName}
                  </Badge>
                  <Badge variant="outline" className="border-dark-border text-dark-text-secondary">
                    {variant.sideName}
                  </Badge>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedVariant && (
        <div className="mt-2 p-2 bg-dark-bg rounded border border-dark-border">
          <p className="text-sm text-dark-text font-medium">{selectedVariant.displayName}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge variant="secondary" className="bg-dark-accent text-white text-xs">
              {selectedVariant.id}
            </Badge>
            <Badge variant="outline" className="border-dark-border text-dark-text-secondary text-xs">
              ${selectedVariant.price}
            </Badge>
          </div>
        </div>
      )}
    </div>
  )
}
