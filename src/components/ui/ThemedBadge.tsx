'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'gold'

interface ThemedBadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function ThemedBadge({
  children,
  variant = 'primary',
  className,
}: ThemedBadgeProps) {
  const { theme } = useTheme()

  const baseClasses = 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors'

  const variantClasses = {
    primary:
      theme === 'dark'
        ? 'bg-warm-600/20 text-warm-300 border border-warm-600/40'
        : 'bg-warm-100 text-warm-800 border border-warm-300',
    success:
      theme === 'dark'
        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/40'
        : 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    warning:
      theme === 'dark'
        ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/40'
        : 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    danger:
      theme === 'dark'
        ? 'bg-red-600/20 text-red-300 border border-red-600/40'
        : 'bg-red-100 text-red-800 border border-red-300',
    gold:
      theme === 'dark'
        ? 'bg-gold-600/20 text-gold-300 border border-gold-600/40'
        : 'bg-gold-100 text-gold-800 border border-gold-300',
  }

  return (
    <span className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </span>
  )
}
