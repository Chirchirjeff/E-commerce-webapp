'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import { ThemedText } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ShopLayoutHeaderProps {
  shopName: string
  productCount?: number
  categoryCount?: number
}

export function ShopLayoutHeader({
  shopName,
  productCount = 0,
  categoryCount = 0,
}: ShopLayoutHeaderProps) {
  const { theme } = useTheme()

  const bgClass =
    theme === 'dark'
      ? 'bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 border-b border-slate-700'
      : 'bg-gradient-to-r from-warm-50 via-white to-gold-50 border-b border-warm-200'

  return (
    <div className={cn(
      'sticky top-0 z-40 transition-all duration-200 shadow-sm',
      bgClass
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section: Shop Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white',
                theme === 'dark'
                  ? 'bg-gradient-to-br from-warm-600 to-gold-600'
                  : 'bg-gradient-to-br from-warm-400 to-gold-500'
              )}>
                {shopName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <ThemedText
                  variant="h4"
                  className="truncate"
                >
                  {shopName}
                </ThemedText>
                <div className="flex flex-wrap gap-3 text-xs mt-1">
                  {productCount > 0 && (
                    <span className={cn(
                      'font-medium',
                      theme === 'dark'
                        ? 'text-slate-400'
                        : 'text-gray-600'
                    )}>
                      {productCount} Product{productCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {categoryCount > 0 && (
                    <>
                      <span className={theme === 'dark' ? 'text-slate-600' : 'text-gray-400'}>•</span>
                      <span className={cn(
                        'font-medium',
                        theme === 'dark'
                          ? 'text-slate-400'
                          : 'text-gray-600'
                      )}>
                        {categoryCount} Categor{categoryCount !== 1 ? 'ies' : 'y'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}
