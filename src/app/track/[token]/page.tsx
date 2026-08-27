'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ordersAPI } from '@/lib/api'
import { formatDate, formatPrice } from '@/lib/utils'
import { Order } from '@/types'
import Button from '@/components/ui/Button'

const stages = [
  { key: 'paid', label: 'Payment received', description: 'Your payment has been confirmed.' },
  { key: 'processing', label: 'Being prepared', description: 'The seller is preparing your order.' },
  { key: 'shipped', label: 'On the way', description: 'Your order has been dispatched.' },
  { key: 'delivered', label: 'Delivered', description: 'Your order has arrived.' },
]

function stageIndex(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === 'pending') return 0
  const index = stages.findIndex((stage) => stage.key === normalized)
  return index >= 0 ? index : 0
}

export default function TrackOrderPage() {
  const params = useParams()
  const token = params.token as string

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['track-order', token],
    queryFn: async () => (await ordersAPI.track(token)).data as Order,
    enabled: !!token,
    refetchInterval: 30_000,
  })

  if (isLoading) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">Loading your order...</div>
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tracking link unavailable</h1>
        <p className="text-gray-600 mb-8">This link is invalid or the order is no longer available.</p>
        <Link href={`/${token}`}><Button>Back to Shop</Button></Link>
      </div>
    )
  }

  // The shop storefront lives at /:token — same token as in this URL.
  // Using it directly means "Continue Shopping" always goes somewhere valid.
  const shopHref = `/${token}`
  const currentStage = stageIndex(order.status)

  const isCancelled = order.status.toLowerCase() === 'cancelled'

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <p className="text-sm font-medium text-primary-600 mb-2">{order.shop?.name || 'Your order'}</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Track your order</h1>
        <p className="text-gray-600">Order <span className="font-mono font-semibold text-gray-900">{order.orderNumber}</span></p>
        <p className="text-sm text-gray-500 mt-1">Placed {formatDate(order.createdAt)}</p>
      </div>

      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6" aria-label="Order status">
        {isCancelled ? (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
            <h2 className="font-semibold">Order cancelled</h2>
            <p className="text-sm mt-1">Please contact the seller if you need help with this order.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {stages.map((stage, index) => {
              const complete = index <= currentStage
              const current = index === currentStage
              return (
                <div key={stage.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${complete ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {complete ? '✓' : index + 1}
                    </div>
                    {index < stages.length - 1 && <div className={`w-0.5 flex-1 mt-2 ${index < currentStage ? 'bg-green-600' : 'bg-gray-200'}`} />}
                  </div>
                  <div className="pb-5">
                    <h2 className={`font-semibold ${current ? 'text-gray-900' : complete ? 'text-green-700' : 'text-gray-400'}`}>{stage.label}</h2>
                    <p className="text-sm text-gray-500 mt-1">{current ? stage.description : complete ? 'Complete' : 'Up next'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="border-t border-gray-200 mt-2 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Current status</p><p className="font-semibold text-gray-900 capitalize">{order.status}</p></div>
          {order.estimatedDelivery && <div><p className="text-gray-500">Estimated delivery</p><p className="font-semibold text-gray-900">{formatDate(order.estimatedDelivery)}</p></div>}
          {order.shippingCarrier && <div><p className="text-gray-500">Carrier</p><p className="font-semibold text-gray-900">{order.shippingCarrier}</p></div>}
          {order.trackingNumber && <div><p className="text-gray-500">Tracking number</p><p className="font-mono font-semibold text-gray-900">{order.trackingNumber}</p></div>}
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
        <div className="divide-y divide-gray-200">
          {order.items?.map((item) => (
            <div key={item.productId} className="py-3 first:pt-0 last:pb-0 flex justify-between gap-4 text-sm">
              <div><p className="font-medium text-gray-900">{item.product?.name || 'Product'}</p><p className="text-gray-500">Qty: {item.quantity}</p></div>
              <p className="font-semibold text-gray-900">{formatPrice(item.subtotal ?? item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between font-bold text-gray-900"><span>Total</span><span>{formatPrice(order.total)}</span></div>
      </section>

      <div className="text-center"><Link href={shopHref}><Button variant="secondary">Continue Shopping</Button></Link></div>
    </main>
  )
}
