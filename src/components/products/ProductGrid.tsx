'use client'

import { useState, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import { ProductModal } from './ProductModal'
import { ProductCardCarousel } from './ProductCardCarousel'
import { useCartStore } from '@/stores/cartStore'

interface ProductGridProps {
  products: Product[]
  shopId: string
  shopToken?: string
  isLoading?: boolean
}

function ProductGridComponent({ products, shopId, shopToken, isLoading }: ProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const addToCart = useCartStore((state) => state.addItem)

  const handleAddToCart = (product: Product, quantity: number) => {
    addToCart(product, quantity, shopToken)
  }
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
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
        <p className="text-gray-500 text-lg font-medium">No products found</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Image - Clickable for modal with carousel */}
            <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
              <ProductCardCarousel
                images={product.images}
                thumbnail={product.thumbnailUrl}
                productName={product.name}
                onCardClick={() => setSelectedProduct(product)}
                key={`carousel-${product.id}`}
              />

              {/* Stock Badge */}
              {product.stockQuantity === 0 && (
                <Badge
                  variant="danger"
                  className="absolute top-2 right-2"
                >
                  Out of Stock
                </Badge>
              )}
              {product.stockQuantity > 0 && product.stockQuantity < 5 && (
                <Badge
                  variant="warning"
                  className="absolute top-2 right-2"
                >
                  Only {product.stockQuantity} left
                </Badge>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <Link href={`/${shopId}/products/${product.id}`}>
                <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-primary-600 transition-colors">
                  {product.name}
                </h3>
              </Link>
              <p className="text-primary-600 font-bold text-lg mt-2">
                {formatPrice(product.price)}
              </p>
              {product.stockQuantity > 0 && (
                <p className="text-xs text-gray-500 mt-1">
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
        />
      )}
    </>
  )
}

export const ProductGrid = memo(ProductGridComponent)
