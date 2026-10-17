'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'next/navigation'
import { ShopHeader } from '@/components/layout/ShopHeader'
import { ShopLayoutHeader } from '@/components/layout/ShopLayoutHeader'
import { ProductGrid } from '@/components/products/ProductGrid'
import { CategoryBar } from '@/components/products/CategoryBar'
import { SearchBar } from '@/components/products/SearchBar'
import { CollectionsSection } from '@/components/collections/CollectionCarousel'
import Button from '@/components/ui/Button'
import { useTheme } from '@/context/ThemeContext'
import { useShopCategories } from '@/hooks/useShopCategories'
import { useShopCollections } from '@/hooks/useShopCollections'
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

  // ── Shop data ──────────────────────────────────────────────────────────────
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

  // ── Categories ─────────────────────────────────────────────────────────────
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = useShopCategories(shopData?.id)

  // ── Collections ────────────────────────────────────────────────────────────
  const {
    data: collectionsData,
    isLoading: collectionsLoading,
  } = useShopCollections(shopData?.id)

  // ── Products ───────────────────────────────────────────────────────────────
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
      if (searchQuery) {
        const response = await productsAPI.search(searchQuery, shopData.id)
        return response.data as Product[]
      }
      const response = await productsAPI.getByShop(shopData.id, selectedCategoryId)
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

  // Collections are only shown when no filter is active — they're a discovery
  // surface, not a substitute for filtered results.
  const isFiltering = !!(searchQuery || selectedCategoryId)
  const hasCollections =
    !isFiltering && collectionsData && collectionsData.length > 0

  // ── Error state ────────────────────────────────────────────────────────────
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
            style={{ color: theme === 'dark' ? '#ef4444' : '#dc2626' }}
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
            The shop you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (shopLoading) {
    return (
      <div className={cn(
        'min-h-screen animate-pulse',
        theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'
      )}>
        <div className={cn('h-64', theme === 'dark' ? 'bg-slate-800' : 'bg-gray-200')} />
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          <div className={cn('h-8 w-1/3', theme === 'dark' ? 'bg-slate-800' : 'bg-gray-200')} />
          <div className={cn('h-4 w-1/2', theme === 'dark' ? 'bg-slate-800' : 'bg-gray-200')} />
        </div>
      </div>
    )
  }

  const filterTextClass = theme === 'dark' ? 'text-slate-300' : 'text-gray-600'

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-200',
      theme === 'dark' ? 'bg-slate-950' : 'bg-gray-50'
    )}>
      {/* Shop cover + logo */}
      {shopData && <ShopHeader shop={shopData} />}

      {/* Stats bar */}
      {shopData && (
        <ShopLayoutHeader
          shopName={shopData.name}
          productCount={products.length}
          categoryCount={categoriesData?.length || 0}
        />
      )}

      {/* Sticky category strip */}
      <CategoryBar
        categories={categoriesData || []}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleCategoryChange}
        isLoading={categoriesLoading}
      />

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Search */}
        <div className="mb-6">
          <SearchBar
            onSearch={handleSearch}
            isLoading={productsLoading}
            placeholder="Search products in this shop..."
          />
        </div>

        {/* Active filter chips */}
        {isFiltering && (
          <div className={cn(
            'mb-6 flex items-center gap-2 text-sm transition-colors duration-200',
            filterTextClass
          )}>
            <span>Filters:</span>
            {searchQuery && (
              <span className={cn(
                'inline-flex items-center gap-1 px-3 py-1 rounded-full',
                theme === 'dark'
                  ? 'bg-warm-600/20 text-warm-300'
                  : 'bg-warm-100 text-warm-700'
              )}>
                Search: &quot;{searchQuery}&quot;
                <button onClick={() => handleSearch('')} className="hover:opacity-70 ml-1">×</button>
              </span>
            )}
            {selectedCategoryId && (
              <span className={cn(
                'inline-flex items-center gap-1 px-3 py-1 rounded-full',
                theme === 'dark'
                  ? 'bg-gold-600/20 text-gold-300'
                  : 'bg-gold-100 text-gold-700'
              )}>
                {categoriesData?.find((c) => c.id === selectedCategoryId)?.name}
                <button onClick={() => handleCategoryChange(undefined)} className="hover:opacity-70 ml-1">×</button>
              </span>
            )}
          </div>
        )}

        {/* ── Collection carousels (hidden while a filter is active) ───────── */}
        {hasCollections && (
          <div className="mb-12">
            <CollectionsSection
              collections={collectionsData!}
              shopId={shopData?.id || ''}
              shopToken={token}
              isLoading={collectionsLoading}
            />
          </div>
        )}

        {/* Skeleton placeholder while collections load (no filter active) */}
        {!isFiltering && collectionsLoading && (
          <div className="mb-12">
            <CollectionsSection
              collections={[]}
              shopId=""
              shopToken={token}
              isLoading
            />
          </div>
        )}

        {/* ── "All Products" divider when collections are visible ──────────── */}
        {hasCollections && (
          <div className="flex items-center gap-4 mb-6">
            <div className={cn(
              'flex-1 h-px',
              theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
            )} />
            <span className={cn(
              'text-sm font-semibold px-3 py-1 rounded-full',
              theme === 'dark'
                ? 'bg-slate-800 text-slate-300'
                : 'bg-white text-gray-500 border border-gray-200'
            )}>
              All Products
            </span>
            <div className={cn(
              'flex-1 h-px',
              theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
            )} />
          </div>
        )}

        {/* ── Product grid ─────────────────────────────────────────────────── */}
        <ProductGrid
          products={paginatedProducts}
          shopId={shopData?.id || ''}
          shopToken={token}
          isLoading={productsLoading}
        />

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Previous
            </Button>
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  Math.abs(pageNum - currentPage) <= 1
                ) {
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'primary' : 'secondary'}
                      onClick={() => setCurrentPage(pageNum)}
                      size="sm"
                    >
                      {pageNum}
                    </Button>
                  )
                }
                if (Math.abs(pageNum - currentPage) === 2) {
                  return (
                    <span key={pageNum} className={filterTextClass}>...</span>
                  )
                }
                return null
              })}
            </div>
            <Button
              variant="secondary"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next →
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
