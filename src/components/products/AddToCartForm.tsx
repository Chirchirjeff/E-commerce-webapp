'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { Product } from '@/types'
import { AddItemResult } from '@/stores/cartStore'
import { useAddToCart } from '@/hooks/useAddToCart'
import { QuickPayModal, buildBuyNowOrder } from '@/components/checkout/QuickPayModal'
import Button from '@/components/ui/Button'
import { effectivePrice, formatPrice } from '@/lib/utils'

interface AddToCartFormProps {
  product: Product
  shopToken?: string
  shopName?: string
  /** shop.verificationStatus === 'ACTIVE' */
  shopVerified?: boolean
  /**
   * Called when the mobile sticky buy bar appears / disappears, so the page
   * can add bottom padding and the bar never covers content.
   */
  onStickyBarChange?: (visible: boolean) => void
}

type Notice = { tone: 'success' | 'warning'; text: string } | null

const LOW_STOCK_THRESHOLD = 5

export function AddToCartForm({ product, shopToken, shopName, shopVerified, onStickyBarChange }: AddToCartFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [quantity, setQuantity] = useState(1)
  const [notice, setNotice] = useState<Notice>(null)
  const [buyNowOpen, setBuyNowOpen] = useState(false)
  const [buyNowQty, setBuyNowQty] = useState(1)
  const [stickyVisible, setStickyVisible] = useState(false)
  const ctaRef = useRef<HTMLDivElement>(null)
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isOutOfStock = product.stockQuantity <= 0
  const maxQuantity = Math.max(1, Math.min(product.stockQuantity, 10))
  const price = effectivePrice(product)
  const onSale = price < product.price

  const showNotice = (next: Notice) => {
    setNotice(next)
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 4000)
  }
  useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current) }, [])

  const openBuyNow = (qty: number) => {
    setBuyNowQty(Math.max(1, Math.min(qty, product.stockQuantity)))
    setBuyNowOpen(true)
  }

  const describeResult = (result: AddItemResult) => {
    if (result.status === 'added') {
      showNotice({ tone: 'success', text: 'Added to cart!' })
    } else if (result.status === 'clamped') {
      showNotice({ tone: 'warning', text: `Only ${result.max} available — your cart now has ${result.quantityInCart}.` })
    }
    setQuantity(1)
  }

  const { addToCart, conflictDialog } = useAddToCart({
    shopToken,
    shopName,
    onAdded: (result) => describeResult(result),
    onBuyNowInstead: (_p, qty) => openBuyNow(qty),
  })

  const handleAddToCart = () => {
    const result = addToCart(product, quantity)
    if (result.status === 'out_of_stock') {
      showNotice({
        tone: 'warning',
        text: isOutOfStock
          ? 'This item is out of stock.'
          : `You already have all ${result.max} available in your cart.`,
      })
    }
  }

  /** Buy Now — express single-item purchase. Never touches the cart. */
  const handleBuyNow = () => openBuyNow(quantity)

  // Resume Buy Now after "Sign in for faster checkout" (?buy=1&qty=N)
  useEffect(() => {
    if (typeof window === 'undefined' || isOutOfStock) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('buy') !== '1') return
    const qty = parseInt(params.get('qty') || '1', 10)
    openBuyNow(Number.isFinite(qty) ? qty : 1)
    params.delete('buy')
    params.delete('qty')
    const rest = params.toString()
    router.replace(rest ? `${pathname}?${rest}` : pathname, { scroll: false })
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mobile sticky buy bar: shown whenever the main CTA is out of view
  useEffect(() => {
    const el = ctaRef.current
    if (!el || isOutOfStock || typeof IntersectionObserver === 'undefined') {
      setStickyVisible(false)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isOutOfStock])

  useEffect(() => { onStickyBarChange?.(stickyVisible) }, [stickyVisible, onStickyBarChange])
  useEffect(() => () => onStickyBarChange?.(false), [onStickyBarChange])

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
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Decrease quantity"
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
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              className="p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Increase quantity"
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
        ) : product.stockQuantity <= LOW_STOCK_THRESHOLD ? (
          <p className="text-orange-600">Only {product.stockQuantity} left</p>
        ) : (
          <p className="text-green-600">In Stock</p>
        )}
      </div>

      {/* Buttons — the main CTA watched by the sticky bar */}
      <div ref={ctaRef} className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          variant="secondary"
        >
          Add to Cart
        </Button>
        <Button
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className="bg-green-600 hover:bg-green-700 active:bg-green-800"
        >
          Buy Now
        </Button>
      </div>

      {/* Add-to-cart feedback */}
      {notice && (
        <div
          role="status"
          className={`p-4 rounded-lg flex items-center gap-3 border ${
            notice.tone === 'success' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <span className={`text-sm ${notice.tone === 'success' ? 'text-green-800' : 'text-amber-800'}`}>
            {notice.text}
          </span>
          <Link href="/cart" className="ml-auto text-sm font-medium text-primary-600 hover:text-primary-700">
            View cart
          </Link>
        </div>
      )}

      {/* ── Mobile sticky buy bar (hidden on md+) ── */}
      {stickyVisible && !isOutOfStock && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur md:hidden"
        >
          {notice && (
            <p
              className={`mb-2 text-xs font-medium ${notice.tone === 'success' ? 'text-green-700' : 'text-amber-700'}`}
              aria-hidden="true"
            >
              {notice.text}
            </p>
          )}
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-gray-500">{product.name}</p>
              <p className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-gray-900">{formatPrice(price)}</span>
                {onSale && <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              aria-label={`Add ${quantity} to cart`}
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="h-11 shrink-0 rounded-lg bg-green-600 px-6 text-sm font-semibold text-white hover:bg-green-700 active:bg-green-800"
            >
              Buy Now
            </button>
          </div>
        </div>
      )}

      <QuickPayModal
        isOpen={buyNowOpen}
        onClose={() => setBuyNowOpen(false)}
        order={buildBuyNowOrder(product, buyNowQty, { name: shopName, token: shopToken, verified: shopVerified })}
        source="buyNow"
        signInReturnPath={`${pathname}?buy=1&qty=${buyNowQty}`}
      />
      {conflictDialog}
    </div>
  )
}
