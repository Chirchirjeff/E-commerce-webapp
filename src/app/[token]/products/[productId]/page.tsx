'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ImageGallery } from '@/components/products/ImageGallery'
import { AddToCartForm } from '@/components/products/AddToCartForm'
import { ProductSpecifications } from '@/components/products/ProductSpecifications'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { productsAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { ProductDetail } from '@/types'

export default function ProductDetailsPage() {
  const params = useParams()
  const token = params.token as string
  const productId = params.productId as string

  // Fetch product details
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await productsAPI.getOne(productId)
      return response.data as ProductDetail
    },
    enabled: !!productId,
  })

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-4">
            The product you're looking for doesn't exist.
          </p>
          <Link href={`/${token}`}>
            <Button>Back to Shop</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image skeleton */}
            <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />

            {/* Details skeleton */}
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 w-3/4 rounded animate-pulse" />
              <div className="h-6 bg-gray-200 w-1/4 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  const allImages = product.images && Array.isArray(product.images)
    ? product.images
    : []

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm">
          <Link href={`/${token}`} className="text-primary-600 hover:text-primary-700">
            Shop
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">{product.name}</span>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column: Images */}
          <div className="bg-white rounded-lg p-4 lg:p-6">
            <ImageGallery
              images={allImages}
              thumbnail={product.thumbnailUrl}
              productName={product.name}
            />
          </div>

          {/* Right Column: Details */}
          <div className="space-y-6">
            {/* Title & Price */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl font-bold text-primary-600">
                  {formatPrice(product.price)}
                </span>
                {product.stockQuantity > 0 && (
                  <Badge variant="success">In Stock</Badge>
                )}
                {product.stockQuantity === 0 && (
                  <Badge variant="danger">Out of Stock</Badge>
                )}
              </div>

              {/* Stock */}
              <div className="text-sm text-gray-600">
                {product.stockQuantity > 0 ? (
                  <p>{product.stockQuantity} items available</p>
                ) : (
                  <p className="text-red-600">Out of stock</p>
                )}
              </div>
            </div>

            {/* Add to Cart Form */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <AddToCartForm product={product} shopId={product.shopId} />
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <ProductSpecifications
                description={product.description}
                attributeValues={product.attributeValues}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
