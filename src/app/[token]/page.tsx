'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'next/navigation'
import { ShopHeader } from '@/components/layout/ShopHeader'
import { ProductGrid } from '@/components/products/ProductGrid'
import { CategoryFilter } from '@/components/products/CategoryFilter'
import { SearchBar } from '@/components/products/SearchBar'
import Button from '@/components/ui/Button'
import { shopAPI, productsAPI, categoriesAPI } from '@/lib/api'
import { Shop, Product, MarketplaceCategory } from '@/types'

export default function StorefrontPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = params.token as string

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(
    searchParams.get('category') || undefined
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Fetch shop data
  const {
    data: shopData,
    isLoading: shopLoading,
    error: shopError,
  } = useQuery({
    queryKey: ['shop', token],
    queryFn: async () => {
      const response = await shopAPI.resolveLinkByToken(token)
      return response.data.data.shop as Shop
    },
    enabled: !!token,
  })

  // Fetch categories
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.getAll(false, false)
      return response.data as MarketplaceCategory[]
    },
  })

  // Fetch products (with optional filtering by category)
  const {
    data: productsData,
    isLoading: productsLoading,
  } = useQuery({
    queryKey: [
      'products',
      shopData?.id,
      selectedCategoryId,
      searchQuery,
      currentPage,
    ],
    queryFn: async () => {
      if (!shopData?.id) return []

      // If searching, use search API
      if (searchQuery) {
        const response = await productsAPI.search(searchQuery, shopData.id)
        return response.data as Product[]
      }

      // If category selected, get products from that category
      if (selectedCategoryId) {
        const response = await categoriesAPI.getProducts(selectedCategoryId, true)
        return (response.data as any).products?.filter(
          (p: Product) => p.shopId === shopData.id
        ) || []
      }

      // Get all shop products
      const response = await productsAPI.getByShop(shopData.id)
      return response.data as Product[]
    },
    enabled: !!shopData?.id,
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleCategoryChange = (categoryId: string | undefined) => {
    setSelectedCategoryId(categoryId)
    setCurrentPage(1)
    setSearchQuery('')
  }

  // Pagination
  const products = productsData || []
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(products.length / itemsPerPage)

  if (shopError) {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Shop Not Found</h1>
          <p className="text-gray-600">
            The shop you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  if (shopLoading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="h-64 bg-gray-200" />
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          <div className="h-8 bg-gray-200 w-1/3" />
          <div className="h-4 bg-gray-200 w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Shop Header */}
      {shopData && <ShopHeader shop={shopData} />}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Categories
              </h2>
              <CategoryFilter
                categories={categoriesData || []}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={handleCategoryChange}
                isLoading={categoriesLoading}
              />
            </div>
          </div>

          {/* Products Section */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-8">
              <SearchBar
                onSearch={handleSearch}
                isLoading={productsLoading}
                placeholder="Search products in this shop..."
              />
            </div>

            {/* Filters Info */}
            {(searchQuery || selectedCategoryId) && (
              <div className="mb-6 flex items-center gap-2 text-sm">
                <span className="text-gray-600">
                  Filters:
                  {searchQuery && (
                    <span className="ml-2 inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full">
                      Search: "{searchQuery}"
                      <button
                        onClick={() => handleSearch('')}
                        className="ml-1 hover:text-primary-900"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedCategoryId && (
                    <span className="ml-2 inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full">
                      {
                        categoriesData?.find((c) => c.id === selectedCategoryId)
                          ?.name
                      }
                      <button
                        onClick={() => handleCategoryChange(undefined)}
                        className="ml-1 hover:text-primary-900"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Products Grid */}
            <ProductGrid
              products={paginatedProducts}
              shopId={shopData?.id || ''}
              isLoading={productsLoading}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                >
                  ← Previous
                </Button>

                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1
                    // Show first, last, and pages around current
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - currentPage) <= 1
                    ) {
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? 'primary' : 'secondary'
                          }
                          onClick={() => setCurrentPage(pageNum)}
                          size="sm"
                        >
                          {pageNum}
                        </Button>
                      )
                    }
                    if (Math.abs(pageNum - currentPage) === 2) {
                      return <span key={pageNum}>...</span>
                    }
                    return null
                  })}
                </div>

                <Button
                  variant="secondary"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next →
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
