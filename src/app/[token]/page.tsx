'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { useParams, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Sparkles, Store, X } from 'lucide-react'
import { ShopHeader, ShopHeaderSkeleton } from '@/components/layout/ShopHeader'
import { ProductGrid } from '@/components/products/ProductGrid'
import { CategoryBar } from '@/components/products/CategoryBar'
import { SearchBar } from '@/components/products/SearchBar'
import { CollectionsSkeleton } from '@/components/skeletons/PageSkeletons'
import { useShopCategories } from '@/hooks/useShopCategories'
import { useShopCollections } from '@/hooks/useShopCollections'
import { shopAPI, productsAPI } from '@/lib/api'
import { Shop, Product } from '@/types'
import { cn } from '@/lib/utils'
import { useShopContextStore } from '@/stores/shopContextStore'

// Collection carousels pull in embla-carousel; split them out of the initial
// bundle. The chunk starts loading while collections are still being fetched.
const CollectionsSection = dynamic(
  () => import('@/components/collections/CollectionCarousel').then((m) => m.CollectionsSection),
  { loading: () => <CollectionsSkeleton /> }
)

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

  // Remember this storefront so "Continue Shopping" can return here later,
  // even after the cart is cleared by a purchase.
  const setLastShopToken = useShopContextStore((state) => state.setLastShopToken)
  useEffect(() => {
    if (shopData && token) setLastShopToken(token)
  }, [shopData, token, setLastShopToken])

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
      <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-warm-50/60 to-white px-4 dark:from-slate-950 dark:to-slate-950">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 ring-8 ring-red-50/50 dark:bg-red-500/10 dark:ring-red-500/5">
            <Store className="h-9 w-9 text-red-500" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Shop Not Found
          </h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">
            The shop you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  const activeCategoryName = categoriesData?.find((c) => c.id === selectedCategoryId)?.name
  const sectionTitle = searchQuery
    ? `Results for “${searchQuery}”`
    : activeCategoryName || 'All Products'

  // Compact page list: first, last, and neighbours of the current page
  const pageItems: (number | 'gap')[] = []
  for (let n = 1; n <= totalPages; n++) {
    if (n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1) pageItems.push(n)
    else if (pageItems[pageItems.length - 1] !== 'gap') pageItems.push('gap')
  }

  const goToPage = (n: number) => {
    setCurrentPage(n)
    document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const pageBtn =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-40'
  const pageBtnIdle =
    'bg-white text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-50/40 via-gray-50 to-gray-50 transition-colors duration-200 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      {/* ── Hero: cover + identity card ─────────────────────────────────────── */}
      {shopLoading || !shopData ? (
        <ShopHeaderSkeleton />
      ) : (
        <ShopHeader
          shop={shopData}
          productCount={products.length}
          categoryCount={categoriesData?.length || 0}
        />
      )}

      {/* ── Sticky toolbar: search + categories (sits below the 64px site header) ── */}
      <div className="sticky top-16 z-30 mt-6 border-y border-gray-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto max-w-7xl space-y-3 px-4 py-3 sm:px-6 lg:px-8">
          <SearchBar
            onSearch={handleSearch}
            isLoading={productsLoading && !!searchQuery}
            placeholder="Search products in this shop..."
            value={searchQuery}
          />
          <CategoryBar
            categories={categoriesData || []}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleCategoryChange}
            isLoading={categoriesLoading || shopLoading}
          />
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

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

        {/* ── Section heading + active filter chips ────────────────────────── */}
        <div id="shop-products" className="mb-6 flex scroll-mt-48 flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
              {!isFiltering && <Sparkles className="h-5 w-5 text-gold-500" aria-hidden="true" />}
              {sectionTitle}
            </h2>
            {!productsLoading && (
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                {products.length} item{products.length !== 1 ? 's' : ''}
                {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
              </p>
            )}
          </div>

          {isFiltering && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warm-100 py-1 pl-3 pr-1 font-medium text-warm-700 dark:bg-warm-500/15 dark:text-warm-300">
                  “{searchQuery}”
                  <button
                    onClick={() => handleSearch('')}
                    className="rounded-full p-0.5 hover:bg-warm-200/70 dark:hover:bg-warm-500/20"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {activeCategoryName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 py-1 pl-3 pr-1 font-medium text-gold-800 dark:bg-gold-500/15 dark:text-gold-300">
                  {activeCategoryName}
                  <button
                    onClick={() => handleCategoryChange(undefined)}
                    className="rounded-full p-0.5 hover:bg-gold-200/70 dark:hover:bg-gold-500/20"
                    aria-label="Clear category"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Product grid ─────────────────────────────────────────────────── */}
        <ProductGrid
          products={paginatedProducts}
          shopId={shopData?.id || ''}
          shopToken={token}
          isLoading={productsLoading || shopLoading}
        />

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
            <button
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={cn(pageBtn, pageBtnIdle)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {pageItems.map((item, i) =>
              item === 'gap' ? (
                <span key={`gap-${i}`} className="px-1 text-gray-400 dark:text-slate-500">…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => goToPage(item)}
                  aria-current={item === currentPage ? 'page' : undefined}
                  className={cn(
                    pageBtn,
                    item === currentPage
                      ? 'bg-gray-900 text-white shadow-md dark:bg-white dark:text-slate-900'
                      : pageBtnIdle
                  )}
                >
                  {item}
                </button>
              )
            )}
            <button
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={cn(pageBtn, pageBtnIdle)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </div>
    </div>
  )
}
