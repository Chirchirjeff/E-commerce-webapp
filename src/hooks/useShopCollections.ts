'use client'

import { useQuery } from '@tanstack/react-query'
import { collectionsAPI } from '@/lib/api'
import { ShopCollection } from '@/types'

/**
 * Fetch all active collections for a shop — used by the storefront to render
 * per-collection carousels. Returns only non-empty collections (productCount > 0).
 */
export function useShopCollections(shopId?: string) {
  return useQuery({
    queryKey: ['shop-collections', shopId],
    queryFn: async () => {
      if (!shopId) return []
      const response = await collectionsAPI.getByShop(shopId)
      const all = response.data as ShopCollection[]
      // Only show collections that actually have products
      return all.filter((c) => c.products.length > 0)
    },
    enabled: !!shopId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
