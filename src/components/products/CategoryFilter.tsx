'use client'

import { MarketplaceCategory } from '@/types'

interface CategoryFilterProps {
  categories: MarketplaceCategory[]
  selectedCategoryId?: string
  onSelectCategory: (categoryId: string | undefined) => void
  isLoading?: boolean
}

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategory,
  isLoading,
}: CategoryFilterProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* All Categories option */}
      <button
        onClick={() => onSelectCategory(undefined)}
        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
          !selectedCategoryId
            ? 'bg-primary-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        All Products
      </button>

      {/* Categories */}
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            selectedCategoryId === category.id
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{category.name}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
