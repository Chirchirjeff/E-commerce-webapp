'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

interface ThemedSkeletonProps {
  className?: string
  variant?: 'default' | 'circle' | 'text'
  count?: number
}

export function ThemedSkeleton({
  className,
  variant = 'default',
  count = 1,
}: ThemedSkeletonProps) {
  const { theme } = useTheme()

  const baseClasses =
    theme === 'dark'
      ? 'bg-gradient-to-r from-slate-800 to-slate-700 animate-pulse'
      : 'bg-gradient-to-r from-gray-200 to-gray-100 animate-pulse'

  const variantClasses = {
    default: 'h-6 rounded',
    circle: 'w-12 h-12 rounded-full',
    text: 'h-4 rounded',
  }

  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={cn(baseClasses, variantClasses[variant], className)}
        />
      ))}
    </>
  )
}
