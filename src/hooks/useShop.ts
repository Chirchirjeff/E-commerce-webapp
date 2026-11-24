'use client'

import { useQuery } from '@tanstack/react-query'
import { shopAPI } from '@/lib/api'
import { Shop } from '@/types'

/**
 * The storefront's shop, resolved from its link token. Shares the
 * ['shop', token] cache entry with the storefront page, so components inside a
 * shop (product modal, product page, quick-pay sheet) read it without refetching.
 */
export function useShop(token?: string | null) {
  return useQuery({
    queryKey: ['shop', token],
    queryFn: async () => {
      const response = await shopAPI.resolveLinkByToken(token as string)
      return response.data.data.shop as Shop
    },
    enabled: !!token,
  })
}

/** Real trust signal only: the platform has verified this seller. */
export function isVerifiedShop(shop?: Pick<Shop, 'verificationStatus'> | null): boolean {
  return shop?.verificationStatus === 'ACTIVE'
}
