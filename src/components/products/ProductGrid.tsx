'use client'

import { useState, memo } from 'react'
import Link from 'next/link'
import { Eye, SearchX } from 'lucide-react'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { StarRating, formatReviewCount } from '@/components/ui/StarRating'
import { ProductModal } from './ProductModal'
import { ProductCardCarousel } from './ProductCardCarousel'
import { useCartStore } from '@/stores/cartStore'
import { cn } from '@/lib/utils'

// ── Rank badge theming ─────────────────────────────────────────────────────────

const RANK_LABELS: Record<number, string> = {
  1: '🥇 #1 Best Seller',
  2: '🥈 #2 Top Pick',
  3: '🥉 #3 Popular',
  4: '⭐ #4 Trending',
  5: '🔥 #5 Hot',
}

const RANK_STYLES: Record<number, string> = {
  1: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg',
  2: 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900 shadow',
  3: 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow',
  4: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow',
  5: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow',
}

const GRID = 'grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'

interface ProductGridProps {
  products: Product[]
  shopId: string
  shopToken?: string
  isLoading?: boolean
}

function discountPercent(product: Product): number | null {
  if (product.salePrice == null || product.price <= 0 || product.salePrice >= product.price) return null
  return Math.round((1 - product.salePrice / product.price) * 100)
}

function ProductGridComponent({ products, shopToken, isLoading }: ProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const addToCart = useCartStore((state) => state.addItem)

  const handleAddToCart = (product: Product, quantity: number) => {
    addToCart(product, quantity, shopToken)
  }

  if (isLoading) {
    return (
      <div className={GRID}>
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="aspect-square animate-pulse bg-gray-200 dark:bg-slate-800" />
            <div className="space-y-2 p-3 sm:p-4">
              <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-slate-800" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-slate-800" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-warm-100 to-gold-100 dark:from-warm-500/10 dark:to-gold-500/10">
          <SearchX className="h-8 w-8 text-warm-500 dark:text-warm-400" aria-hidden="true" />
        </div>
        <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">No products found</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Try a different search or browse another category.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className={GRID}>
        {products.map((product, index) => {
          const discount = discountPercent(product)
          const outOfStock = product.stockQuantity === 0
          const lowStock = product.stockQuantity > 0 && product.stockQuantity < 5
          const hasRank = product.shopRank != null && product.shopRank >= 1 && product.shopRank <= 5

          return (
            <div
              key={product.id}
              className="group flex animate-fade-in flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-900/[0.07] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-black/40"
              style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
            >
              {/* ── Image area ── */}
              <div className="relative aspect-square w-full overflow-hidden">
                <ProductCardCarousel
                  images={product.images}
                  thumbnail={product.thumbnailUrl}
                  productName={product.name}
                  onCardClick={() => setSelectedProduct(product)}
                  key={`carousel-${product.id}`}
                />

                {/* Top-left: rank badge, otherwise discount */}
                <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
                  {hasRank && (
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', RANK_STYLES[product.shopRank!])}>
                      {RANK_LABELS[product.shopRank!]}
                    </span>
                  )}
                  {discount != null && (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white shadow">
                      -{discount}%
                    </span>
                  )}
                </div>

                {/* Top-right: stock state */}
                {(outOfStock || lowStock) && (
                  <span
                    className={cn(
                      'pointer-events-none absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur',
                      outOfStock
                        ? 'bg-gray-900/80 text-white'
                        : 'bg-amber-400/90 text-amber-950'
                    )}
                  >
                    {outOfStock ? 'Sold out' : `Only ${product.stockQuantity} left`}
                  </span>
                )}

                {/* Quick view — slides up on hover (always visible on touch screens) */}
                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  className="absolute inset-x-2 bottom-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/95 py-2 text-xs font-semibold text-gray-900 shadow-lg backdrop-blur transition-all duration-300 hover:bg-white sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 dark:bg-slate-900/90 dark:text-white dark:hover:bg-slate-900"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Quick view
                </button>
              </div>

              {/* ── Content ── */}
              <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
                <Link
                  href={`/${shopToken}/products/${product.id}`}
                  className="!text-gray-900 hover:!text-warm-600 dark:!text-slate-100 dark:hover:!text-warm-400"
                >
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                    {product.name}
                  </h3>
                </Link>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  <StarRating rating={product.averageRating ?? 0} size="sm" />
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    {(product.reviewCount ?? 0) > 0
                      ? `(${formatReviewCount(product.reviewCount ?? 0)})`
                      : 'No reviews'}
                  </span>
                </div>

                {/* Pricing — crossed-out original + sale price when on offer */}
                <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
                  {product.salePrice != null ? (
                    <>
                      <span className="text-base font-extrabold text-rose-600 dark:text-rose-400 sm:text-lg">
                        {formatPrice(product.salePrice)}
                      </span>
                      <span className="text-xs text-gray-400 line-through dark:text-slate-500">
                        {formatPrice(product.price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-base font-extrabold text-gray-900 dark:text-white sm:text-lg">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>

                {product.stockQuantity > 0 && !lowStock && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    In stock
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          shopToken={shopToken}
        />
      )}
    </>
  )
}

export const ProductGrid = memo(ProductGridComponent)
