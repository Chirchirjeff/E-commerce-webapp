'use client'

import { useState, memo } from 'react'
import Link from 'next/link'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import { StarRating, formatReviewCount } from '@/components/ui/StarRating'
import { ProductModal } from './ProductModal'
import { ProductCardCarousel } from './ProductCardCarousel'
import { useCartStore } from '@/stores/cartStore'
import { useTheme } from '@/context/ThemeContext'
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
  2: 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 shadow',
  3: 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow',
  4: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow',
  5: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow',
}

interface ProductGridProps {
  products: Product[]
  shopId: string
  shopToken?: string
  isLoading?: boolean
}

function ProductGridComponent({ products, shopId, shopToken, isLoading }: ProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const addToCart = useCartStore((state) => state.addItem)
  const { theme } = useTheme()

  const handleAddToCart = (product: Product, quantity: number) => {
    addToCart(product, quantity, shopToken)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-slate-700 rounded-lg h-64 animate-pulse" />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 dark:text-slate-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-gray-500 dark:text-slate-400 text-lg font-medium">No products found</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className={cn(
              'rounded-lg border overflow-hidden hover:shadow-lg transition-shadow flex flex-col',
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 hover:shadow-slate-900/50'
                : 'bg-white border-gray-200'
            )}
          >
            {/* ── Image area ── */}
            <div className="relative w-full h-48 overflow-hidden">
              <ProductCardCarousel
                images={product.images}
                thumbnail={product.thumbnailUrl}
                productName={product.name}
                onCardClick={() => setSelectedProduct(product)}
                key={`carousel-${product.id}`}
              />

              {/* Stock Badge */}
              {product.stockQuantity === 0 && (
                <Badge variant="danger" className="absolute top-2 right-2">
                  Out of Stock
                </Badge>
              )}
              {product.stockQuantity > 0 && product.stockQuantity < 5 && (
                <Badge variant="warning" className="absolute top-2 right-2">
                  Only {product.stockQuantity} left
                </Badge>
              )}

              {/* ── Shop rank badge (top 5 per shop) ── */}
              {product.shopRank != null && product.shopRank >= 1 && product.shopRank <= 5 && (
                <span
                  className={cn(
                    'absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full',
                    RANK_STYLES[product.shopRank]
                  )}
                >
                  {RANK_LABELS[product.shopRank]}
                </span>
              )}
            </div>

            {/* ── Content ── */}
            <div className="p-3 flex flex-col gap-1 flex-1">
              <Link href={`/${shopToken}/products/${product.id}`}>
                <h3 className={cn(
                  'font-semibold text-sm line-clamp-2 hover:text-primary-600 transition-colors',
                  theme === 'dark' ? 'text-slate-100' : 'text-gray-900'
                )}>
                  {product.name}
                </h3>
              </Link>

              {/* ── Pricing — show crossed-out original + sale price when on offer ── */}
              <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                {product.salePrice != null ? (
                  <>
                    <span className="text-base font-bold text-green-600 dark:text-green-400">
                      {formatPrice(product.salePrice)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-slate-500 line-through">
                      {formatPrice(product.price)}
                    </span>
                  </>
                ) : (
                  <span className="text-base font-bold text-primary-500 dark:text-primary-400">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>

              {/* ── Star rating + review count ── */}
              {(product.reviewCount ?? 0) > 0 ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <StarRating rating={product.averageRating ?? 0} size="sm" />
                  <span className={cn(
                    'text-xs',
                    theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                  )}>
                    ({formatReviewCount(product.reviewCount ?? 0)})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-0.5">
                  <StarRating rating={0} size="sm" />
                  <span className={cn('text-xs', theme === 'dark' ? 'text-slate-500' : 'text-gray-400')}>
                    No reviews
                  </span>
                </div>
              )}

              {product.stockQuantity > 0 && (
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-auto pt-1">
                  {product.stockQuantity} in stock
                </p>
              )}
            </div>
          </div>
        ))}
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
