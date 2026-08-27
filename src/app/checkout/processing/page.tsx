'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/stores/cartStore'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { mpesaAPI, MpesaStatusResponse } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress'
import Button from '@/components/ui/Button'

// Safaricom STK push prompts expire in ~3 minutes; allow the full window
const POLL_INTERVAL_MS  = 3_000
const POLL_TIMEOUT_MS   = 3 * 60_000   // 3 minutes
const FIRST_POLL_DELAY  = 1_000        // check quickly after landing

function Spinner({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={`animate-spin ${className}`} aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

/** Animated ring that drains over `durationMs` */
function CountdownRing({ durationMs, elapsed }: { durationMs: number; elapsed: number }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(elapsed / durationMs, 1)
  const dashOffset = circumference * (1 - progress)
  const secondsLeft = Math.max(0, Math.ceil((durationMs - elapsed) / 1000))

  return (
    <div className="relative w-16 h-16 mx-auto mb-5">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        {/* Track */}
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        {/* Progress */}
        <circle
          cx="32" cy="32" r={radius} fill="none"
          stroke="#16a34a" strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
        {secondsLeft}s
      </span>
    </div>
  )
}

type ViewState = 'waiting' | 'success' | 'error'

export default function ProcessingPage() {
  const router = useRouter()

  const getTotal    = useCartStore((state) => state.getTotal)
  const clearCart   = useCartStore((state) => state.clearCart)
  const cartShopToken = useCartStore((state) => state.shopToken)

  const checkoutRequestId   = useCheckoutStore((state) => state.checkoutRequestId)
  const mpesaPhone          = useCheckoutStore((state) => state.mpesaPhone)
  const reservedOrderNumber = useCheckoutStore((state) => state.orderNumber)
  const clearCheckout       = useCheckoutStore((state) => state.clearCheckout)
  const setShopToken        = useCheckoutStore((state) => state.setShopToken)

  const [view, setView]     = useState<ViewState>('waiting')
  const [status, setStatus] = useState<MpesaStatusResponse | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const pollingRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickRef         = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollingStartRef = useRef<number>(Date.now())

  // Guard: must have a request ID
  useEffect(() => {
    if (!checkoutRequestId) router.replace('/checkout/payment')
  }, [checkoutRequestId, router])

  // 1-second elapsed ticker so the countdown ring animates smoothly
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setElapsed(Date.now() - pollingStartRef.current)
    }, 1_000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [])

  const pollStatus = useCallback(async () => {
    if (!checkoutRequestId) return

    if (Date.now() - pollingStartRef.current > POLL_TIMEOUT_MS) {
      setStatus({
        status: 'TIMEOUT',
        orderId: null,
        orderNumber: reservedOrderNumber,
        resultDescription: 'The M-Pesa prompt expired. Please try again.',
        mpesaReceiptNumber: null,
        trackingToken: null,
      })
      setView('error')
      return
    }

    try {
      const res  = await mpesaAPI.getStatus(checkoutRequestId)
      const data = res.data

      if (data.status === 'PENDING') {
        pollingRef.current = setTimeout(pollStatus, POLL_INTERVAL_MS)
      } else {
        setStatus(data)
        if (data.status === 'SUCCESS') {
          // Save the shop token before clearing stores — it survives clearCheckout()
          // and lets the order confirmation page send the buyer back to the right shop.
          if (cartShopToken) setShopToken(cartShopToken)
          clearCart()
          clearCheckout()
          if (data.orderId) {
            router.replace(`/order/${data.orderId}?new=1`)
          } else {
            setView('success')
          }
        } else {
          setView('error')
        }
      }
    } catch {
      // Network hiccup — keep retrying until timeout
      pollingRef.current = setTimeout(pollStatus, POLL_INTERVAL_MS)
    }
  }, [checkoutRequestId, cartShopToken, setShopToken, clearCart, clearCheckout, reservedOrderNumber, router])

  useEffect(() => {
    if (!checkoutRequestId) return
    pollingStartRef.current = Date.now()
    // First check after 1 s (not 3 s) so fast payments feel instant
    pollingRef.current = setTimeout(pollStatus, FIRST_POLL_DELAY)
    return () => { if (pollingRef.current) clearTimeout(pollingRef.current) }
  }, [checkoutRequestId, pollStatus])

  if (!checkoutRequestId) return null

  const total = getTotal()

  // ── Waiting ────────────────────────────────────────────────────────────────
  if (view === 'waiting') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CheckoutProgress current="payment" />
        <div className="max-w-md mx-auto text-center py-12">

          <CountdownRing durationMs={POLL_TIMEOUT_MS} elapsed={elapsed} />

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your phone</h1>
          <p className="text-gray-600 mb-4">
            A payment request of <strong>{formatPrice(total)}</strong> has been sent
            to <strong>{mpesaPhone}</strong>.
            <br className="hidden sm:block" />
            Open your M-Pesa menu and enter your PIN to complete the payment.
          </p>

          {/* Show reserved order number so the buyer can reference it */}
          {reservedOrderNumber && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-sm">
              <p className="text-gray-500">Your order reference</p>
              <p className="font-mono font-bold text-gray-900 text-base tracking-wide mt-0.5">
                {reservedOrderNumber}
              </p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 text-left">
            <svg className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-yellow-800">
              Do not close this page — it updates automatically once your PIN is confirmed.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Error / Cancelled / Timeout ────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CheckoutProgress current="payment" />
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {status?.status === 'CANCELLED' ? 'Payment Cancelled' : 'Payment Failed'}
        </h1>
        <p className="text-gray-600 mb-8">
          {status?.resultDescription || 'Something went wrong. Please try again.'}
        </p>
        <div className="flex gap-3">
          <Link href="/checkout/delivery" className="flex-1">
            <Button variant="secondary" className="w-full">Edit Details</Button>
          </Link>
          <Link href="/checkout/payment" className="flex-1">
            <Button className="w-full">Try Again</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
