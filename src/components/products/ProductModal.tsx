'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Product, ProductDetail, DescriptionBlock, Review } from '@/types'
import { formatPrice, formatDate } from '@/lib/utils'
import { normalizeProductImages } from '@/lib/image-utils'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { StarRating, formatReviewCount } from '@/components/ui/StarRating'
import { ProductShareButton } from './ProductShareButton'
import { X, ChevronLeft, ChevronRight, Pause, Play, BookOpen, Star } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useCartStore } from '@/stores/cartStore'
import { cn } from '@/lib/utils'
import { useProductReviews, useCanReview, useSubmitReview } from '@/hooks/useReviews'

interface ProductModalProps {
  product: ProductDetail | Product
  isOpen: boolean
  onClose: () => void
  onAddToCart?: (product: ProductDetail | Product, quantity: number) => void
  showControls?: boolean
  shopToken?: string
}

// ── Which tab is active in the right-hand panel ────────────────────────────────
type ActiveTab = 'details' | 'description' | 'reviews'

export function ProductModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  showControls = true,
  shopToken,
}: ProductModalProps) {
  const [quantity, setQuantity] = React.useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAutoSlidingModal, setIsAutoSlidingModal] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>('details')
  const { theme } = useTheme()
  const router = useRouter()
  const addToCart = useCartStore((state) => state.addItem)

  const images = (product as ProductDetail).images
  const thumbnail = (product as Product).thumbnailUrl

  const displayImages = useMemo(
    () => normalizeProductImages(thumbnail, images),
    [thumbnail, images]
  )
  const hasMultiple = displayImages.length > 1

  const p = product as any

  // ── Review data ────────────────────────────────────────────────────────────
  const { data: reviewData } = useProductReviews(isOpen ? product.id : undefined)
  const { data: canReviewData } = useCanReview(isOpen ? product.id : undefined)

  // ── Review form state ──────────────────────────────────────────────────────
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const submitReview = useSubmitReview(product.id)

  const isDark = theme === 'dark'

  const descriptionBlocks: DescriptionBlock[] = Array.isArray(p.descriptionBlocks)
    ? p.descriptionBlocks
    : []
  const hasRichDescription = descriptionBlocks.length > 0
  const hasDescription = !!p.description || hasRichDescription
  const reviewCount = reviewData?.reviewCount ?? p.reviewCount ?? 0
  const avgRating = reviewData?.averageRating ?? p.averageRating ?? 0

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

  // Auto-slide effect
  useEffect(() => {
    if (!isAutoSlidingModal || !hasMultiple || !isOpen) return
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % displayImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [isAutoSlidingModal, isOpen, hasMultiple, displayImages.length])

  if (!isOpen) return null

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)
  }
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length)
  }
  const toggleAutoSlideModal = () => setIsAutoSlidingModal((v) => !v)

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity)
      setQuantity(1)
      onClose()
    }
  }

  const handleBuyNow = () => {
    addToCart(product as Product, quantity, shopToken)
    setQuantity(1)
    onClose()
    router.push('/cart')
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (reviewRating === 0) return
    await submitReview.mutateAsync({ rating: reviewRating, comment: reviewComment || undefined })
    setReviewSubmitted(true)
    setReviewRating(0)
    setReviewComment('')
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className={cn(
            'rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden',
            isDark ? 'bg-slate-900' : 'bg-white'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className={cn(
            'flex items-center justify-between p-6 sticky top-0 border-b z-10',
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
          )}>
            <div className="min-w-0 pr-4">
              <h2 className={cn('text-xl font-bold line-clamp-1', isDark ? 'text-slate-100' : 'text-gray-900')}>
                {product.name}
              </h2>
              {/* Rating summary in header */}
              {reviewCount > 0 && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StarRating rating={avgRating} size="sm" />
                  <span className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>
                    {avgRating.toFixed(1)} ({formatReviewCount(reviewCount)} reviews)
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className={cn(
                'flex-shrink-0 p-2 rounded-full transition-colors',
                isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              )}
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 max-h-[calc(100vh-180px)] overflow-hidden">

            {/* ── Left: Images ── */}
            <div className={cn(
              'flex flex-col gap-4 p-6 overflow-y-auto',
              isDark ? 'border-r border-slate-700' : 'border-r border-gray-200'
            )}>
              {/* Main image */}
              <div className={cn(
                'relative w-full aspect-square rounded-lg overflow-hidden group',
                isDark ? 'bg-slate-800' : 'bg-gray-100'
              )}>
                {displayImages.length > 0 ? (
                  <Image
                    src={displayImages[currentImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover transition-all duration-500"
                    priority
                  />
                ) : (
                  <div className={cn('w-full h-full flex items-center justify-center', isDark ? 'text-slate-500' : 'text-gray-400')}>
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {hasMultiple && (
                  <div className="absolute top-3 right-3 bg-black/50 px-3 py-1 rounded-full text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {currentImageIndex + 1} / {displayImages.length}
                  </div>
                )}

                {hasMultiple && showControls && (
                  <>
                    <button onClick={handlePreviousImage} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white/60 backdrop-blur-sm p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg" aria-label="Previous image">
                      <ChevronLeft className="w-6 h-6 text-gray-900" />
                    </button>
                    <button onClick={handleNextImage} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white/60 backdrop-blur-sm p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg" aria-label="Next image">
                      <ChevronRight className="w-6 h-6 text-gray-900" />
                    </button>
                    <button onClick={toggleAutoSlideModal} className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/40 hover:bg-white/60 backdrop-blur-sm p-2.5 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg" aria-label={isAutoSlidingModal ? 'Pause slideshow' : 'Play slideshow'}>
                      {isAutoSlidingModal ? <Pause className="w-5 h-5 text-gray-900" /> : <Play className="w-5 h-5 text-gray-900" />}
                    </button>
                    <div className="absolute bottom-3 right-3 flex gap-1.5 items-center">
                      {displayImages.map((_, index) => (
                        <button key={index} onClick={() => { setCurrentImageIndex(index); setIsAutoSlidingModal(false) }} className={`h-2 rounded-full transition-all opacity-0 group-hover:opacity-100 ${currentImageIndex === index ? 'bg-white w-6' : 'bg-white/50 w-2 hover:bg-white/75'}`} aria-label={`Go to image ${index + 1}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail gallery */}
              {hasMultiple && showControls && (
                <div className="grid grid-cols-4 gap-2">
                  {displayImages.map((img, idx) => (
                    <button key={idx} onClick={() => { setCurrentImageIndex(idx); setIsAutoSlidingModal(false) }} className={cn('relative aspect-square rounded-lg overflow-hidden border-2 transition-all', isDark ? 'bg-slate-800' : 'bg-gray-100', currentImageIndex === idx ? 'border-primary-600 ring-2 ring-primary-400' : isDark ? 'border-slate-600 hover:border-primary-400' : 'border-gray-200 hover:border-primary-400')}>
                      <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: Tabs (Details / Description / Reviews) ── */}
            <div className="flex flex-col overflow-hidden">
              {/* Tab bar */}
              <div className={cn('flex border-b flex-shrink-0', isDark ? 'border-slate-700' : 'border-gray-200')}>
                {(['details', 'description', 'reviews'] as ActiveTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'flex-1 py-3 text-sm font-medium capitalize transition-colors',
                      activeTab === tab
                        ? isDark
                          ? 'border-b-2 border-primary-400 text-primary-400'
                          : 'border-b-2 border-primary-600 text-primary-600'
                        : isDark
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {tab === 'reviews' && reviewCount > 0
                      ? `Reviews (${formatReviewCount(reviewCount)})`
                      : tab === 'description' && !hasDescription
                        ? null
                        : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab content — scrollable */}
              <div className="flex-1 overflow-y-auto p-6">

                {/* ── DETAILS TAB ── */}
                {activeTab === 'details' && (
                  <div className="flex flex-col gap-6">
                    {/* Pricing */}
                    <div>
                      <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                        {p.salePrice != null ? (
                          <>
                            <span className="text-4xl font-bold text-green-600 dark:text-green-400">
                              {formatPrice(p.salePrice)}
                            </span>
                            <span className="text-xl text-gray-400 dark:text-slate-500 line-through">
                              {formatPrice(p.price)}
                            </span>
                            <span className="text-sm font-semibold text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                              Save {formatPrice(p.price - p.salePrice)}
                            </span>
                          </>
                        ) : (
                          <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                            {formatPrice(p.price)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        {p.stockQuantity > 0 ? (
                          <>
                            <Badge variant="success">In Stock</Badge>
                            <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-gray-600')}>
                              {p.stockQuantity} available
                            </span>
                          </>
                        ) : (
                          <Badge variant="danger">Out of Stock</Badge>
                        )}
                      </div>
                    </div>

                    {/* Short description (first text block or plain description) */}
                    {p.description && !hasRichDescription && (
                      <div>
                        <h3 className={cn('font-semibold mb-2', isDark ? 'text-slate-100' : 'text-gray-900')}>Description</h3>
                        <p className={cn('leading-relaxed text-sm', isDark ? 'text-slate-400' : 'text-gray-600')}>
                          {p.description}
                        </p>
                        {hasRichDescription && (
                          <button
                            onClick={() => setActiveTab('description')}
                            className="mt-2 text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1 hover:underline"
                          >
                            <BookOpen className="w-3 h-3" />
                            View full description
                          </button>
                        )}
                      </div>
                    )}

                    {/* Quantity selector */}
                    {p.stockQuantity > 0 && (
                      <div>
                        <label className={cn('block text-sm font-medium mb-2', isDark ? 'text-slate-300' : 'text-gray-700')}>
                          Quantity
                        </label>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className={cn('w-10 h-10 flex items-center justify-center border rounded-lg transition-colors', isDark ? 'border-slate-600 hover:bg-slate-700 text-slate-200' : 'border-gray-300 hover:bg-gray-100 text-gray-900')}>−</button>
                          <input type="number" min="1" max={p.stockQuantity} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, p.stockQuantity)))} className={cn('w-16 h-10 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500', isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-gray-300 text-gray-900')} />
                          <button onClick={() => setQuantity(Math.min(quantity + 1, p.stockQuantity))} className={cn('w-10 h-10 flex items-center justify-center border rounded-lg transition-colors', isDark ? 'border-slate-600 hover:bg-slate-700 text-slate-200' : 'border-gray-300 hover:bg-gray-100 text-gray-900')}>+</button>
                        </div>
                      </div>
                    )}

                    {/* Cart / Buy now */}
                    {p.stockQuantity > 0 && onAddToCart && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Button onClick={handleAddToCart} className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors">
                            Add to Cart ({quantity})
                          </Button>
                          <Button onClick={handleBuyNow} className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                            Buy Now
                          </Button>
                        </div>
                        <ProductShareButton productId={product.id} productName={product.name} />
                      </div>
                    )}

                    {p.stockQuantity === 0 && (
                      <div className="space-y-3">
                        <Button disabled className="w-full py-3 opacity-50">Out of Stock</Button>
                        <ProductShareButton productId={product.id} productName={product.name} />
                      </div>
                    )}

                    {/* Category */}
                    {(p.marketplaceCategory || p.category) && (
                      <div className={cn('pt-4 border-t', isDark ? 'border-slate-700' : 'border-gray-200')}>
                        <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-gray-600')}>
                          <span className={cn('font-medium', isDark ? 'text-slate-200' : 'text-gray-900')}>Category: </span>
                          {p.marketplaceCategory?.name || p.category?.name || 'Uncategorized'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── DESCRIPTION TAB ── */}
                {activeTab === 'description' && (
                  <div className="space-y-6">
                    {!hasDescription && (
                      <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-gray-500')}>
                        No description available for this product.
                      </p>
                    )}

                    {/* Plain text description (shown if no rich blocks) */}
                    {p.description && !hasRichDescription && (
                      <p className={cn('leading-relaxed text-sm', isDark ? 'text-slate-300' : 'text-gray-700')}>
                        {p.description}
                      </p>
                    )}

                    {/* Rich description blocks */}
                    {descriptionBlocks.map((block, idx) => (
                      <RichBlock key={idx} block={block} isDark={isDark} />
                    ))}
                  </div>
                )}

                {/* ── REVIEWS TAB ── */}
                {activeTab === 'reviews' && (
                  <ReviewsTab
                    productId={product.id}
                    reviews={reviewData?.reviews ?? []}
                    averageRating={avgRating}
                    reviewCount={reviewCount}
                    canReview={canReviewData?.canReview ?? false}
                    hasReviewed={canReviewData?.hasReviewed ?? false}
                    reviewRating={reviewRating}
                    reviewHover={reviewHover}
                    reviewComment={reviewComment}
                    reviewSubmitted={reviewSubmitted}
                    submitPending={submitReview.isPending}
                    submitError={submitReview.isError}
                    onRatingChange={setReviewRating}
                    onHoverChange={setReviewHover}
                    onCommentChange={setReviewComment}
                    onSubmit={handleReviewSubmit}
                    isDark={isDark}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Rich description block renderer ───────────────────────────────────────────

function RichBlock({ block, isDark }: { block: DescriptionBlock; isDark: boolean }) {
  if (block.type === 'text') {
    return (
      <p className={cn('leading-relaxed text-sm whitespace-pre-wrap', isDark ? 'text-slate-300' : 'text-gray-700')}>
        {block.content as string}
      </p>
    )
  }

  if (block.type === 'table') {
    const { headers, rows } = block.content as { headers: string[]; rows: string[][] }
    return (
      <div className="overflow-x-auto">
        <table className={cn('w-full text-sm border-collapse', isDark ? 'text-slate-300' : 'text-gray-700')}>
          {headers.length > 0 && (
            <thead>
              <tr className={isDark ? 'bg-slate-700' : 'bg-gray-100'}>
                {headers.map((h, i) => (
                  <th key={i} className={cn('text-left font-semibold px-3 py-2 border', isDark ? 'border-slate-600' : 'border-gray-200')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={cn(ri % 2 === 0 ? '' : isDark ? 'bg-slate-800/50' : 'bg-gray-50')}>
                {row.map((cell, ci) => (
                  <td key={ci} className={cn('px-3 py-2 border', isDark ? 'border-slate-700' : 'border-gray-200')}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (block.type === 'image') {
    return (
      <figure className="space-y-2">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800">
          <Image src={block.content as string} alt={block.caption ?? 'Product image'} fill className="object-contain" />
        </div>
        {block.caption && (
          <figcaption className={cn('text-xs text-center', isDark ? 'text-slate-500' : 'text-gray-400')}>
            {block.caption}
          </figcaption>
        )}
      </figure>
    )
  }

  return null
}

// ── Reviews tab ────────────────────────────────────────────────────────────────

interface ReviewsTabProps {
  productId: string
  reviews: Review[]
  averageRating: number
  reviewCount: number
  canReview: boolean
  hasReviewed: boolean
  reviewRating: number
  reviewHover: number
  reviewComment: string
  reviewSubmitted: boolean
  submitPending: boolean
  submitError: boolean
  onRatingChange: (v: number) => void
  onHoverChange: (v: number) => void
  onCommentChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  isDark: boolean
}

function ReviewsTab({
  reviews, averageRating, reviewCount, canReview, hasReviewed,
  reviewRating, reviewHover, reviewComment, reviewSubmitted, submitPending, submitError,
  onRatingChange, onHoverChange, onCommentChange, onSubmit, isDark,
}: ReviewsTabProps) {
  return (
    <div className="space-y-6">
      {/* Aggregate summary */}
      {reviewCount > 0 && (
        <div className={cn('rounded-xl p-4 flex items-center gap-5', isDark ? 'bg-slate-800' : 'bg-gray-50')}>
          <div className="text-center">
            <p className={cn('text-5xl font-bold', isDark ? 'text-slate-100' : 'text-gray-900')}>
              {averageRating.toFixed(1)}
            </p>
            <StarRating rating={averageRating} size="md" className="mt-1 justify-center" />
            <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
              {formatReviewCount(reviewCount)} reviews
            </p>
          </div>
          <div className="flex-1">
            <RatingBars reviews={reviews} isDark={isDark} />
          </div>
        </div>
      )}

      {/* Review submission form */}
      {canReview && !reviewSubmitted && (
        <form onSubmit={onSubmit} className={cn('rounded-xl p-4 space-y-3 border', isDark ? 'bg-slate-800 border-slate-700' : 'bg-green-50 border-green-200')}>
          <h4 className={cn('font-semibold text-sm', isDark ? 'text-slate-100' : 'text-gray-900')}>
            Leave a Review
          </h4>
          {/* Interactive star picker */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => onHoverChange(star)}
                onMouseLeave={() => onHoverChange(0)}
                onClick={() => onRatingChange(star)}
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={cn(
                    'w-7 h-7 transition-colors',
                    (reviewHover || reviewRating) >= star
                      ? 'text-green-500 fill-green-500'
                      : isDark ? 'text-slate-600' : 'text-gray-300'
                  )}
                />
              </button>
            ))}
            {reviewRating > 0 && (
              <span className={cn('ml-2 text-sm self-center', isDark ? 'text-slate-300' : 'text-gray-600')}>
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
              </span>
            )}
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Share your experience with this product (optional)"
            rows={3}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500',
              isDark ? 'bg-slate-900 border-slate-600 text-slate-200 placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            )}
          />
          {submitError && (
            <p className="text-xs text-red-500">Failed to submit review. Please try again.</p>
          )}
          <button
            type="submit"
            disabled={reviewRating === 0 || submitPending}
            className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitPending ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      )}

      {reviewSubmitted && (
        <div className="rounded-xl p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium">
          ✓ Thank you! Your review has been submitted.
        </div>
      )}

      {hasReviewed && !reviewSubmitted && (
        <div className={cn('rounded-xl p-4 text-sm border', isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-gray-50 border-gray-200 text-gray-500')}>
          You have already reviewed this product.
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 && !canReview && (
        <p className={cn('text-sm text-center py-6', isDark ? 'text-slate-400' : 'text-gray-500')}>
          No reviews yet. Be the first to review this product after purchase.
        </p>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} isDark={isDark} />
        ))}
      </div>
    </div>
  )
}

function RatingBars({ reviews, isDark }: { reviews: Review[]; isDark: boolean }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))
  const total = reviews.length || 1

  return (
    <div className="space-y-1.5">
      {counts.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2">
          <span className={cn('text-xs w-4', isDark ? 'text-slate-400' : 'text-gray-500')}>{star}</span>
          <Star className="w-3 h-3 text-green-500 fill-green-500 flex-shrink-0" />
          <div className={cn('flex-1 h-2 rounded-full overflow-hidden', isDark ? 'bg-slate-700' : 'bg-gray-200')}>
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
          <span className={cn('text-xs w-5 text-right', isDark ? 'text-slate-400' : 'text-gray-500')}>{count}</span>
        </div>
      ))}
    </div>
  )
}

function ReviewCard({ review, isDark }: { review: Review; isDark: boolean }) {
  return (
    <div className={cn('rounded-xl p-4 border', isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200')}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {/* Avatar initials */}
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {review.user?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div>
            <p className={cn('text-sm font-semibold', isDark ? 'text-slate-200' : 'text-gray-900')}>
              {review.user?.name ?? 'Anonymous'}
            </p>
            <StarRating rating={review.rating} size="sm" />
          </div>
        </div>
        <span className={cn('text-xs flex-shrink-0', isDark ? 'text-slate-500' : 'text-gray-400')}>
          {formatDate(review.createdAt)}
        </span>
      </div>
      {review.comment && (
        <p className={cn('text-sm leading-relaxed mt-2', isDark ? 'text-slate-300' : 'text-gray-600')}>
          {review.comment}
        </p>
      )}
    </div>
  )
}
