'use client'

/**
 * StarRating
 *
 * Renders up to 5 stars with:
 *  - Full green star   (rating >= i)
 *  - Half green star   (0.25 <= fractional < 0.75 of the position)
 *  - Empty outline star (rating < i - 0.25)
 *
 * Usage:
 *   <StarRating rating={4.5} />
 *   <StarRating rating={3.2} size="sm" showValue />
 */

import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number          // 0 – 5, fractional values supported
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean     // render the numeric value next to the stars
  className?: string
}

const SIZES = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

const TEXT_SIZES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

export function StarRating({ rating, size = 'md', showValue = false, className }: StarRatingProps) {
  const clampedRating = Math.max(0, Math.min(5, rating))
  const svgSize = SIZES[size]

  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`Rating: ${clampedRating.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const position = i + 1
        const diff = clampedRating - (position - 1)
        // full: diff >= 0.75  |  half: 0.25 <= diff < 0.75  |  empty: diff < 0.25
        const type: 'full' | 'half' | 'empty' =
          diff >= 0.75 ? 'full' : diff >= 0.25 ? 'half' : 'empty'

        return <Star key={i} type={type} className={svgSize} />
      })}
      {showValue && (
        <span className={cn('ml-1 font-medium text-green-600', TEXT_SIZES[size])}>
          {clampedRating.toFixed(1)}
        </span>
      )}
    </span>
  )
}

// ── Internal Star SVG ──────────────────────────────────────────────────────────

interface StarProps {
  type: 'full' | 'half' | 'empty'
  className?: string
}

function Star({ type, className }: StarProps) {
  if (type === 'full') {
    return (
      <svg className={cn('text-green-500', className)} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.446a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.539 1.118l-3.368-2.446a1 1 0 00-1.176 0l-3.368 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
      </svg>
    )
  }

  if (type === 'half') {
    // Clip left half green, right half outline
    const id = `half-${Math.random().toString(36).slice(2, 7)}`
    return (
      <svg className={className} viewBox="0 0 20 20" aria-hidden>
        <defs>
          <clipPath id={`left-${id}`}>
            <rect x="0" y="0" width="10" height="20" />
          </clipPath>
          <clipPath id={`right-${id}`}>
            <rect x="10" y="0" width="10" height="20" />
          </clipPath>
        </defs>
        {/* Green left half */}
        <path
          clipPath={`url(#left-${id})`}
          fill="#22c55e"
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.446a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.539 1.118l-3.368-2.446a1 1 0 00-1.176 0l-3.368 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z"
        />
        {/* Outline right half */}
        <path
          clipPath={`url(#right-${id})`}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1.5"
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.446a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.539 1.118l-3.368-2.446a1 1 0 00-1.176 0l-3.368 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z"
        />
      </svg>
    )
  }

  // empty
  return (
    <svg className={cn('text-gray-300 dark:text-slate-600', className)} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.446a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.539 1.118l-3.368-2.446a1 1 0 00-1.176 0l-3.368 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
    </svg>
  )
}

/** Format a review count: 1000 → "1k+", 1000000 → "1m+", etc. */
export function formatReviewCount(count: number): string {
  if (count >= 1_000_000) return `${Math.floor(count / 1_000_000)}m+`
  if (count >= 1_000) return `${Math.floor(count / 1_000)}k+`
  return String(count)
}
