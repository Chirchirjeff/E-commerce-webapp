'use client'

/**
 * useAddToCart
 *
 * Adds to the single-shop cart without ever mixing shops. When the product is
 * from a different shop than the cart's, nothing is added; instead the returned
 * `conflictDialog` asks the buyer whether to start a new cart with this item,
 * and offers Buy Now (which pays for just this item and leaves the cart alone).
 *
 * Render `conflictDialog` somewhere in the calling component.
 */

import { useState } from 'react'
import { Product } from '@/types'
import { AddItemResult, useCartStore } from '@/stores/cartStore'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface UseAddToCartOptions {
  shopToken?: string
  shopName?: string
  /** Called once the item is actually in the cart (directly or after "Start new cart"). */
  onAdded?: (result: AddItemResult, product: Product, quantity: number) => void
  /** When given, the conflict dialog offers "Buy Now" for just this item. */
  onBuyNowInstead?: (product: Product, quantity: number) => void
}

export function useAddToCart({ shopToken, shopName, onAdded, onBuyNowInstead }: UseAddToCartOptions = {}) {
  const addItem      = useCartStore((state) => state.addItem)
  const startNewCart = useCartStore((state) => state.startNewCart)
  const cartShopName = useCartStore((state) => state.shopName)

  const [pending, setPending] = useState<{ product: Product; quantity: number } | null>(null)

  const addToCart = (product: Product, quantity: number): AddItemResult => {
    const result = addItem(product, quantity, shopToken, shopName)
    if (result.status === 'shop_conflict') setPending({ product, quantity })
    else if (result.status !== 'out_of_stock') onAdded?.(result, product, quantity)
    return result
  }

  const confirmNewCart = () => {
    if (!pending) return
    const result = startNewCart(pending.product, pending.quantity, shopToken, shopName)
    setPending(null)
    if (result.status !== 'out_of_stock') onAdded?.(result, pending.product, pending.quantity)
  }

  const buyNowInstead = () => {
    if (!pending) return
    const { product, quantity } = pending
    setPending(null)
    onBuyNowInstead?.(product, quantity)
  }

  const conflictDialog = (
    <ConfirmDialog
      isOpen={!!pending}
      title="Start a new cart?"
      description={
        <p>
          Your cart has items from{' '}
          <strong className="font-semibold text-gray-900 dark:text-slate-100">
            {cartShopName || 'another shop'}
          </strong>
          . Start a new cart with this item? Your current cart will be emptied.
        </p>
      }
      cancelLabel="Cancel"
      confirmLabel="Start new cart"
      onCancel={() => setPending(null)}
      onConfirm={confirmNewCart}
      footer={
        onBuyNowInstead ? (
          <button
            type="button"
            onClick={buyNowInstead}
            className="font-medium text-green-700 underline-offset-2 hover:underline dark:text-green-400"
          >
            Or use Buy Now to pay for just this item
          </button>
        ) : null
      }
    />
  )

  return { addToCart, conflictDialog }
}
