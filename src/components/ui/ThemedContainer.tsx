'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

interface ThemedContainerProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'surface' | 'sidebar'
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export function ThemedContainer({
  children,
  className,
  variant = 'default',
  padding = 'md',
}: ThemedContainerProps) {
  const { theme } = useTheme()

  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    none: 'p-0',
  }

  const variantClasses = {
    default:
      theme === 'dark'
        ? 'bg-slate-900'
        : 'bg-white',
    surface:
      theme === 'dark'
        ? 'bg-slate-800 border border-slate-700'
        : 'bg-gray-50 border border-gray-200',
    sidebar:
      theme === 'dark'
        ? 'bg-slate-800 border-r border-slate-700'
        : 'bg-white border-r border-gray-200',
  }

  return (
    <div
      className={cn(
        'transition-colors duration-200',
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  )
}
