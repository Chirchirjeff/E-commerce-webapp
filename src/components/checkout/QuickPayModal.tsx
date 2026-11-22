'use client'

/**
 * QuickPayModal
 *
 * Asks for nothing but the buyer's M-Pesa phone number, then fires the STK push.
 * No account, no email, no delivery details upfront — just pay.
 *
 * After the STK push is sent the buyer is navigated to /checkout/processing
 * where they enter their PIN.
 */

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import { useCheckoutStore } from '@/stores/checkoutStore'
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

// ── Types ─────────────────────────────────────────────────────────────────────

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

  const [phone, setPhone]           = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Reset when reopened
  useEffect(() => {
    if (isOpen) {
      setPhone('')
      setPhoneError('')
      setError('')
      setLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const total = getTotal()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const err = validateKenyanPhone(phone)
    if (err) { setPhoneError(err); return }
    setPhoneError('')
    setError('')
    setLoading(true)

    const cleanPhone = phone.replace(/\s+/g, '')

    try {
      const response = await mpesaAPI.initiateStkPush({
        phoneNumber: cleanPhone,
        amount: total,
        orderPayload: {
          customerName:    'Guest',
          customerEmail:   null,
          customerPhone:   cleanPhone,
          deliveryAddress: 'To be confirmed',
          deliveryCity:    'Nairobi',
          deliveryState:   'Nairobi',
          deliveryZip:     '00100',
          shopId:          shopId!,
          items: items.map((item) => ({
            productId: item.productId,
            quantity:  item.quantity,
            price:     item.price,
          })),
          total,
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
      // Show the first item if it's an array, otherwise fall back to a clean generic message
      const detail = Array.isArray(raw) ? raw[0] : typeof raw === 'string' ? raw : null
      // Never show raw Safaricom JSON or internal error details to the buyer
      const isTechnical = typeof detail === 'string' && (
        detail.includes('{') || detail.includes('errorCode') || detail.includes('STK push')
      )
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

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  M-Pesa Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setPhoneError('') }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg ${
                    phoneError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0712 345 678"
                  autoComplete="tel"
                  autoFocus
                  required
                  disabled={loading}
                />
                {phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
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
