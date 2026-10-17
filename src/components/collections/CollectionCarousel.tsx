'use client'

/**
 * CollectionCarousel
 *
 * Renders a single seller collection as a horizontally-scrollable Embla carousel.
 * Each collection slug maps to a unique visual theme (header gradient, card accent,
 * badge style, icon) so the storefront feels curated, not generic.
 *
 * Themes by slug:
 *   hot-deals      → fiery red/orange gradient, fire icon, animated flicker badge
 *   best-sellers   → gold/amber gradient, trophy icon, shimmer accent
 *   new-arrivals   → sky/teal gradient, sparkle icon, slide-up animation
 *   flash-sale     → purple/violet gradient, lightning icon, pulse badge
 *   trending       → emerald/green gradient, trending-up icon, bounce badge
 *   offers         → rose/pink gradient, tag icon
 *   clearance      → slate/zinc gradient, percent icon
 *   (default)      → primary blue gradient
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  Sparkles,
  Zap,
  TrendingUp,
  Tag,
  Percent,
  ShoppingBag,
} from 'lucide-react'
import { ShopCollection, CollectionProduct } from '@/types'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import { normalizeProductImages } from '@/lib/image-utils'
import { useTheme } from '@/context/ThemeContext'

// ─── Theme map ────────────────────────────────────────────────────────────────

interface CollectionTheme {
  /** Gradient applied to the section header bar */
  headerGradient: string
  /** Gradient applied to the card bottom accent bar */
  cardAccent: string
  /** Badge / pill background */
  badgeBg: string
  /** Badge text colour */
  badgeText: string
  /** Dark-mode card background */
  cardDark: string
  /** Light-mode card background */
  cardLight: string
  /** Nav button colours */
  navBtn: string
  /** Active dot colour */
  dotActive: string
  /** Lucide icon component */
  Icon: React.ElementType
  /** Animated class for the badge */
  badgeAnimation: string
  /** Icon animation class */
  iconAnimation: string
}

const THEMES: Record<string, CollectionTheme> = {
  'hot-deals': {
    headerGradient: 'from-red-500 via-orange-500 to-amber-400',
    cardAccent: 'from-red-500 to-orange-400',
    badgeBg: 'bg-red-500',
    badgeText: 'text-white',
    cardDark: 'bg-slate-800 border-red-900/40',
    cardLight: 'bg-white border-red-100',
    navBtn: 'bg-red-500 hover:bg-red-600 text-white',
    dotActive: 'bg-red-500',
    Icon: Flame,
    badgeAnimation: 'animate-pulse',
    iconAnimation: 'animate-fire-flicker',
  },
  'best-sellers': {
    headerGradient: 'from-amber-500 via-yellow-400 to-gold-400',
    cardAccent: 'from-amber-500 to-yellow-400',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-white',
    cardDark: 'bg-slate-800 border-amber-900/40',
    cardLight: 'bg-white border-amber-100',
    navBtn: 'bg-amber-500 hover:bg-amber-600 text-white',
    dotActive: 'bg-amber-500',
    Icon: Trophy,
    badgeAnimation: 'animate-badge-pop',
    iconAnimation: '',
  },
  'new-arrivals': {
    headerGradient: 'from-sky-500 via-cyan-400 to-teal-400',
    cardAccent: 'from-sky-500 to-cyan-400',
    badgeBg: 'bg-sky-500',
    badgeText: 'text-white',
    cardDark: 'bg-slate-800 border-sky-900/40',
    cardLight: 'bg-white border-sky-100',
    navBtn: 'bg-sky-500 hover:bg-sky-600 text-white',
    dotActive: 'bg-sky-500',
    Icon: Sparkles,
    badgeAnimation: 'animate-badge-pop',
    iconAnimation: '',
  },
  'flash-sale': {
    headerGradient: 'from-purple-600 via-violet-500 to-fuchsia-500',
    cardAccent: 'from-purple-600 to-violet-500',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    cardDark: 'bg-slate-800 border-purple-900/40',
    cardLight: 'bg-white border-purple-100',
    navBtn: 'bg-purple-600 hover:bg-purple-700 text-white',
    dotActive: 'bg-purple-600',
    Icon: Zap,
    badgeAnimation: 'animate-pulse',
    iconAnimation: '',
  },
  'trending': {
    headerGradient: 'from-emerald-500 via-green-400 to-teal-500',
    cardAccent: 'from-emerald-500 to-green-400',
    badgeBg: 'bg-emerald-500',
    badgeText: 'text-white',
    cardDark: 'bg-slate-800 border-emerald-900/40',
    cardLight: 'bg-white border-emerald-100',
    navBtn: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    dotActive: 'bg-emerald-500',
    Icon: TrendingUp,
    badgeAnimation: 'animate-bounce',
    iconAnimation: '',
  },
  'offers': {
    headerGradient: 'from-rose-500 via-pink-500 to-fuchsia-400',
    cardAccent: 'from-rose-500 to-pink-400',
    badgeBg: 'bg-rose-500',
    badgeText: 'text-white',
    cardDark: 'bg-slate-800 border-rose-900/40',
    cardLight: 'bg-white border-rose-100',
    navBtn: 'bg-rose-500 hover:bg-rose-600 text-white',
    dotActive: 'bg-rose-500',
    Icon: Tag,
    badgeAnimation: 'animate-badge-pop',
    iconAnimation: '',
  },
  'clearance': {
    headerGradient: 'from-slate-600 via-zinc-500 to-gray-500',
    cardAccent: 'from-slate-600 to-zinc-500',
    badgeBg: 'bg-slate-600',
    badgeText: 'text-white',
    cardDark: 'bg-slate-800 border-slate-700',
    cardLight: 'bg-white border-gray-200',
    navBtn: 'bg-slate-600 hover:bg-slate-700 text-white',
    dotActive: 'bg-slate-600',
    Icon: Percent,
    badgeAnimation: 'animate-badge-pop',
    iconAnimation: '',
  },
}

