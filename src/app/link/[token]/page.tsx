'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { productLinksAPI } from '@/lib/api'
import { ProductDetailSkeleton } from '@/components/skeletons/PageSkeletons'
import { captureUtmParams } from '@/lib/utmParams'

/**
 * Product Link Resolution Page
 * 
 * This page handles shareable product links.
 * When a user visits /link/:token, this component:
 * 1. Calls the backend API to resolve the link
 * 2. Records a visit for analytics
 * 3. Redirects to the actual product page
 */
export default function ProductLinkPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = params.token as string
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Invalid product link token')
      setIsLoading(false)
      return
    }

    const resolveAndRedirect = async () => {
      try {
        // Append any utm_* params already in the URL to the resolve request
        // so the backend records them on the ProductLinkVisit row.
        const utmQuery = searchParams.toString() || undefined
        const response = await productLinksAPI.resolve(token, utmQuery)

        if (response.data.success && response.data.data.product) {
          const product = response.data.data.product

          // Capture UTM params in sessionStorage and fire the platform-wide
          // visit event (covers cases where the link was not a tracked token).
          captureUtmParams(searchParams.toString(), { shopId: product.shopId })

          // Redirect to the product detail page
          // Format: /{shopToken}/products/{productId}
          const productUrl = `/${product.shopId}/products/${product.id}`
          router.push(productUrl)
        } else {
          throw new Error('Failed to resolve product link')
        }
      } catch (err) {
        console.error('Error resolving product link:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load product'
        )
        setIsLoading(false)
      }
    }

    resolveAndRedirect()
  }, [token, router, searchParams])

  if (isLoading) {
    // The link resolves to a product page, so preview that layout while we redirect.
    return <ProductDetailSkeleton label="Opening product…" />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Product Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    )
  }

  return null
}
