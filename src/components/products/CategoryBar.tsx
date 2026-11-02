'use client'

import { LayoutGrid } from 'lucide-react'
import { MarketplaceCategory } from '@/types'
import { cn } from '@/lib/utils'

interface CategoryBarProps {
  categories: MarketplaceCategory[]
  selectedCategoryId?: string
  onSelectCategory: (categoryId: string | undefined) => void
  isLoading?: boolean
}

const pillBase =
  'flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200'

const pillActive =
  'bg-gray-900 text-white shadow-md shadow-gray-900/20 dark:bg-white dark:text-slate-900 dark:shadow-black/30'

const pillIdle =
  'bg-white text-gray-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:bg-slate-800/70 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700 dark:hover:text-white'

/**
 * Horizontally scrollable category chips. Stickiness is handled by the page's
 * toolbar so the search and categories stay pinned together.
 */
export function CategoryBar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  isLoading,
}: CategoryBarProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 overflow-hidden py-1">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-9 flex-shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-slate-800',
              i === 0 ? 'w-20' : 'w-28'
            )}
          />
        ))}
      </div>
    )
  }

  if (categories.length === 0) return null

  return (
    <div
      className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <button
        onClick={() => onSelectCategory(undefined)}
        className={cn(pillBase, !selectedCategoryId ? pillActive : pillIdle)}
        aria-pressed={!selectedCategoryId}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden="true" />
        All
      </button>

      {categories.map((category) => {
        const active = selectedCategoryId === category.id
        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(pillBase, active ? pillActive : pillIdle)}
            aria-pressed={active}
          >
            {category.name}
          </button>
        )
      })}
    </div>
  )
}
