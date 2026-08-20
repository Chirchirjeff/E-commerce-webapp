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
        ? 'bg-slate-900 border border-slate-700 hover:border-warm-500/50'
        : 'bg-white border border-gray-200 hover:border-warm-400',
    elevated:
      theme === 'dark'
        ? 'bg-slate-800 border border-slate-700 shadow-lg hover:shadow-xl hover:shadow-warm-500/20'
        : 'bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:shadow-warm-400/20',
    outlined:
      theme === 'dark'
        ? 'bg-transparent border-2 border-gold-600 hover:bg-gold-600/10'
        : 'bg-transparent border-2 border-gold-400 hover:bg-gold-50',
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
