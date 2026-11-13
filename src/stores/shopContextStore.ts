import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * The storefront the buyer was last browsing. Unlike the cart's shopToken,
 * this survives the cart being cleared after a purchase, so "Continue
 * Shopping" can always send the buyer back to the shop they were in.
 */
interface ShopContextState {
  lastShopToken: string | null
  setLastShopToken: (token: string) => void
}

export const useShopContextStore = create<ShopContextState>()(
  persist(
    (set) => ({
      lastShopToken: null,
      setLastShopToken: (token) => set({ lastShopToken: token }),
    }),
    { name: 'shop-context-storage' },
  ),
)
