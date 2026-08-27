'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { ordersAPI } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Order } from '@/types'
import { useCheckoutStore } from '@/stores/checkoutStore'

// ─── Status pipeline ──────────────────────────────────────────────────────────

const STATUSES = [
  {
    key: 'paid',
    label: 'Payment Confirmed',
    description: 'Your payment has been received.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'processing',
    label: 'Processing',
    description: 'The seller is preparing your order.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
      </svg>
    ),
  },
  {
    key: 'dispatched',
    label: 'Dispatched',
    description: 'Your order is on its way.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Your order has been delivered.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
]

// Map every possible backend status to where it sits in the pipeline
const STATUS_INDEX: Record<string, number> = {
  pending:    -1, // before payment
  paid:        0,
  processing:  1,
  dispatched:  2,
  delivered:   3,
  cancelled:  -2,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Full-width animated banner shown immediately after a successful M-Pesa payment.
 * Triggered by the `?new=1` query param that the processing page appends on redirect.
 * Auto-dismisses after 8 seconds; user can also close it manually.
 */
function SuccessBanner({ order, trackingUrl }: { order: Order; trackingUrl: string }) {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => dismiss(), 8_000)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    setLeaving(true)
    setTimeout(() => setVisible(false), 400)
  }

  if (!visible) return null

  return (
    <div
      className={`rounded-2xl overflow-hidden mb-8 transition-all duration-400
        ${leaving ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}
      style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)' }}
      role="status"
      aria-live="polite"
    >
      {/* Subtle decorative circles */}
      <div className="relative px-6 py-7 sm:px-8 sm:py-8 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative flex items-start gap-5">
          {/* Animated checkmark badge */}
          <div className="shrink-0 w-14 h-14 rounded-full bg-white/15 flex items-center justify-center ring-4 ring-white/20">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-sm font-medium mb-0.5">Payment confirmed</p>
            <h2 className="text-white text-xl sm:text-2xl font-bold tracking-tight">
              Your order is placed!
            </h2>
            <p className="text-white/80 text-sm mt-1.5 leading-relaxed">
              Order <span className="font-mono font-semibold">{order.orderNumber}</span> has been
              received and the seller is being notified.
              {order.customerEmail && (
                <> A copy will be sent to <span className="font-medium">{order.customerEmail}</span>.</>
              )}
            </p>

            {/* M-Pesa receipt pill */}
            {order.mpesaReceiptNumber && (
              <div className="mt-3 inline-flex items-center gap-2 bg-white/15 rounded-full px-3.5 py-1.5">
                <svg className="w-3.5 h-3.5 text-green-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-white/70">M-Pesa receipt</span>
                <span className="text-xs font-mono font-bold text-white tracking-wider">
                  {order.mpesaReceiptNumber}
                </span>
              </div>
            )}

            {/* Tracking link — bookmark this to check status later */}
            <div className="mt-4 flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-white/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/60 mb-0.5">Your tracking link — bookmark or share it</p>
                <p className="text-xs font-mono text-white/90 truncate">{trackingUrl}</p>
              </div>
              <CopyBannerButton text={trackingUrl} />
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={dismiss}
            className="shrink-0 text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="h-0.5 bg-white/10">
        <div
          className="h-full bg-white/40 origin-left"
          style={{ animation: 'shrink-width 8s linear forwards' }}
        />
      </div>

      <style jsx>{`
        @keyframes shrink-width {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    paid:        'bg-blue-100 text-blue-800',
    processing:  'bg-yellow-100 text-yellow-800',
    dispatched:  'bg-purple-100 text-purple-800',
    delivered:   'bg-green-100 text-green-800',
    cancelled:   'bg-red-100 text-red-800',
    pending:     'bg-gray-100 text-gray-600',
  }
  const colour = colours[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${colour}`}>
      {status}
    </span>
  )
}

function Timeline({ status }: { status: string }) {
  const currentIdx = STATUS_INDEX[status] ?? 0

  if (status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-red-800">Order Cancelled</p>
          <p className="text-sm text-red-600 mt-0.5">This order has been cancelled.</p>
        </div>
      </div>
    )
  }

  return (
    <ol className="relative">
      {STATUSES.map((step, idx) => {
        const isDone    = idx <= currentIdx
        const isCurrent = idx === currentIdx
        const isLast    = idx === STATUSES.length - 1

        return (
          <li key={step.key} className="flex gap-4">
            {/* Spine */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors
                ${isDone
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'bg-white border-gray-200 text-gray-300'
                }
                ${isCurrent ? 'ring-4 ring-primary-100' : ''}
              `}>
                {step.icon}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 my-1 min-h-[2rem] rounded-full transition-colors
                  ${idx < currentIdx ? 'bg-primary-600' : 'bg-gray-200'}`}
                />
              )}
            </div>

            {/* Label */}
            <div className="pb-6 pt-1.5 min-w-0">
              <p className={`font-semibold text-sm ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.label}
              </p>
              <p className={`text-xs mt-0.5 ${isCurrent ? 'text-primary-600' : isDone ? 'text-gray-500' : 'text-gray-300'}`}>
                {isCurrent ? step.description : isDone ? 'Completed' : 'Pending'}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function CopyBannerButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white/80 bg-white/15 hover:bg-white/25 rounded-lg transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy link
        </>
      )}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderTrackingPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const orderId      = params.orderId as string
  const isNewOrder   = searchParams.get('new') === '1'

  // shopToken survives clearCheckout() — used to send the buyer back to the
  // correct shop storefront after their cart has been cleared.
  const shopToken = useCheckoutStore((state) => state.shopToken)

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await ordersAPI.getOne(orderId)
      return res.data as Order
    },
    enabled: !!orderId,
    // Re-fetch every 30 s so the status updates automatically after the
    // seller marks it dispatched / delivered — no manual refresh needed
    refetchInterval: 30_000,
  })

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-40 bg-gray-200 rounded-xl" />
            <div className="h-40 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h1>
        <p className="text-gray-500 mb-8">
          This link may be invalid or the order doesn&apos;t exist.
        </p>
        <Link href={shopToken ? `/${shopToken}` : '/'}><Button variant="secondary">Back to Shop</Button></Link>
      </div>
    )
  }

  // ── Build URLs ───────────────────────────────────────────────────────────
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  // Prefer the public /track/:token URL (no internal UUID exposed).
  // Fall back to /order/:id if the backend hasn't returned a trackingToken yet.
  const trackingUrl = order.trackingToken
    ? `${origin}/track/${order.trackingToken}`
    : `${origin}/order/${order.id}`

  // Where "Continue Shopping" should go — back to the buyer's shop storefront.
  const shopHref = shopToken ? `/${shopToken}` : '/'

  const hasDelivery = order.deliveryAddress || order.deliveryCity
  const hasTracking = order.trackingNumber || order.shippingCarrier

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Payment success banner (shown once, on fresh redirect from checkout) ── */}
      {isNewOrder && <SuccessBanner order={order} trackingUrl={trackingUrl} />}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-gray-500 mb-1">
            {order.shop?.name ?? 'Order'} &bull; {formatDate(order.createdAt)}
          </p>
          <h1 className="text-3xl font-bold text-gray-900 font-mono tracking-wide">
            {order.orderNumber}
          </h1>
          <div className="mt-2">
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Shareable tracking link — uses /track/:token so no internal UUID is exposed */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 min-w-0">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-xs text-gray-500 truncate hidden sm:block max-w-[200px]">
            {trackingUrl}
          </span>
          <CopyButton text={trackingUrl} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: timeline + tracking info ── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Status timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
              Order Status
            </h2>
            <Timeline status={order.status} />
          </div>

          {/* Shipping / carrier info — shown once dispatched */}
          {hasTracking && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Shipping Info
              </h2>
              <dl className="space-y-3 text-sm">
                {order.shippingCarrier && (
                  <div>
                    <dt className="text-gray-500">Carrier</dt>
                    <dd className="font-medium text-gray-900 mt-0.5">{order.shippingCarrier}</dd>
                  </div>
                )}
                {order.trackingNumber && (
                  <div>
                    <dt className="text-gray-500">Tracking Number</dt>
                    <dd className="font-mono font-semibold text-gray-900 mt-0.5">{order.trackingNumber}</dd>
                  </div>
                )}
                {order.dispatchedAt && (
                  <div>
                    <dt className="text-gray-500">Dispatched</dt>
                    <dd className="font-medium text-gray-900 mt-0.5">{formatDate(order.dispatchedAt)}</dd>
                  </div>
                )}
                {order.estimatedDelivery && (
                  <div>
                    <dt className="text-gray-500">Estimated Delivery</dt>
                    <dd className="font-medium text-primary-600 mt-0.5">{formatDate(order.estimatedDelivery)}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Payment */}
          {order.mpesaReceiptNumber && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-green-800 uppercase tracking-wider mb-3">
                Payment
              </h2>
              <p className="text-xs text-green-700 mb-1">M-Pesa Receipt</p>
              <p className="font-mono font-bold text-green-900 text-base tracking-wider">
                {order.mpesaReceiptNumber}
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT: order details ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Items
            </h2>
            <ul className="divide-y divide-gray-100">
              {order.items?.map((item, i) => (
                <li key={i} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  {/* Thumbnail */}
                  <div className="relative w-14 h-14 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                    {item.product?.thumbnailUrl ? (
                      <Image
                        src={item.product.thumbnailUrl}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Name + qty */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {item.product?.name ?? 'Product'}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatPrice(item.price)} &times; {item.quantity}
                    </p>
                  </div>

                  {/* Subtotal */}
                  <p className="font-semibold text-gray-900 shrink-0">
                    {formatPrice(item.subtotal ?? item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            {/* Total */}
            <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
              <span className="font-semibold text-gray-700">Total paid</span>
              <span className="text-xl font-bold text-primary-600">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          {/* Delivery address */}
          {hasDelivery && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Delivery Address
              </h2>
              <address className="not-italic text-sm space-y-0.5">
                <p className="font-medium text-gray-900">{order.customerName}</p>
                {order.deliveryAddress && <p className="text-gray-600">{order.deliveryAddress}</p>}
                {(order.deliveryCity || order.deliveryState) && (
                  <p className="text-gray-600">
                    {[order.deliveryCity, order.deliveryState, order.deliveryZip]
                      .filter(Boolean).join(', ')}
                  </p>
                )}
                {order.customerPhone && (
                  <p className="text-gray-500 mt-1">{order.customerPhone}</p>
                )}
              </address>
            </div>
          )}

          {/* Customer info (always shown for receipt purposes) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Customer
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{order.customerPhone}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{order.customerEmail}</dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link href={shopHref}>
              <Button variant="secondary">Continue Shopping</Button>
            </Link>
            <Button onClick={() => window.print()}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Receipt
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Auto-refresh notice ── */}
      <p className="text-center text-xs text-gray-400 mt-10">
        This page refreshes automatically every 30 seconds &bull; bookmark this link to check back anytime
      </p>
    </div>
  )
}
