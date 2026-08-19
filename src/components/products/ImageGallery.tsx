'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { normalizeProductImages } from '@/lib/image-utils'

interface ImageGalleryProps {
  images?: (string | { imageUrl?: string } | null)[]
  thumbnail?: string
  productName: string
}

export function ImageGallery({
  images,
  thumbnail,
  productName,
}: ImageGalleryProps) {
  // Normalize images once and memoize the result
  const normalizedImages = useMemo(
    () => normalizeProductImages(thumbnail, images),
    [thumbnail, images]
  )

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isAutoSliding, setIsAutoSliding] = useState(true)
  const hasMultiple = normalizedImages.length > 1

  // Auto-slide effect - ONLY for products with multiple images
  useEffect(() => {
    if (!isAutoSliding || !hasMultiple) return

    const interval = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % normalizedImages.length)
    }, 4000) // Change image every 4 seconds

    return () => clearInterval(interval)
  }, [isAutoSliding, hasMultiple, normalizedImages.length])

  const handlePrevious = () => {
    setSelectedImageIndex(
      (prev) => (prev - 1 + normalizedImages.length) % normalizedImages.length
    )
  }

  const handleNext = () => {
    setSelectedImageIndex((prev) => (prev + 1) % normalizedImages.length)
  }

  const toggleAutoSlide = () => {
    setIsAutoSliding(!isAutoSliding)
  }

  if (normalizedImages.length === 0) {
    return (
      <div className="w-full bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
        <svg
          className="w-24 h-24 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Image with Navigation Controls */}
      <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden aspect-square group">
        <Image
          src={normalizedImages[selectedImageIndex]}
          alt={productName}
          fill
          className="object-cover transition-all duration-500"
          priority
        />

        {/* Image Counter */}
        <div className="absolute top-3 right-3 bg-black/50 px-3 py-1 rounded-full text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          {selectedImageIndex + 1} / {normalizedImages.length}
        </div>

        {/* Navigation Controls - Only show if multiple images */}
        {hasMultiple && (
          <>
            {/* Left Arrow Button */}
            <button
              onClick={handlePrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white/60 backdrop-blur-sm p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>

            {/* Right Arrow Button */}
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white/60 backdrop-blur-sm p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>

            {/* Pause/Play Button */}
            <button
              onClick={toggleAutoSlide}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/40 hover:bg-white/60 backdrop-blur-sm p-2.5 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
              aria-label={isAutoSliding ? 'Pause slideshow' : 'Play slideshow'}
            >
              {isAutoSliding ? (
                <Pause className="w-5 h-5 text-gray-800" />
              ) : (
                <Play className="w-5 h-5 text-gray-800" />
              )}
            </button>

            {/* Progress Indicator Dots */}
            <div className="absolute bottom-3 right-3 flex gap-1.5 items-center">
              {normalizedImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`h-2 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                    selectedImageIndex === index
                      ? 'bg-white w-6'
                      : 'bg-white/50 w-2 hover:bg-white/75'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails - Hidden on mobile, visible on desktop */}
      {hasMultiple && (
        <div className="hidden sm:grid grid-cols-4 gap-2">
          {normalizedImages.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedImageIndex(index)
                setIsAutoSliding(false) // Pause auto-slide when user manually selects
              }}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                selectedImageIndex === index
                  ? 'border-primary-600 ring-2 ring-primary-400'
                  : 'border-gray-200 hover:border-primary-400'
              }`}
            >
              <Image
                src={image}
                alt={`${productName} ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
