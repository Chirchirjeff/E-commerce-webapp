'use client'

import { useRef } from 'react'
import { MarketplaceCategory } from '@/types'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

interface CategoryBarProps {
  categories: MarketplaceCategory[]
  selectedCategoryId?: string
  onSelectCategory: (categoryId: string | undefined) => void
  isLoading?: boolean
}

export function CategoryBar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  isLoading,
}: CategoryBarProps) {
  const { theme } = useTheme()
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDark = theme === 'dark'

  const stripBg = isDark
    ? 'bg-slate-900 border-b border-slate-700'
    : 'bg-white border-b border-gray-200'

  if (isLoading) {
    return (
      <div className={cn('w-full', stripBg)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-3 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-8 rounded-full animate-pulse flex-shrink-0',
                  isDark ? 'bg-slate-700' : 'bg-gray-200',
                  i === 0 ? 'w-24' : 'w-20'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full sticky top-[57px] z-30 shadow-sm', stripBg)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Scrollable pill row */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* All Products pill */}
          <button
            onClick={() => onSelectCategory(undefined)}
            className={cn(
              'flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap',
              !selectedCategoryId
                ? isDark
                  ? 'bg-warm-600 text-white shadow-md shadow-warm-600/30'
                  : 'bg-warm-500 text-white shadow-md shadow-warm-500/20'
                : isDark
                  ? 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            All Products
          </button>

          {/* Divider */}
          {categories.length > 0 && (
            <div className={cn(
              'flex-shrink-0 w-px h-5 mx-1',
              isDark ? 'bg-slate-700' : 'bg-gray-200'
            )} />
          )}

          {/* Category pills */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                'flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border',
                selectedCategoryId === category.id
                  ? isDark
                    ? 'bg-gold-600/20 text-gold-300 border-gold-600/50 shadow-sm'
                    : 'bg-gold-100 text-gold-700 border-gold-300 shadow-sm'
                  : isDark
                    ? 'text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-slate-100 hover:border-slate-600'
                    : 'text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300'
              )}
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM15 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM5 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM15 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
              </svg>
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
