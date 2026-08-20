'use client'

import { MarketplaceCategory } from '@/types'
import { useTheme } from '@/context/ThemeContext'
import { ThemedSkeleton, ThemedText } from '@/components/ui'
import { cn } from '@/lib/utils'

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
  const { theme } = useTheme()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <ThemedSkeleton key={i} variant="default" className="h-8" />
        ))}
      </div>
    )
  }

  const buttonBaseClasses = 'w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 font-medium'

  const allProductsActiveClasses =
    theme === 'dark'
      ? 'bg-warm-600 text-white shadow-lg shadow-warm-600/30'
      : 'bg-warm-500 text-white shadow-md shadow-warm-500/20'

  const allProductsInactiveClasses =
    theme === 'dark'
      ? 'text-slate-300 hover:bg-slate-700'
      : 'text-gray-700 hover:bg-gray-100'

  const categoryActiveClasses =
    theme === 'dark'
      ? 'bg-gold-600/20 text-gold-400 border border-gold-600/40'
      : 'bg-gold-100 text-gold-700 border border-gold-300'

  const categoryInactiveClasses =
    theme === 'dark'
      ? 'text-slate-300 hover:bg-slate-700/50'
      : 'text-gray-700 hover:bg-gray-100'

  return (
    <div className="space-y-1">
      {/* All Products option */}
      <button
        onClick={() => onSelectCategory(undefined)}
        className={cn(
          buttonBaseClasses,
          !selectedCategoryId
            ? allProductsActiveClasses
            : allProductsInactiveClasses
        )}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          <span>All Products</span>
        </div>
      </button>

      {/* Categories */}
      {categories.length === 0 ? (
        <div className={cn(
          'p-4 text-center rounded-lg',
          theme === 'dark'
            ? 'bg-slate-800 text-slate-400'
            : 'bg-gray-100 text-gray-600'
        )}>
          <ThemedText variant="small" color="muted">
            No categories available
          </ThemedText>
        </div>
      ) : (
        categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              buttonBaseClasses,
              'border',
              selectedCategoryId === category.id
                ? categoryActiveClasses
                : cn(
                    categoryInactiveClasses,
                    theme === 'dark'
                      ? 'border-slate-700'
                      : 'border-transparent'
                  )
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM15 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM5 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM15 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
              </svg>
              <span className="truncate">{category.name}</span>
            </div>
          </button>
        ))
      )}
    </div>
  )
}
