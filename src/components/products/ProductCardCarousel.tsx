'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { normalizeProductImages, hasMultipleImages } from '@/lib/image-utils'

interface ProductCardCarouselProps {
  images?: (string | { imageUrl?: string } | null)[]
  thumbnail?: string
  productName: string
  onCardClick?: () => void
}

export function ProductCardCarousel({
  images,
  thumbnail,
  productName,
  onCardClick,
}: ProductCardCarouselProps) {
  // Normalize images once and memoize the result
  const normalizedImages = useMemo(
    () => normalizeProductImages(thumbnail, images),
    [thumbnail, images]
  )

  const hasMultiple = normalizedImages.length > 1
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Auto-slide effect - ONLY for products with multiple images
  useEffect(() => {
    if (!hasMultiple) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % normalizedImages.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [hasMultiple, normalizedImages.length])

  // No images available
  if (normalizedImages.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:text-slate-500 dark:bg-slate-800">
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    )
  }

  return (
    <div
      onClick={onCardClick}
      className="relative w-full h-full bg-gray-100 dark:bg-slate-800 overflow-hidden cursor-pointer group"
    >
      <Image
        src={normalizedImages[currentImageIndex]}
        alt={productName}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        priority={false}
      />

      {/* Image indicator - subtle dot at bottom for multi-image cards only */}
      {hasMultiple && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {normalizedImages.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                currentImageIndex === index ? 'bg-white w-3' : 'bg-white/50 w-1.5'
              }`}
            />
          ))}
        </div>
      )}

      {/* Click to expand hint */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-white text-sm font-medium bg-black/60 px-3 py-1 rounded">
          Click to expand
        </span>
      </div>
    </div>
  )
}
