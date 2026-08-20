'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import { ThemedText, ThemedButton } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ShopLayoutHeaderProps {
  shopName: string
  productCount?: number
  categoryCount?: number
  onThemeToggle?: () => void
  showActions?: boolean
}

export function ShopLayoutHeader({
  shopName,
  productCount = 0,
  categoryCount = 0,
  onThemeToggle,
  showActions = true,
}: ShopLayoutHeaderProps) {
  const { theme, toggleTheme } = useTheme()

  const bgClass =
    theme === 'dark'
      ? 'bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 border-b border-slate-700'
      : 'bg-gradient-to-r from-warm-50 via-white to-gold-50 border-b border-warm-200'

  const handleThemeToggle = () => {
    if (onThemeToggle) {
      onThemeToggle()
    } else {
      toggleTheme()
    }
  }

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

          {/* Right Section: Actions */}
          {showActions && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleThemeToggle}
                className={cn(
                  'p-2 rounded-lg transition-colors duration-200',
                  theme === 'dark'
                    ? 'bg-slate-700 hover:bg-slate-600 text-gold-400'
                    : 'bg-warm-200 hover:bg-warm-300 text-warm-700'
                )}
                aria-label="Toggle theme"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.828-2.828a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM13 11a1 1 0 110 2h-1a1 1 0 110-2h1zm4-4a1 1 0 01-2 0v-1a1 1 0 012 0v1zM9 20a1 1 0 011-1v-1a1 1 0 11-2 0v1a1 1 0 011 1zm-4-4a1 1 0 110 2H4a1 1 0 110-2h1zm-2-8a1 1 0 00-2 0v1a1 1 0 002 0V4zm0 12a1 1 0 110-2h-1a1 1 0 110 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
