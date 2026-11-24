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
        ? 'bg-primary-600/20 text-primary-300 border border-primary-600/40'
        : 'bg-primary-100 text-primary-800 border border-primary-300',
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
        ? 'bg-accent-600/20 text-accent-300 border border-accent-600/40'
        : 'bg-accent-100 text-accent-800 border border-accent-300',
  }

  return (
    <span className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </span>
  )
}
