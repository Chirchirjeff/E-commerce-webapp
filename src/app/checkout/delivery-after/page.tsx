'use client'
'use client'

/**
 * /checkout/delivery-after
 *
 * Shown immediately after a successful M-Pesa payment.
 * Collects a delivery address so the seller knows where to ship.
 *
 * Works for both authenticated and guest buyers:
 * - Authenticated: standard JWT authorisation.
 * - Guest: the unguessable trackingToken stored in checkoutStore acts as
 *   proof-of-purchase and authorises the PATCH call without an account.
 *
 * Pre-fills fields from the checkout delivery details when available.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { useAuthStore } from '@/stores/authStore'
import { ordersAPI } from '@/lib/api'
import Button from '@/components/ui/Button'

function inputClass(hasError?: boolean) {
  return `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm ${
    hasError ? 'border-red-500' : 'border-gray-300'
  }`
}

export default function DeliveryAfterPage() {
  const router = useRouter()

  const pendingOrderId            = useCheckoutStore((state) => state.pendingOrderId)
  const pendingOrderTrackingToken = useCheckoutStore((state) => state.pendingOrderTrackingToken)
  const setPendingOrderId         = useCheckoutStore((state) => state.setPendingOrderId)
  const setPendingOrderTrackingToken = useCheckoutStore((state) => state.setPendingOrderTrackingToken)
  const setOrderShopToken         = useCheckoutStore((state) => state.setOrderShopToken)
  const shopToken                 = useCheckoutStore((state) => state.shopToken)
  // If the buyer already entered delivery details during checkout, pre-fill them
  const savedDelivery             = useCheckoutStore((state) => state.delivery)

  const user = useAuthStore((state) => state.user)

  const [address, setAddress] = useState(savedDelivery?.deliveryAddress && savedDelivery.deliveryAddress !== 'To be confirmed' ? savedDelivery.deliveryAddress : '')
  const [city, setCity]       = useState(savedDelivery?.deliveryCity || '')
  const [state, setState]     = useState(savedDelivery?.deliveryState || '')
  const [zip, setZip]         = useState(savedDelivery?.deliveryZip || '')
  const [name, setName]       = useState(savedDelivery?.customerName || user?.name || '')
  const [phone, setPhone]     = useState(savedDelivery?.customerPhone || user?.phone || '')

  const [errors, setErrors]       = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError]   = useState('')
  const [hydrated, setHydrated]   = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  // Redirect to home when there is no pending order (direct navigation / already submitted)
  useEffect(() => {
    if (hydrated && !pendingOrderId) router.replace('/')
  }, [hydrated, pendingOrderId, router])

  if (!hydrated || !pendingOrderId) return null

  // Check if delivery is already fully captured (authenticated flow with saved address)
  // in which case the address fields will be pre-filled and valid
  const hasPrefilledAddress = !!(address && city && name && phone)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!address.trim()) e.address = 'Street / building address is required'
    if (!city.trim())    e.city    = 'Town or city is required'
    if (!name.trim())    e.name    = 'Recipient name is required'
    if (!phone.trim())   e.phone   = 'Phone number is required'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setApiError('')
    setSubmitting(true)
    try {
      await ordersAPI.updateDelivery(pendingOrderId, {
        deliveryAddress: address.trim(),
        deliveryCity:    city.trim(),
        deliveryState:   state.trim() || city.trim(),
        deliveryZip:     zip.trim() || '00100',
        deliveryName:    name.trim(),
        deliveryPhone:   phone.trim(),
        // Guest proof-of-purchase — backend accepts this in lieu of a JWT
        ...(pendingOrderTrackingToken ? { trackingToken: pendingOrderTrackingToken } : {}),
      })
      if (shopToken) setOrderShopToken(pendingOrderId, shopToken)
      const id = pendingOrderId
      const token = pendingOrderTrackingToken
      setPendingOrderId(null)
      setPendingOrderTrackingToken(null)
      // Navigate to order confirmation — guests use tracking token, auth buyers use order ID
      if (token && !user) {
        router.replace(`/order/${id}?trackingToken=${encodeURIComponent(token)}&new=1`)
      } else {
        router.replace(`/order/${id}?new=1`)
      }
    } catch (err: any) {
      setApiError(
        err?.response?.data?.message || err?.message || 'Could not save your address. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = () => {
    if (shopToken) setOrderShopToken(pendingOrderId, shopToken)
    const id = pendingOrderId
    const token = pendingOrderTrackingToken
    setPendingOrderId(null)
    setPendingOrderTrackingToken(null)
    if (token && !user) {
      router.replace(`/order/${id}?trackingToken=${encodeURIComponent(token)}&new=1`)
    } else {
      router.replace(`/order/${id}?new=1`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Success badge */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Payment confirmed! 🎉</h1>
          <p className="text-gray-500 mt-2 text-sm max-w-sm">
            {hasPrefilledAddress
              ? 'Your order is placed. Confirm your delivery address below.'
              : 'Your order is placed. Enter your delivery address so the seller knows where to send it.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Where should we deliver?</h2>

          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Recipient */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })) }}
                  className={inputClass(!!errors.name)}
                  placeholder="Jane Doe"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: '' })) }}
                  className={inputClass(!!errors.phone)}
                  placeholder="0712 345 678"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>
            </div>

            {/* Street address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street / Building Address *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setErrors((p) => ({ ...p, address: '' })) }}
                className={inputClass(!!errors.address)}
                placeholder="123 Moi Avenue, Apt 4B"
              />
              {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
            </div>

            {/* City + State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Town / City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setErrors((p) => ({ ...p, city: '' })) }}
                  className={inputClass(!!errors.city)}
                  placeholder="Nairobi"
                />
                {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">County / Region</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={inputClass()}
                  placeholder="Nairobi County"
                />
              </div>
            </div>

            {/* Postal code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className={inputClass()}
                placeholder="00100"
              />
            </div>

            <Button type="submit" className="w-full py-3" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save delivery address'}
            </Button>
          </form>

          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSkip}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              I&apos;ll add my address later — go to my order →
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          Your payment was received. This step only helps the seller know where to deliver.
        </p>
      </div>
    </div>
  )
}
