'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/stores/cartStore'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { useAuthStore } from '@/stores/authStore'
import { mpesaAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress'
import Button from '@/components/ui/Button'

/**
 * Validate a Kenyan phone number.
 * Accepts: 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX, 2547XXXXXXXX
 */
function validateKenyanPhone(value: string): string | null {
  const cleaned = value.replace(/\s+/g, '')
  if (!cleaned) return 'Phone number is required'
  if (!/^(\+?254|0)[17]\d{8}$/.test(cleaned)) {
    return 'Enter a valid Kenyan number (e.g. 0712 345 678)'
  }
  return null
}

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      className="animate-spin text-white" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

export default function PaymentPage() {
  const router = useRouter()

  const items    = useCartStore((state) => state.items)
  const getTotal = useCartStore((state) => state.getTotal)
  const shopId   = useCartStore((state) => state.shopId)

  const delivery            = useCheckoutStore((state) => state.delivery)
  const deliveryBuyerId     = useCheckoutStore((state) => state.deliveryBuyerId)
  const buyerId             = useAuthStore((state) => state.user?.id)
  const savedPhone          = useCheckoutStore((state) => state.mpesaPhone)
  const setMpesaPhone       = useCheckoutStore((state) => state.setMpesaPhone)
  const setCheckoutRequestId = useCheckoutStore((state) => state.setCheckoutRequestId)
  const setOrderNumber      = useCheckoutStore((state) => state.setOrderNumber)

  const [phone, setPhone]     = useState(savedPhone || delivery?.customerPhone || '')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError]   = useState<string | null>(null)

  // Guard: must have delivery details
  useEffect(() => {
    if (!delivery || deliveryBuyerId !== buyerId) router.replace('/checkout/delivery')
  }, [delivery, deliveryBuyerId, buyerId, router])

  if (!delivery || deliveryBuyerId !== buyerId || items.length === 0) return null

  const total = getTotal()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateKenyanPhone(phone)
    if (err) { setPhoneError(err); return }
    setPhoneError(null)
    setApiError(null)
    setIsSubmitting(true)

    try {
      const response = await mpesaAPI.initiateStkPush({
        phoneNumber: phone.replace(/\s+/g, ''),
        amount: total,
        orderPayload: {
          customerName:    delivery.customerName,
          customerEmail:   delivery.customerEmail,
          customerPhone:   delivery.customerPhone,
          deliveryAddress: delivery.deliveryAddress,
          deliveryCity:    delivery.deliveryCity,
          deliveryState:   delivery.deliveryState,
          deliveryZip:     delivery.deliveryZip,
          shopId:          shopId!,
          items: items.map((item) => ({
            productId: item.productId,
            quantity:  item.quantity,
            price:     item.price,
          })),
          total,
        },
      })

      // Persist phone + request ID + order number before navigating
      setMpesaPhone(phone)
      setCheckoutRequestId(response.data.checkoutRequestId)
      setOrderNumber(response.data.orderNumber)
      router.push('/checkout/processing')
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not initiate payment. Please try again.'
      setApiError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CheckoutProgress current="payment" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ── M-Pesa Form ── */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Pay with M-Pesa</h2>
            <p className="text-sm text-gray-500 text-center">
              Enter the M-Pesa number to receive the payment prompt. You will be asked to enter
              your PIN on your phone.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="mpesaPhone" className="block text-sm font-medium text-gray-700 mb-1">
                M-Pesa Phone Number *
              </label>
              <input
                id="mpesaPhone"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneError(null) }}
                className={`w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  phoneError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0712 345 678"
                autoComplete="tel"
              />
              {phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
              <p className="mt-1 text-xs text-gray-400">
                Accepted: 07XXXXXXXX · 01XXXXXXXX · 254XXXXXXXXX
              </p>
            </div>

            {/* Amount summary */}
            <div className="bg-gray-50 rounded-lg p-3 flex justify-between text-sm">
              <span className="text-gray-600">Amount to pay</span>
              <span className="font-semibold text-gray-900">{formatPrice(total)}</span>
            </div>

            {/* API-level error */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {apiError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Link href="/checkout/review" className="flex-1">
                <Button variant="secondary" className="w-full" type="button">Back</Button>
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><Spinner /> Sending&hellip;</>
                ) : (
                  'Send Payment Request'
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ── Order recap ── */}
        <aside className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto text-sm text-gray-600">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between">
                <span>{item.product?.name || 'Product'} &times; {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-800 text-center">Secure payment via M-Pesa</p>
          </div>

          {/* Delivery recap */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
            <p className="text-gray-500 mb-1">Delivering to</p>
            <p className="font-medium text-gray-900">{delivery.customerName}</p>
            <p className="text-gray-600">{delivery.deliveryAddress}</p>
            <p className="text-gray-600">{delivery.deliveryCity}, {delivery.deliveryState}</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
