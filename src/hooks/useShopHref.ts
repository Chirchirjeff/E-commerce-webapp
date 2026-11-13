'use client'

import { useCartStore } from '@/stores/cartStore'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { useShopContextStore } from '@/stores/shopContextStore'

/**
 * Where "Continue Shopping" / "Back to Shop" should go.
 *
 * Uses the most specific shop token available: one passed in (e.g. the shop an
 * order came from), then the cart's shop, then the shop saved at checkout,
 * then the storefront the buyer last browsed. Falls back to "/", which itself
 * forwards to the last shop when one is known.
 */
export function useShopHref(preferred?: string | null) {
  const cartShopToken = useCartStore((state) => state.shopToken)
  const checkoutShopToken = useCheckoutStore((state) => state.shopToken)
  const lastShopToken = useShopContextStore((state) => state.lastShopToken)
  const token = preferred || cartShopToken || checkoutShopToken || lastShopToken
  return token ? `/${token}` : '/'
}
