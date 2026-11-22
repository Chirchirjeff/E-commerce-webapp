'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ordersAPI } from '@/lib/api'
import { formatDate, formatPrice } from '@/lib/utils'
import { Order } from '@/types'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useShopHref } from '@/hooks/useShopHref'
import { TrackLookupSkeleton } from '@/components/skeletons/PageSkeletons'

function TrackByOrderNumberPageContent() {
  const searchParams = useSearchParams()
  const token = useAuthStore((state) => state.token)
  const user  = useAuthStore((state) => state.user)
  const shopHref = useShopHref()

  const [orderNumber, setOrderNumber] = useState(searchParams.get('orderNumber') ?? '')
  const [order, setOrder]   = useState<Order | null>(null)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const numberFromLink = searchParams.get('orderNumber')
    if (numberFromLink) setOrderNumber(numberFromLink)
  }, [searchParams])

  const findOrder = async (event: FormEvent) => {
    event.preventDefault()
    const num = orderNumber.trim()
    if (!num) return
    setError('')
    setLoading(true)
    setOrder(null)

    try {
      if (token) {
        // Authenticated path — returns order scoped to this buyer
        const response = await ordersAPI.trackByOrderNumber(num)
        setOrder(response.data as Order)
      } else {
        // Guest path — try to find order by trackingToken if available in the
        // order number field (some confirmation emails may include the token)
        // or just attempt the authenticated endpoint and let the user know
        // they need to sign in for account-linked orders.
        setError('Please sign in to track your order, or use the tracking link from your confirmation email.')
      }
    } catch (requestError: any) {
      setOrder(null)
      const msg = requestError?.response?.data?.message
      setError(typeof msg === 'string' ? msg : 'We could not find that order. Please check the number and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <section className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900">Track your order</h1>
        <p className="mt-2 text-gray-600">
          {token
            ? `Signed in as ${user?.email}. Enter your order number to see the latest status.`
            : 'Enter your order number to track your purchase.'}
        </p>

        <form onSubmit={findOrder} className="mt-6 flex flex-col sm:flex-row gap-3">
          <input
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value.toUpperCase())}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="QZ-20261122-00001"
            aria-label="Order number"
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Finding order…' : 'Track order'}
          </Button>
        </form>

        {!token && (
          <p className="mt-3 text-sm text-gray-500">
            <Link href={`/checkout/account?next=${encodeURIComponent('/track')}`} className="text-primary-600 font-medium hover:underline">
              Sign in
            </Link>{' '}
            to access your full order history and tracking details.
          </p>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </section>

      {order && (
        <section className="mt-6 bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-start sm:justify-between border-b border-gray-200 pb-5">
            <div>
              <p className="text-sm text-gray-500">{order.shop?.name || 'Quza order'}</p>
              <h2 className="mt-1 font-mono text-2xl font-bold text-gray-900">{order.orderNumber}</h2>
            </div>
            <span className="inline-flex w-fit rounded-full bg-green-100 px-3 py-1 text-sm font-semibold capitalize text-green-800">{order.status}</span>
          </div>
          <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-gray-500">Placed</dt><dd className="font-medium text-gray-900">{formatDate(order.createdAt)}</dd></div>
            {order.estimatedDelivery && <div><dt className="text-gray-500">Estimated delivery</dt><dd className="font-medium text-gray-900">{formatDate(order.estimatedDelivery)}</dd></div>}
            {order.shippingCarrier && <div><dt className="text-gray-500">Carrier</dt><dd className="font-medium text-gray-900">{order.shippingCarrier}</dd></div>}
            {order.trackingNumber && <div><dt className="text-gray-500">Tracking number</dt><dd className="font-mono font-medium text-gray-900">{order.trackingNumber}</dd></div>}
          </dl>
          <div className="mt-6 border-t border-gray-200 pt-4">
            {order.items?.map((item) => (
              <div key={item.productId} className="flex justify-between gap-4 py-2 text-sm">
                <span className="text-gray-700">{item.product?.name || 'Product'} × {item.quantity}</span>
                <span className="font-medium text-gray-900">{formatPrice(item.subtotal ?? item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-gray-200 pt-3 font-bold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
          {order.trackingToken && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                href={`/order/${order.id}`}
                className="text-sm text-primary-600 hover:underline font-medium"
              >
                View full order details →
              </Link>
            </div>
          )}
        </section>
      )}

      <div className="mt-6 text-center space-y-2">
        <Link href={shopHref} className="block text-sm text-primary-600 hover:underline">Continue shopping</Link>
        {!token && (
          <Link
            href={`/checkout/account?next=${encodeURIComponent('/track')}`}
            className="block text-sm text-gray-500 hover:text-gray-700"
          >
            Sign in to access your order history
          </Link>
        )}
      </div>
    </main>
  )
}

export default function TrackByOrderNumberPage() {
  return (
    <Suspense fallback={<TrackLookupSkeleton />}>
      <TrackByOrderNumberPageContent />
    </Suspense>
  )
}
