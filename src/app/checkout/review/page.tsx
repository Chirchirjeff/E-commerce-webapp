'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/stores/cartStore'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { formatPrice } from '@/lib/utils'
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'

export default function ReviewPage() {
  const router   = useRouter()
  const items    = useCartStore((state) => state.items)
  const getTotal = useCartStore((state) => state.getTotal)
  const delivery = useCheckoutStore((state) => state.delivery)
  const deliveryBuyerId = useCheckoutStore((state) => state.deliveryBuyerId)
  const buyerId = useAuthStore((state) => state.user?.id)

  // Guard: must have delivery details
  useEffect(() => {
    if (!delivery || deliveryBuyerId !== buyerId) router.replace('/checkout/delivery')
  }, [delivery, deliveryBuyerId, buyerId, router])

  if (!delivery || deliveryBuyerId !== buyerId || items.length === 0) return null

  const total = getTotal()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CheckoutProgress current="review" />

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Your Order</h1>
      <p className="text-sm text-gray-500 mb-8">
        Please review everything below. Your order will only be placed once payment is confirmed.
      </p>

      {/* ── Items ── */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
        <ul className="divide-y divide-gray-200">
          {items.map((item) => (
            <li key={item.productId} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
              {/* Thumbnail */}
              <div className="relative w-14 h-14 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                {item.product?.thumbnailUrl ? (
                  <Image src={item.product.thumbnailUrl} alt={item.product.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.product?.name || 'Product'}</p>
                <p className="text-sm text-gray-500">{formatPrice(item.price)} each &times; {item.quantity}</p>
              </div>
              <p className="font-semibold text-gray-900 shrink-0">{formatPrice(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>

        <div className="border-t border-gray-200 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Shipping</span>
            <span>To be confirmed by seller</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </section>

      {/* ── Delivery Details ── */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Delivery Details</h2>
          <Link href="/checkout/delivery" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Edit
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Name</p>
            <p className="font-medium text-gray-900">{delivery.customerName}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{delivery.customerEmail}</p>
          </div>
          <div>
            <p className="text-gray-500">Phone</p>
            <p className="font-medium text-gray-900">{delivery.customerPhone}</p>
          </div>
          <div>
            <p className="text-gray-500">Address</p>
            <p className="font-medium text-gray-900">
              {delivery.deliveryAddress}, {delivery.deliveryCity},{' '}
              {delivery.deliveryState} {delivery.deliveryZip}
            </p>
          </div>
        </div>
      </section>

      {/* ── Notice ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 text-sm text-amber-800">
        <strong>Note:</strong> Your order will not be placed until payment is successfully completed in the next step.
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-4">
        <Link href="/checkout/delivery" className="flex-1">
          <Button variant="secondary" className="w-full">Edit Details</Button>
        </Link>
        <Link href="/checkout/payment" className="flex-1">
          <Button className="w-full">Proceed to Payment</Button>
        </Link>
      </div>
    </div>
  )
}
