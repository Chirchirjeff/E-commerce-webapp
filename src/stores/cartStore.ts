import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/types'
import { effectivePrice } from '@/lib/utils'

/**
 * Outcome of an addItem call.
 * - added:        the full requested quantity is now in the cart
 * - clamped:      only part of it fit — the cart line is capped at stockQuantity
 * - out_of_stock: nothing was added (no stock, or the line is already at the cap)
 * - shop_conflict: nothing was added — the cart holds items from another shop.
 *   Checkout pays exactly one shop per M-Pesa push, so the caller must ask the
 *   buyer whether to start a new cart (see startNewCart) instead of mixing.
 */
export type AddItemStatus = 'added' | 'clamped' | 'out_of_stock' | 'shop_conflict'

export interface AddItemResult {
  status: AddItemStatus
  /** Quantity of this product in the cart after the call. */
  quantityInCart: number
  /** Stock limit applied to the line. */
  max: number
}

export interface CartState {
  items: CartItem[]
  shopId?: string
  shopToken?: string
  /** Display name of the cart's shop, used in the "start a new cart?" prompt. */
  shopName?: string
  addItem: (product: Product, quantity: number, shopToken?: string, shopName?: string) => AddItemResult
  /** Empty the cart and start a new one (for the product's shop) containing just this product. */
  startNewCart: (product: Product, quantity: number, shopToken?: string, shopName?: string) => AddItemResult
  removeItem: (productId: string) => void
  /** Sets a line's quantity, clamped to the product's stock (or `maxStock` when fresher stock is known). */
  updateQuantity: (productId: string, quantity: number, maxStock?: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

/** Stock cap for a product; unknown stock is treated as unlimited (the backend validates). */
function stockCap(stock: number | undefined | null): number {
  return typeof stock === 'number' && Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : Infinity
}

function newLine(product: Product, quantity: number): CartItem {
  return { productId: product.id, product, quantity, price: effectivePrice(product) }
}

/** Items whose product belongs to a different shop than the cart's (legacy mixed carts). */
export function getForeignItems(state: Pick<CartState, 'items' | 'shopId'>): CartItem[] {
  if (!state.shopId) return []
  return state.items.filter((item) => item.product?.shopId && item.product.shopId !== state.shopId)
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      shopId: undefined,
      shopToken: undefined,
      shopName: undefined,

      addItem: (product, quantity, shopToken, shopName) => {
        const state = get()
        const max = stockCap(product.stockQuantity)
        const existing = state.items.find((item) => item.productId === product.id)
        const current = existing?.quantity ?? 0

        if (state.items.length > 0 && state.shopId && product.shopId && state.shopId !== product.shopId) {
          return { status: 'shop_conflict', quantityInCart: 0, max }
        }

        const requested = Math.max(0, Math.floor(quantity))
        const next = Math.min(current + requested, max)
        if (next <= current) {
          return { status: 'out_of_stock', quantityInCart: current, max }
        }

        set({
          items: existing
            ? state.items.map((item) =>
                item.productId === product.id
                  // Refresh the snapshot so stock / price stay current
                  ? { ...item, product, price: effectivePrice(product), quantity: next }
                  : item
              )
            : [...state.items, newLine(product, next)],
          shopId: product.shopId ?? state.shopId,
          shopToken: shopToken ?? state.shopToken,
          shopName: shopName ?? state.shopName,
        })

        return { status: next < current + requested ? 'clamped' : 'added', quantityInCart: next, max }
      },

      startNewCart: (product, quantity, shopToken, shopName) => {
        set({ items: [], shopId: undefined, shopToken: undefined, shopName: undefined })
        return get().addItem(product, quantity, shopToken, shopName)
      },

      removeItem: (productId: string) => {
        set((state) => {
          const items = state.items.filter((item) => item.productId !== productId)
          return items.length === 0
            ? { items, shopId: undefined, shopToken: undefined, shopName: undefined }
            : { items }
        })
      },

      updateQuantity: (productId, quantity, maxStock) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (item.productId !== productId) return item
            const max = Math.min(stockCap(item.product?.stockQuantity), stockCap(maxStock))
            // Never drop below 1 here — removing a line is an explicit action
            return { ...item, quantity: Math.max(1, Math.min(Math.floor(quantity), max)) }
          }),
        }))
      },

      clearCart: () => {
        set({ items: [], shopId: undefined, shopToken: undefined, shopName: undefined })
      },

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
