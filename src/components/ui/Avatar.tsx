'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn, getInitials } from '@/lib/utils'

const SIZES = {
  xs: { box: 'w-7 h-7 text-xs', px: 28 },
  sm: { box: 'w-8 h-8 text-xs', px: 32 },
  md: { box: 'w-12 h-12 text-lg', px: 48 },
  lg: { box: 'w-20 h-20 text-2xl', px: 80 },
  xl: { box: 'w-28 h-28 text-4xl', px: 112 },
} as const

interface AvatarProps {
  /** Profile photo URL; initials are shown when missing or if it fails to load. */
  src?: string | null
  name?: string | null
  /** Used for the initial when there's no name (e.g. the email address). */
  fallback?: string
  size?: keyof typeof SIZES
  /** Classes for the initials background, e.g. "bg-green-500". */
  colorClassName?: string
  className?: string
  /** Decorative avatars next to a visible name shouldn't be announced twice. */
  decorative?: boolean
}

export function Avatar({
  src, name, fallback, size = 'md', colorClassName = 'bg-primary-600', className, decorative = true,
}: AvatarProps) {
  // Remember which URL failed so a new photo gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const { box, px } = SIZES[size]
  const showImage = !!src && failedSrc !== src

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white select-none',
        box,
        !showImage && colorClassName,
        className,
      )}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : name || fallback || 'Profile photo'}
    >
      {showImage ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={`${px}px`}
          className="object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        getInitials(name, fallback || '?')
      )}
    </span>
  )
}
