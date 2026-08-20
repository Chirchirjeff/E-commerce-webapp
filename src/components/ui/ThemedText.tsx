'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'label'
type TextColor = 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'danger'

interface ThemedTextProps {
  children: React.ReactNode
  variant?: TextVariant
  color?: TextColor
  className?: string
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold'
}

export function ThemedText({
  children,
  variant = 'body',
  color = 'default',
  weight = 'normal',
  className,
}: ThemedTextProps) {
  const { theme } = useTheme()

  const variantClasses = {
    h1: 'text-3xl sm:text-4xl font-bold',
    h2: 'text-2xl sm:text-3xl font-bold',
    h3: 'text-xl sm:text-2xl font-semibold',
    h4: 'text-lg font-semibold',
    body: 'text-base',
    small: 'text-sm',
    label: 'text-sm font-medium',
  }

  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }

  const colorClasses = {
    default:
      theme === 'dark' ? 'text-slate-100' : 'text-gray-900',
    muted:
      theme === 'dark' ? 'text-slate-400' : 'text-gray-600',
    primary:
      theme === 'dark' ? 'text-warm-400' : 'text-warm-600',
    success:
      theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600',
    warning:
      theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600',
    danger:
      theme === 'dark' ? 'text-red-400' : 'text-red-600',
  }

  const Component = variant.startsWith('h') ? (variant as any) : 'p'

  return (
    <Component
      className={cn(
        'transition-colors duration-200',
        variantClasses[variant],
        weightClasses[weight],
        colorClasses[color],
        className
      )}
    >
      {children}
    </Component>
  )
}
