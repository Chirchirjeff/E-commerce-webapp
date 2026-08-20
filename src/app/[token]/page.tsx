'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'next/navigation'
import { ShopHeader } from '@/components/layout/ShopHeader'
import { ShopLayoutHeader } from '@/components/layout/ShopLayoutHeader'
import { ProductGrid } from '@/components/products/ProductGrid'
import { CategoryFilter } from '@/components/products/CategoryFilter'
import { SearchBar } from '@/components/products/SearchBar'
import Button from '@/components/ui/Button'
import { useTheme } from '@/context/ThemeContext'
import { useShopCategories } from '@/hooks/useShopCategories'
import { shopAPI, productsAPI } from '@/lib/api'
import { Shop, Product } from '@/types'
import { cn } from '@/lib/utils'

export default function StorefrontPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = params.token as string
  const { theme } = useTheme()

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

  // Fetch categories specific to this shop
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = useShopCategories(shopData?.id)

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

      // If category selected, get products from that category filtered by shop
      if (selectedCategoryId) {
        const response = await productsAPI.getByShop(shopData.id)
        const allShopProducts = response.data as Product[]
        return allShopProducts.filter(
          (p) => p.marketplaceCategoryId === selectedCategoryId
        )
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
      <div className={cn(
        'min-h-screen flex items-center justify-center transition-colors duration-200',
        theme === 'dark' ? 'bg-slate-950' : 'bg-gray-50'
      )}>
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{
              color: theme === 'dark' ? '#ef4444' : '#dc2626'
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className={cn(
            'text-2xl font-bold mb-2',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Shop Not Found
          </h1>
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>
            The shop you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  if (shopLoading) {
    return (
      <div className={cn(
        'min-h-screen animate-pulse',
        theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'
      )}>
        <div className={cn(
          'h-64',
          theme === 'dark' ? 'bg-slate-800' : 'bg-gray-200'
        )} />
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          <div className={cn(
            'h-8 w-1/3',
            theme === 'dark' ? 'bg-slate-800' : 'bg-gray-200'
          )} />
          <div className={cn(
            'h-4 w-1/2',
            theme === 'dark' ? 'bg-slate-800' : 'bg-gray-200'
          )} />
        </div>
      </div>
    )
  }

  const sidebarBgClass =
    theme === 'dark'
      ? 'bg-slate-800 border-slate-700'
      : 'bg-white border-gray-200'

  const filterTextClass =
    theme === 'dark'
      ? 'text-slate-300'
      : 'text-gray-600'

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-200',
      theme === 'dark' ? 'bg-slate-950' : 'bg-gray-50'
    )}>
      {/* Shop Header with Cover and Logo */}
      {shopData && <ShopHeader shop={shopData} />}

      {/* Shop Layout Header with Stats */}
      {shopData && (
        <ShopLayoutHeader
          shopName={shopData.name}
          productCount={products.length}
          categoryCount={categoriesData?.length || 0}
          showActions={true}
        />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className={cn(
              'rounded-lg border p-6 sticky top-24 transition-colors duration-200',
              sidebarBgClass
            )}>
              <h2 className={cn(
                'text-lg font-semibold mb-4',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
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
              <div className={cn(
                'mb-6 flex items-center gap-2 text-sm transition-colors duration-200',
                filterTextClass
              )}>
                <span>
                  Filters:
                  {searchQuery && (
                    <span className={cn(
                      'ml-2 inline-block px-3 py-1 rounded-full',
                      theme === 'dark'
                        ? 'bg-warm-600/20 text-warm-300'
                        : 'bg-warm-100 text-warm-700'
                    )}>
                      Search: "{searchQuery}"
                      <button
                        onClick={() => handleSearch('')}
                        className="ml-1 hover:opacity-70"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedCategoryId && (
                    <span className={cn(
                      'ml-2 inline-block px-3 py-1 rounded-full',
                      theme === 'dark'
                        ? 'bg-gold-600/20 text-gold-300'
                        : 'bg-gold-100 text-gold-700'
                    )}>
                      {
                        categoriesData?.find((c) => c.id === selectedCategoryId)
                          ?.name
                      }
                      <button
                        onClick={() => handleCategoryChange(undefined)}
                        className="ml-1 hover:opacity-70"
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
