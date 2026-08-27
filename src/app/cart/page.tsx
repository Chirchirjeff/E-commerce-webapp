'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { useCartStore } from '@/stores/cartStore'
import { productsAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'

export default function CartPage() {
  const items          = useCartStore((state) => state.items)
  const removeItem     = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const getTotal       = useCartStore((state) => state.getTotal)
  const shopToken      = useCartStore((state) => state.shopToken)

  // Refresh product details in case cart data is stale
  const { data: productsMap } = useQuery({
    queryKey: ['cart-products', items.map((i) => i.productId).join(',')],
    queryFn: async () => {
      if (items.length === 0) return {}
      const products = await Promise.all(items.map((item) => productsAPI.getOne(item.productId)))
      return products.reduce((acc, res) => {
        acc[res.data.id] = res.data
        return acc
      }, {} as Record<string, any>)
    },
    enabled: items.length > 0,
  })

  const continueShoppingHref = shopToken ? `/${shopToken}` : '/'

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-600 mb-8">Add some products to get started!</p>
        <Link href={continueShoppingHref}><Button>Continue Shopping</Button></Link>
      </div>
    )
  }

  const total = getTotal()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Cart Items ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200">
            {items.map((item, index) => {
              const product = productsMap?.[item.productId]
              return (
                <div
                  key={item.productId}
                  className={`p-6 flex gap-4 ${index !== items.length - 1 ? 'border-b border-gray-200' : ''}`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                    {(item.product?.thumbnailUrl || product?.thumbnailUrl) ? (
                      <Image
                        src={item.product?.thumbnailUrl ?? product!.thumbnailUrl}
                        alt={item.product?.name || 'Product'}
                        fill className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <Link
                      href={
                        shopToken
                          ? `/${shopToken}/products/${item.productId}`
                          : `/${product?.shopId || item.product?.shopId}/products/${item.productId}`
                      }
                      className="font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {item.product?.name || product?.name || 'Product'}
                    </Link>
                    <p className="text-gray-600 text-sm mt-1">{formatPrice(item.price)} each</p>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        aria-label="Decrease quantity"
                      >−</button>
                      <input
                        type="number" min="1" value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 text-center border border-gray-300 rounded text-sm"
                        aria-label="Quantity"
                      />
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
                  </div>

                  {/* Price + Remove */}
                  <div className="text-right flex flex-col justify-between">
                    <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >Remove</button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6">
            <Link href={continueShoppingHref} className="text-primary-600 hover:text-primary-700 text-sm">
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* ── Order Summary ── */}
        <aside>
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-sm">Calculated at checkout</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Link href="/checkout/delivery">
              <Button className="w-full">Proceed to Checkout</Button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
