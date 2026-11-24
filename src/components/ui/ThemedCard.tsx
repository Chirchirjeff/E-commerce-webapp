'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

interface ThemedCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'outlined'
  onClick?: () => void
}

export function ThemedCard({
  children,
  className,
  variant = 'default',
  onClick,
}: ThemedCardProps) {
  const { theme } = useTheme()

  const baseClasses =
    'rounded-lg transition-all duration-200 ease-out'

  const variantClasses = {
    default:
      theme === 'dark'
        ? 'bg-slate-900 border border-slate-700 hover:border-primary-500/50'
        : 'bg-white border border-gray-200 hover:border-primary-400',
    elevated:
      theme === 'dark'
        ? 'bg-slate-800 border border-slate-700 shadow-lg hover:shadow-xl hover:shadow-primary-500/20'
        : 'bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:shadow-primary-400/20',
    outlined:
      theme === 'dark'
        ? 'bg-transparent border-2 border-accent-600 hover:bg-accent-600/10'
        : 'bg-transparent border-2 border-accent-400 hover:bg-accent-50',
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
