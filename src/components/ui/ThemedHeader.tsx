'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'
import { ThemedButton } from './ThemedButton'

interface ThemedHeaderProps {
  title?: string
  subtitle?: string
  showThemeToggle?: boolean
  actionButton?: {
    label: string
    onClick: () => void
  }
  children?: React.ReactNode
  className?: string
}

export function ThemedHeader({
  title,
  subtitle,
  showThemeToggle = true,
  actionButton,
  children,
  className,
}: ThemedHeaderProps) {
  const { theme, toggleTheme } = useTheme()

  const bgClass =
    theme === 'dark'
      ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700'
      : 'bg-gradient-to-r from-warm-50 to-gold-50 border-b border-warm-200'

  const textClass =
    theme === 'dark' ? 'text-white' : 'text-slate-900'

  return (
    <header
      className={cn(
        'sticky top-0 z-50 shadow-sm transition-all duration-200',
        bgClass,
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section: Title and Subtitle */}
          <div className="flex-1 min-w-0">
            {title && (
              <h1
                className={cn(
                  'text-2xl sm:text-3xl font-bold truncate',
                  textClass
                )}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p
                className={cn(
                  'mt-1 text-sm truncate',
                  theme === 'dark'
                    ? 'text-slate-400'
                    : 'text-gray-600'
                )}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Center Section: Custom Children */}
          {children && (
            <div className="hidden sm:block flex-1">
              {children}
            </div>
          )}

          {/* Right Section: Actions */}
          <div className="flex items-center gap-2">
            {actionButton && (
              <ThemedButton
                variant="primary"
                size="sm"
                onClick={actionButton.onClick}
              >
                {actionButton.label}
              </ThemedButton>
            )}

            {showThemeToggle && (
              <button
                onClick={toggleTheme}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  theme === 'dark'
                    ? 'bg-slate-700 hover:bg-slate-600 text-gold-400'
                    : 'bg-warm-200 hover:bg-warm-300 text-warm-700'
                )}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.828-2.828a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm.707 5.657a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707zM9 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.536-2.464a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 011.414-1.414l.707.707z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
