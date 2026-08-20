'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ThemedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
  isLoading?: boolean
}

export function ThemedButton({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  isLoading,
  children,
  ...props
}: ThemedButtonProps) {
  const { theme } = useTheme()

  const baseClasses =
    'font-medium transition-all duration-200 ease-out rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const variantClasses = {
    primary:
      theme === 'dark'
        ? 'bg-warm-600 text-white hover:bg-warm-500 active:bg-warm-700 shadow-lg shadow-warm-600/30'
        : 'bg-warm-500 text-white hover:bg-warm-600 active:bg-warm-700 shadow-md shadow-warm-500/30',
    secondary:
      theme === 'dark'
        ? 'bg-slate-700 text-white hover:bg-slate-600 active:bg-slate-800'
        : 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
    outline:
      theme === 'dark'
        ? 'border-2 border-gold-600 text-gold-400 hover:bg-gold-600/10 active:bg-gold-600/20'
        : 'border-2 border-gold-400 text-gold-600 hover:bg-gold-50 active:bg-gold-100',
    ghost:
      theme === 'dark'
        ? 'text-warm-400 hover:bg-warm-600/20 active:bg-warm-600/30'
        : 'text-warm-600 hover:bg-warm-100 active:bg-warm-200',
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}
