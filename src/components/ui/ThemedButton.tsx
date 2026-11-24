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
        ? 'bg-primary-700 text-white hover:bg-primary-600 active:bg-primary-700 shadow-lg shadow-primary-600/30'
        : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-700 shadow-md shadow-primary-500/30',
    secondary:
      theme === 'dark'
        ? 'bg-slate-700 text-white hover:bg-slate-600 active:bg-slate-800'
        : 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
    outline:
      theme === 'dark'
        ? 'border-2 border-accent-600 text-accent-400 hover:bg-accent-600/10 active:bg-accent-600/20'
        : 'border-2 border-accent-400 text-accent-600 hover:bg-accent-50 active:bg-accent-100',
    ghost:
      theme === 'dark'
        ? 'text-primary-400 hover:bg-primary-600/20 active:bg-primary-600/30'
        : 'text-primary-600 hover:bg-primary-100 active:bg-primary-200',
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
