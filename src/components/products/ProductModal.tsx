'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { Product, ProductDetail } from '@/types'
import { formatPrice } from '@/lib/utils'
import { normalizeProductImages } from '@/lib/image-utils'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { X, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

interface ProductModalProps {
  product: ProductDetail | Product
  isOpen: boolean
  onClose: () => void
  onAddToCart?: (product: ProductDetail | Product, quantity: number) => void
  showControls?: boolean
}

export function ProductModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  showControls = true,
}: ProductModalProps) {
  const [quantity, setQuantity] = React.useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAutoSlidingModal, setIsAutoSlidingModal] = useState(true)

  const images = (product as ProductDetail).images
  const thumbnail = (product as Product).thumbnailUrl
  
  // Normalize images once and memoize the result
  const displayImages = useMemo(
    () => normalizeProductImages(thumbnail, images),
    [thumbnail, images]
  )

  const hasMultiple = displayImages.length > 1

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Auto-slide effect - ONLY for products with multiple images and when modal is open
  useEffect(() => {
    if (!isAutoSlidingModal || !hasMultiple || !isOpen) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % displayImages.length)
    }, 4000) // Change image every 4 seconds

    return () => clearInterval(interval)
  }, [isAutoSlidingModal, isOpen, hasMultiple, displayImages.length])

  if (!isOpen) return null

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length)
  }

  const toggleAutoSlideModal = () => {
    setIsAutoSlidingModal(!isAutoSlidingModal)
  }

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity)
      setQuantity(1)
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
            <h2 className="text-2xl font-bold text-gray-900 line-clamp-2">
              {product.name}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 max-h-[calc(100vh-180px)] overflow-y-auto">
            {/* Images Column */}
            <div className="flex flex-col gap-4">
              {/* Main Image with Carousel Controls */}
              <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                {displayImages.length > 0 ? (
                  <Image
                    src={displayImages[currentImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover transition-all duration-500"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      className="w-16 h-16"
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
                )}

                {/* Image Counter */}
                {hasMultiple && (
                  <div className="absolute top-3 right-3 bg-black/50 px-3 py-1 rounded-full text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {currentImageIndex + 1} / {displayImages.length}
                  </div>
                )}

                {/* Navigation Controls - Only show if multiple images AND showControls is true */}
                {hasMultiple && showControls && (
                  <>
                    {/* Left Arrow Button */}
                    <button
                      onClick={handlePreviousImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white/60 backdrop-blur-sm p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>

                    {/* Right Arrow Button */}
                    <button
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white/60 backdrop-blur-sm p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-800" />
                    </button>

                    {/* Pause/Play Button */}
                    <button
                      onClick={toggleAutoSlideModal}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/40 hover:bg-white/60 backdrop-blur-sm p-2.5 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                      aria-label={isAutoSlidingModal ? 'Pause slideshow' : 'Play slideshow'}
                    >
                      {isAutoSlidingModal ? (
                        <Pause className="w-5 h-5 text-gray-800" />
                      ) : (
                        <Play className="w-5 h-5 text-gray-800" />
                      )}
                    </button>

                    {/* Progress Indicator Dots */}
                    <div className="absolute bottom-3 right-3 flex gap-1.5 items-center">
                      {displayImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentImageIndex(index)
                            setIsAutoSlidingModal(false)
                          }}
                          className={`h-2 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                            currentImageIndex === index
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

              {/* Thumbnail Gallery - Show only when controls are visible */}
              {hasMultiple && showControls && (
                <div className="grid grid-cols-4 gap-2">
                  {displayImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentImageIndex(idx)
                        setIsAutoSlidingModal(false)
                      }}
                      className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === idx
                          ? 'border-primary-600 ring-2 ring-primary-400'
                          : 'border-gray-200 hover:border-primary-400'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Column */}
            <div className="flex flex-col gap-6">
              {/* Price & Stock */}
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-bold text-primary-600">
                    {formatPrice((product as any).price)}
                  </span>
                </div>

                <div className="flex gap-2">
                  {(product as any).stockQuantity > 0 ? (
                    <>
                      <Badge variant="success">In Stock</Badge>
                      <span className="text-sm text-gray-600">
                        {(product as any).stockQuantity} available
                      </span>
                    </>
                  ) : (
                    <Badge variant="danger">Out of Stock</Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              {(product as any).description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {(product as any).description}
                  </p>
                </div>
              )}

              {/* Quantity Selector */}
              {(product as any).stockQuantity > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={(product as any).stockQuantity}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(
                          Math.max(
                            1,
                            Math.min(
                              parseInt(e.target.value) || 1,
                              (product as any).stockQuantity
                            )
                          )
                        )
                      }
                      className="w-16 h-10 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={() =>
                        setQuantity(
                          Math.min(
                            quantity + 1,
                            (product as any).stockQuantity
                          )
                        )
                      }
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              {(product as any).stockQuantity > 0 && onAddToCart && (
                <Button
                  onClick={handleAddToCart}
                  className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Add to Cart ({quantity})
                </Button>
              )}

              {(product as any).stockQuantity === 0 && (
                <Button disabled className="w-full py-3 opacity-50">
                  Out of Stock
                </Button>
              )}

              {/* Category */}
              {((product as any).marketplaceCategory ||
                (product as any).category) && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">Category: </span>
                    {((product as any).marketplaceCategory?.name ||
                      (product as any).category?.name) || 'Uncategorized'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
