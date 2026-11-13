import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Skeleton primitives. Server-safe (no hooks), so they can be used from
 * route `loading.tsx` files as well as client components.
 *
 * Tone matches the rest of the storefront: gray-200 in light mode,
 * slate-700 in dark mode, with Tailwind's `animate-pulse`.
 */

/** A single placeholder shape. Purely decorative, hidden from assistive tech. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded bg-gray-200 dark:bg-slate-700', className)}
    />
  )
}

interface SkeletonRegionProps {
  /** Announced to screen readers while the placeholder is shown. */
  label?: string
  className?: string
  children: ReactNode
  /**
   * When false the region is rendered as a plain decorative wrapper, so a
   * skeleton can be nested inside a larger one without announcing twice.
   */
  standalone?: boolean
}

/** Accessible container for a group of skeleton shapes. */
export function SkeletonRegion({
  label = 'Loading…',
  className,
  children,
  standalone = true,
}: SkeletonRegionProps) {
  if (!standalone) {
    return (
      <div aria-hidden="true" className={className}>
        {children}
      </div>
    )
  }
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