const DEFAULT_THEME: CollectionTheme = {
  headerGradient: 'from-primary-600 via-primary-500 to-sky-400',
  cardAccent: 'from-primary-600 to-sky-400',
  badgeBg: 'bg-primary-600',
  badgeText: 'text-white',
  cardDark: 'bg-slate-800 border-slate-700',
  cardLight: 'bg-white border-gray-200',
  navBtn: 'bg-primary-600 hover:bg-primary-700 text-white',
  dotActive: 'bg-primary-600',
  Icon: ShoppingBag,
  badgeAnimation: 'animate-badge-pop',
  iconAnimation: '',
}

function getTheme(slug: string): CollectionTheme {
  // Match on first segment of slug in case of custom suffixes
  const key = Object.keys(THEMES).find((k) => slug.startsWith(k))
  return key ? THEMES[key] : DEFAULT_THEME
}

// ─── Product card ─────────────────────────────────────────────────────────────

interface CardProps {
  product: CollectionProduct
  shopId: string
  shopToken: string
  theme: CollectionTheme
  isDark: boolean
  index: number
}

function CollectionProductCard({ product, shopId, shopToken, theme, isDark, index }: CardProps) {
  const images = normalizeProductImages(product.thumbnailUrl, product.images)
  const hasImage = images.length > 0
  const isOutOfStock = product.stockQuantity === 0
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 5

  return (
    <div
      className={cn(
        // Embla slide — each card is a discrete slide
        'embla__slide flex-[0_0_200px] sm:flex-[0_0_220px] min-w-0 mr-4',
        // Card base
        'rounded-xl border overflow-hidden',
        'transition-all duration-300 ease-out',
        'hover:scale-[1.03] hover:shadow-xl',
        isDark ? theme.cardDark : theme.cardLight,
        // Stagger entrance via inline delay
        'animate-slide-up'
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Image */}
      <Link href={`/${shopToken}/products/${product.id}`} className="block">
        <div className="relative w-full h-44 overflow-hidden bg-gray-100 dark:bg-slate-700">
          {hasImage ? (
            <Image
              src={images[0]}
              alt={product.name}
              fill
              sizes="220px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-600">
              <ShoppingBag className="w-12 h-12" />
            </div>
          )}

          {/* Stock overlay badges */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs font-semibold bg-red-600 px-2 py-1 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
          {isLowStock && (
            <span className="absolute top-2 right-2 text-white text-xs font-semibold bg-amber-500 px-2 py-0.5 rounded-full">
              Only {product.stockQuantity} left
            </span>
          )}

          {/* Coloured bottom accent bar */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r',
              theme.cardAccent
            )}
          />
        </div>
      </Link>

      {/* Info */}
      <div className="p-3">
        <Link href={`/${shopToken}/products/${product.id}`}>
          <h4
            className={cn(
              'text-sm font-semibold line-clamp-2 leading-snug transition-colors',
              isDark
                ? 'text-slate-100 hover:text-white'
                : 'text-gray-900 hover:text-gray-700'
            )}
          >
            {product.name}
          </h4>
        </Link>
        <p
          className={cn(
            'mt-1.5 text-base font-bold',
            isDark ? 'text-slate-100' : 'text-gray-900'
          )}
        >
          {product.salePrice != null ? (
            <span className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-green-600 dark:text-green-400">{formatPrice(product.salePrice)}</span>
              <span className="text-xs font-normal text-gray-400 dark:text-slate-500 line-through">{formatPrice(product.price)}</span>
            </span>
          ) : (
            formatPrice(product.price)
          )}
        </p>
      </div>
    </div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function CarouselSkeleton() {
  return (
    <div className="space-y-4 py-6">
      {/* Header skeleton */}
      <div className="h-14 rounded-xl bg-gray-200 dark:bg-slate-700 animate-pulse w-72" />
      {/* Cards row */}
      <div className="flex gap-4 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[200px] rounded-xl overflow-hidden bg-gray-200 dark:bg-slate-700 animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="h-44" />
            <div className="p-3 space-y-2">
              <div className="h-3 rounded bg-gray-300 dark:bg-slate-600 w-4/5" />
              <div className="h-3 rounded bg-gray-300 dark:bg-slate-600 w-3/5" />
              <div className="h-4 rounded bg-gray-300 dark:bg-slate-600 w-2/5 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CollectionCarouselProps {
  collection: ShopCollection
  shopId: string
  shopToken: string
}

export function CollectionCarousel({ collection, shopId, shopToken }: CollectionCarouselProps) {
  const { theme: colorTheme } = useTheme()
  const isDark = colorTheme === 'dark'
  const theme = getTheme(collection.slug)
  const { Icon } = theme

  // ── Embla carousel setup ──────────────────────────────────────────────────
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
  })

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])

  // ── Section entrance via IntersectionObserver ─────────────────────────────
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Don't render empty collections
  if (!collection.products || collection.products.length === 0) return null

  return (
    <section
      ref={sectionRef}
      className={cn(
        'w-full transition-all duration-700 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      aria-label={`${collection.name} collection`}
    >
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'rounded-xl px-5 py-3.5 mb-4 flex items-center justify-between',
          'bg-gradient-to-r',
          theme.headerGradient
        )}
      >
        {/* Left: icon + title + badge */}
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              'flex-shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center',
              theme.iconAnimation
            )}
            aria-hidden
          >
            <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-white font-bold text-lg leading-tight truncate">
                {collection.name}
              </h2>
              <span
                className={cn(
                  'flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/25 text-white',
                  theme.badgeAnimation
                )}
              >
                {collection.productCount} items
              </span>
            </div>
            {collection.description && (
              <p className="text-white/80 text-xs mt-0.5 truncate max-w-sm">
                {collection.description}
              </p>
            )}
          </div>
        </div>

        {/* Right: prev / next nav buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              'bg-white/20 hover:bg-white/35 text-white',
              'transition-all duration-200',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/20',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-white'
            )}
            aria-label={`Scroll ${collection.name} left`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              'bg-white/20 hover:bg-white/35 text-white',
              'transition-all duration-200',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/20',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-white'
            )}
            aria-label={`Scroll ${collection.name} right`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Embla viewport ─────────────────────────────────────────────────── */}
      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex">
          {collection.products.map((product, i) => (
            <CollectionProductCard
              key={product.id}
              product={product}
              shopId={shopId}
              shopToken={shopToken}
              theme={theme}
              isDark={isDark}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* ── Dot indicators ─────────────────────────────────────────────────── */}
      {scrollSnaps.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4" role="tablist" aria-label="Carousel pages">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={index === selectedIndex}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => scrollTo(index)}
              className={cn(
                'rounded-full transition-all duration-300 focus:outline-none',
                index === selectedIndex
                  ? cn('w-6 h-2', theme.dotActive)
                  : isDark
                    ? 'w-2 h-2 bg-slate-600 hover:bg-slate-500'
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              )}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Section wrapper that renders all collections ─────────────────────────────

interface CollectionsSectionProps {
  collections: ShopCollection[]
  shopId: string
  shopToken: string
  isLoading?: boolean
}

export function CollectionsSection({
  collections,
  shopId,
  shopToken,
  isLoading,
}: CollectionsSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-10">
        <CarouselSkeleton />
        <CarouselSkeleton />
      </div>
    )
  }

  if (!collections || collections.length === 0) return null

  return (
    <div className="space-y-10">
      {collections.map((collection) => (
        <CollectionCarousel
          key={collection.id}
          collection={collection}
          shopId={shopId}
          shopToken={shopToken}
        />
      ))}
    </div>
  )
}
