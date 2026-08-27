'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ordersAPI } from '@/lib/api'
import { formatDate, formatPrice } from '@/lib/utils'
import { Order } from '@/types'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'

function TrackByOrderNumberPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = useAuthStore((state) => state.token)
  const [orderNumber, setOrderNumber] = useState(searchParams.get('orderNumber') ?? '')
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const numberFromLink = searchParams.get('orderNumber')
    if (numberFromLink) setOrderNumber(numberFromLink)
  }, [searchParams])

  const findOrder = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) {
      const returnTo = `/track?orderNumber=${encodeURIComponent(orderNumber.trim())}`
      router.push(`/checkout/account?next=${encodeURIComponent(returnTo)}`)
      return
    }
    setError('')
    setLoading(true)
    try {
      const response = await ordersAPI.trackByOrderNumber(orderNumber.trim())
      setOrder(response.data as Order)
    } catch (requestError: any) {
      setOrder(null)
      setError(requestError?.response?.data?.message || 'We could not find that order in your account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <section className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900">Track your order</h1>
        <p className="mt-2 text-gray-600">Sign in to your verified buyer account, then enter the order number from your payment email.</p>

        <form onSubmit={findOrder} className="mt-6 flex flex-col sm:flex-row gap-3">
          <input
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value.toUpperCase())}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="QZ0000000001"
            aria-label="Order number"
            required
          />
          <Button type="submit" disabled={loading}>{!token ? 'Sign in to track' : loading ? 'Finding order…' : 'Track order'}</Button>
        </form>

        {!token && <p className="mt-3 text-sm text-amber-700">A verified buyer account is required to view order updates.</p>}
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
            {order.items?.map((item) => <div key={item.productId} className="flex justify-between gap-4 py-2 text-sm"><span className="text-gray-700">{item.product?.name || 'Product'} × {item.quantity}</span><span className="font-medium text-gray-900">{formatPrice(item.subtotal ?? item.price * item.quantity)}</span></div>)}
            <div className="mt-2 flex justify-between border-t border-gray-200 pt-3 font-bold text-gray-900"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
        </section>
      )}

      <Link href="/" className="mt-6 block text-center text-sm text-primary-600">Continue shopping</Link>
    </main>
  )
}

export default function TrackByOrderNumberPage() {
  return (
    <Suspense fallback={<main className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">Loading order tracking…</main>}>
      <TrackByOrderNumberPageContent />
    </Suspense>
  )
}
