'use client'

/**
 * QuickPayModal
 *
 * Adaptive quick-pay sheet:
 * - Authenticated buyer with saved address → pre-fills name, phone, address.
 *   The first field visible is the M-Pesa number (pre-filled from their profile).
 * - Guest / no saved address → asks for the minimum: name, phone, delivery address,
 *   then M-Pesa number.
 *
 * After the STK push is sent the buyer is navigated to /checkout/processing.
 */

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, ChevronDown } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { useAuthStore } from '@/stores/authStore'
import { mpesaAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function validateKenyanPhone(value: string): string | null {
  const cleaned = value.replace(/\s+/g, '')
  if (!cleaned) return 'Phone number is required'
  if (!/^(\+?254|0)[17]\d{8}$/.test(cleaned)) {
    return 'Enter a valid Kenyan number (e.g. 0712 345 678)'
  }
  return null
}

function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      className="animate-spin" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

export interface QuickPayModalProps {
  isOpen: boolean
  onClose: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuickPayModal({ isOpen, onClose }: QuickPayModalProps) {
  const router = useRouter()

  const items    = useCartStore((state) => state.items)
  const getTotal = useCartStore((state) => state.getTotal)
  const shopId   = useCartStore((state) => state.shopId)
  const shopToken = useCartStore((state) => state.shopToken)

  const setCheckoutRequestId = useCheckoutStore((state) => state.setCheckoutRequestId)
  const setOrderNumber       = useCheckoutStore((state) => state.setOrderNumber)
  const setMpesaPhone        = useCheckoutStore((state) => state.setMpesaPhone)
  const setShopToken         = useCheckoutStore((state) => state.setShopToken)
  const setDelivery          = useCheckoutStore((state) => state.setDelivery)

  const user = useAuthStore((state) => state.user)

  // ── Derive default values from authenticated buyer's profile ─────────────────
  const defaultAddress = useMemo(
    () => user?.addresses?.find((a) => a.isDefault) ?? user?.addresses?.[0] ?? null,
    [user]
  )

  const isAuthenticated = !!user

  // For authenticated buyers with a default address, we show a compact summary
  // and only ask for the M-Pesa number.
  const hasFullDetails = !!(
    isAuthenticated &&
    defaultAddress &&
    (user.name || defaultAddress.recipientName) &&
    (user.phone || defaultAddress.phone) &&
    defaultAddress.addressLine &&
    defaultAddress.city
  )

  // Contact / delivery fields (only shown for guest or incomplete profiles)
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity]       = useState('')

  // M-Pesa phone — always shown
  const [mpesaPhone, setMpesaPhoneState]     = useState('')
  const [mpesaPhoneError, setMpesaPhoneError] = useState('')

  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showDetails, setShowDetails] = useState(false)

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Reset and pre-fill when reopened
  useEffect(() => {
    if (!isOpen) return
    setMpesaPhoneError('')
    setError('')
    setLoading(false)
    setShowDetails(false)

    if (hasFullDetails) {
      // Pre-fill M-Pesa phone from buyer's profile
      setMpesaPhoneState(user?.phone || defaultAddress?.phone || '')
    } else if (isAuthenticated && user) {
      // Partial profile — pre-fill what we have
      setName(user.name || '')
      setPhone(user.phone || '')
      setAddress(defaultAddress?.addressLine || '')
      setCity(defaultAddress?.city || '')
      setMpesaPhoneState(user.phone || '')
    } else {
      // Guest — blank slate
      setName('')
      setPhone('')
      setAddress('')
      setCity('')
      setMpesaPhoneState('')
    }
  }, [isOpen, hasFullDetails, isAuthenticated, user, defaultAddress])

  if (!isOpen) return null

  const total = getTotal()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const phoneErr = validateKenyanPhone(mpesaPhone)
    if (phoneErr) { setMpesaPhoneError(phoneErr); return }
    setMpesaPhoneError('')
    setError('')
    setLoading(true)

    const cleanPhone = mpesaPhone.replace(/\s+/g, '')

    // Build delivery details based on buyer state
    let contactName: string
    let contactPhone: string
    let contactEmail: string | null
    let deliveryAddress: string
    let deliveryCity: string
    let deliveryState: string
    let deliveryZip: string

    if (hasFullDetails && defaultAddress) {
      contactName    = user!.name || defaultAddress.recipientName
      contactPhone   = cleanPhone
      contactEmail   = user!.email || null
      deliveryAddress = defaultAddress.addressLine
      deliveryCity   = defaultAddress.city
      deliveryState  = defaultAddress.state || defaultAddress.city
      deliveryZip    = defaultAddress.postalCode || '00100'
    } else {
      contactName    = (isAuthenticated ? user!.name : name).trim() || 'Guest'
      contactPhone   = cleanPhone
      contactEmail   = isAuthenticated ? user!.email || null : null
      deliveryAddress = (isAuthenticated ? defaultAddress?.addressLine || address : address).trim() || 'To be confirmed'
      deliveryCity   = (isAuthenticated ? defaultAddress?.city || city : city).trim() || 'Nairobi'
      deliveryState  = deliveryCity
      deliveryZip    = (isAuthenticated ? defaultAddress?.postalCode : undefined) || '00100'
    }

    // Save delivery details to checkoutStore so processing/delivery-after pages have them
    setDelivery({
      customerName: contactName,
      customerEmail: contactEmail || '',
      customerPhone: contactPhone,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryZip,
    }, user?.id ?? null)

    try {
      const response = await mpesaAPI.initiateStkPush({
        phoneNumber: cleanPhone,
        amount: total,
        orderPayload: {
          customerName: contactName,
          customerEmail: contactEmail,
          customerPhone: contactPhone,
          deliveryAddress,
          deliveryCity,
          deliveryState,
          deliveryZip,
          shopId: shopId!,
          items: items.map((item) => ({
            productId: item.productId,
            quantity:  item.quantity,
            price:     item.price,
          })),
          total,
          // Link order to buyer account when authenticated
          buyerId: user?.id ?? null,
        },
      })

      if (shopToken) setShopToken(shopToken)
      setMpesaPhone(cleanPhone)
      setCheckoutRequestId(response.data.checkoutRequestId)
      setOrderNumber(response.data.orderNumber)
      onClose()
      router.push('/checkout/processing')
    } catch (err: any) {
      const raw: unknown = err?.response?.data?.message
      const detail = Array.isArray(raw) ? raw[0] : typeof raw === 'string' ? raw : null
      const isTechnical = typeof detail === 'string' &&
        (detail.includes('{') || detail.includes('errorCode') || detail.includes('STK push'))
      setError(isTechnical || !detail
        ? 'Payment request failed. Please check your number and try again.'
        : detail
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-base font-bold text-gray-900">Pay with M-Pesa</h2>
              <p className="text-xs text-gray-500 mt-0.5">Total: {formatPrice(total)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 py-5 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Authenticated with full details — compact delivery summary */}
            {hasFullDetails && defaultAddress && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user!.name}</p>
                    <p className="text-gray-500 text-xs truncate">
                      {defaultAddress.addressLine}, {defaultAddress.city}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDetails((v) => !v)}
                    className="shrink-0 flex items-center gap-0.5 text-xs text-primary-600 font-medium hover:underline"
                  >
                    Change
                    <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Guest or expanded details section */}
            {(!hasFullDetails || showDetails) && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={isAuthenticated ? (user?.name || name) : name}
                    onChange={(e) => { if (!isAuthenticated) setName(e.target.value) }}
                    readOnly={isAuthenticated && !!user?.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    value={isAuthenticated ? (defaultAddress?.addressLine || address) : address}
                    onChange={(e) => { if (!isAuthenticated) setAddress(e.target.value) }}
                    readOnly={isAuthenticated && !!defaultAddress?.addressLine}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="123 Moi Avenue, Apt 4B"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Town / City *</label>
                  <input
                    type="text"
                    value={isAuthenticated ? (defaultAddress?.city || city) : city}
                    onChange={(e) => { if (!isAuthenticated) setCity(e.target.value) }}
                    readOnly={isAuthenticated && !!defaultAddress?.city}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="Nairobi"
                  />
                </div>
                {showDetails && (
                  <p className="text-xs text-primary-600 text-center">
                    To update your address,{' '}
                    <a href="/account" className="underline">manage it in your account</a>.
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  M-Pesa Phone Number *
                </label>
                <input
                  type="tel"
                  value={mpesaPhone}
                  onChange={(e) => { setMpesaPhoneState(e.target.value); setMpesaPhoneError('') }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg ${
                    mpesaPhoneError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0712 345 678"
                  autoComplete="tel"
                  autoFocus={!hasFullDetails}
                  required
                  disabled={loading}
                />
                {mpesaPhoneError && <p className="mt-1 text-sm text-red-600">{mpesaPhoneError}</p>}
                <p className="mt-1 text-xs text-gray-400">
                  You'll get a prompt to enter your M-Pesa PIN on this number.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between text-sm">
                <span className="text-green-800 font-medium">Amount to pay</span>
                <span className="font-bold text-green-900">{formatPrice(total)}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Spinner /> Sending payment request…</>
                ) : (
                  '🔒 Pay with M-Pesa'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
