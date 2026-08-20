'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

interface ThemedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
}

export function ThemedInput({
  label,
  error,
  helperText,
  icon,
  className,
  ...props
}: ThemedInputProps) {
  const { theme } = useTheme()

  const inputBaseClasses =
    theme === 'dark'
      ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-warm-500 focus:ring-warm-500/20'
      : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-warm-400 focus:ring-warm-400/20'

  return (
    <div className="w-full">
      {label && (
        <label
          className={cn(
            'block text-sm font-medium mb-2',
            theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        <input
          className={cn(
            'w-full px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2',
            icon && 'pl-10',
            inputBaseClasses,
            error && (theme === 'dark' ? 'border-red-500 focus:border-red-500' : 'border-red-300 focus:border-red-400'),
            className
          )}
          {...props}
        />
      </div>

      {error && (
        <p className={cn('mt-1 text-sm', theme === 'dark' ? 'text-red-400' : 'text-red-600')}>
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className={cn('mt-1 text-sm', theme === 'dark' ? 'text-slate-400' : 'text-gray-500')}>
          {helperText}
        </p>
      )}
    </div>
  )
}
