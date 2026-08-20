'use client'

import { useQuery } from '@tanstack/react-query'
import { categoriesAPI } from '@/lib/api'
import { MarketplaceCategory } from '@/types'

/**
 * Hook to fetch categories that a shop has products in
 * Only returns categories where the shop has at least one product
 */
export function useShopCategories(shopId?: string) {
  return useQuery({
    queryKey: ['shop-categories', shopId],
    queryFn: async () => {
      if (!shopId) return []
      const response = await categoriesAPI.getShopCategories(shopId)
      return response.data as MarketplaceCategory[]
    },
    enabled: !!shopId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
