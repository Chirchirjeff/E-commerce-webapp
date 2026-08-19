'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ordersAPI } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Order } from '@/types'

export default function OrderConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await ordersAPI.getOne(orderId)
      return response.data as Order
    },
    enabled: !!orderId,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-gray-200 w-1/2 rounded" />
              <div className="h-4 bg-gray-200 w-1/3 rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto text-red-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Order Not Found
              </h1>
              <p className="text-gray-600 mb-8">
                We couldn't find this order. It may have expired or doesn't exist.
              </p>
              <Link href="/">
                <Button>Back to Shop</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Success Message */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Thank you for your purchase. Your order has been received and is
              being processed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Order Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Details
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-mono font-bold text-gray-900">{order.id}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full capitalize">
                    {order.status}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Information
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">
                    {order.customerName}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">
                    {order.customerEmail}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">
                    {order.customerPhone}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Delivery Address
            </h2>

            <div className="text-gray-900 space-y-1">
              <p className="font-medium">{order.customerName}</p>
              <p>{order.deliveryAddress}</p>
              <p>
                {order.deliveryCity}, {order.deliveryState} {order.deliveryZip}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Items
            </h2>

            <div className="divide-y divide-gray-200">
              {order.items?.map((item, index) => (
                <div key={index} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.product?.name || 'Product'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatPrice(item.subtotal || item.price * item.quantity)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Total */}
            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-primary-600">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
            <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>
                ✓ We've sent a confirmation email to <strong>{order.customerEmail}</strong>
              </li>
              <li>✓ Your order is being processed by the seller</li>
              <li>✓ You'll receive a shipping notification once dispatched</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button variant="secondary">Continue Shopping</Button>
            </Link>
            <Button onClick={() => window.print()}>Print Receipt</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
