'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { productLinksAPI } from '@/lib/api'

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
        // Call the backend to resolve the product link token
        // This will also record the visit for analytics
        const response = await productLinksAPI.resolve(token)

        if (response.data.success && response.data.data.product) {
          const product = response.data.data.product
          
          // Redirect to the product detail page
          // Format: /{shopId}/products/{productId}
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
  }, [token, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block">
            <svg
              className="w-12 h-12 text-primary-600 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6h-6m0 0H6"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-lg font-semibold text-gray-900">
            Loading product...
          </h1>
          <p className="mt-2 text-gray-600">
            Please wait while we redirect you
          </p>
        </div>
      </div>
    )
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
