'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Product } from '@/types'
import { useCartStore } from '@/stores/cartStore'
import { useCheckoutStore } from '@/stores/checkoutStore'
import Button from '@/components/ui/Button'

interface AddToCartFormProps {
  product: Product
  shopId: string
  shopToken?: string
}

export function AddToCartForm({ product, shopId, shopToken }: AddToCartFormProps) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  const addItem = useCartStore((state) => state.addItem)
  const setShopToken = useCheckoutStore((state) => state.setShopToken)

  const isOutOfStock = product.stockQuantity === 0
  const maxQuantity = Math.min(product.stockQuantity, 10)

  const handleAddToCart = async () => {
    setIsAdding(true)
    try {
      addItem(product, quantity, shopToken)
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
      setQuantity(1)
    } finally {
      setIsAdding(false)
    }
  }

  /**
   * Buy Now — high purchase intent path.
   * Adds to cart then goes directly to /checkout/delivery (the full
   * authenticated checkout) or /cart (which has QuickPay for guest buyers).
   * We always use /checkout/delivery so returning buyers with saved addresses
   * get the fastest path; the delivery page handles the guest case too.
   */
  const handleBuyNow = async () => {
    setIsAdding(true)
    try {
      addItem(product, quantity, shopToken)
      // Persist the shop token so the checkout can link back to this shop
      if (shopToken) setShopToken(shopToken)
      router.push('/checkout/delivery')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      {!isOutOfStock && (
        <div className="flex items-center gap-4">
          <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
            Quantity:
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-2 text-gray-600 hover:bg-gray-100"
            >
              −
            </button>
            <input
              type="number"
              id="quantity"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1
                setQuantity(Math.min(Math.max(1, val), maxQuantity))
              }}
              className="w-16 text-center border-0 outline-none"
            />
            <button
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              className="p-2 text-gray-600 hover:bg-gray-100"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Stock Info */}
      <div className="text-sm">
        {isOutOfStock ? (
          <p className="text-red-600 font-medium">Out of Stock</p>
        ) : product.stockQuantity < 5 ? (
          <p className="text-orange-600">Only {product.stockQuantity} items left</p>
        ) : (
          <p className="text-green-600">In Stock</p>
        )}
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding}
          isLoading={isAdding}
          variant="secondary"
        >
          Add to Cart
        </Button>
        <Button
          onClick={handleBuyNow}
          disabled={isOutOfStock || isAdding}
          isLoading={isAdding}
        >
          Buy Now
        </Button>
      </div>

      {/* Success Notification */}
      {showNotification && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm text-green-800">Added to cart!</span>
        </div>
      )}
    </div>
  )
}
