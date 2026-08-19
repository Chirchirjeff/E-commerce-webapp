'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/stores/cartStore'
import { ordersAPI } from '@/lib/api'
import { formatPrice, generateOrderNumber } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface CheckoutFormData {
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryAddress: string
  deliveryCity: string
  deliveryState: string
  deliveryZip: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const getTotal = useCartStore((state) => state.getTotal)
  const shopId = useCartStore((state) => state.shopId)
  const clearCart = useCartStore((state) => state.clearCart)

  const [formData, setFormData] = useState<CheckoutFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryZip: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await ordersAPI.create(orderData)
      return response.data
    },
    onSuccess: (data) => {
      clearCart()
      router.push(`/order/${data.id}`)
    },
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Name is required'
    }
    if (!formData.customerEmail.trim() || !formData.customerEmail.includes('@')) {
      newErrors.customerEmail = 'Valid email is required'
    }
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required'
    }
    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Address is required'
    }
    if (!formData.deliveryCity.trim()) {
      newErrors.deliveryCity = 'City is required'
    }
    if (!formData.deliveryState.trim()) {
      newErrors.deliveryState = 'State/Province is required'
    }
    if (!formData.deliveryZip.trim()) {
      newErrors.deliveryZip = 'ZIP/Postal code is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!shopId || items.length === 0) {
      alert('Your cart is empty or shop ID is missing')
      return
    }

    const orderData = {
      ...formData,
      shopId,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      total: getTotal(),
    }

    createOrderMutation.mutate(orderData)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Your cart is empty
              </h1>
              <p className="text-gray-600 mb-8">
                Add some products before checking out.
              </p>
              <Link href="/">
                <Button>Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const total = getTotal()

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Customer Information
                  </h2>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="customerName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="customerName"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent ${
                          errors.customerName
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                        placeholder="John Doe"
                      />
                      {errors.customerName && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.customerName}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="customerEmail"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="customerEmail"
                        name="customerEmail"
                        value={formData.customerEmail}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent ${
                          errors.customerEmail
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                        placeholder="john@example.com"
                      />
                      {errors.customerEmail && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.customerEmail}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label
                        htmlFor="customerPhone"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="customerPhone"
                        name="customerPhone"
                        value={formData.customerPhone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent ${
                          errors.customerPhone
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                        placeholder="+1 (555) 000-0000"
                      />
                      {errors.customerPhone && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.customerPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Delivery Address
                  </h2>

                  <div className="space-y-4">
                    {/* Address */}
                    <div>
                      <label
                        htmlFor="deliveryAddress"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Street Address *
                      </label>
                      <textarea
                        id="deliveryAddress"
                        name="deliveryAddress"
                        value={formData.deliveryAddress}
                        onChange={handleInputChange}
                        rows={2}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent ${
                          errors.deliveryAddress
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                        placeholder="123 Main St, Apt 4B"
                      />
                      {errors.deliveryAddress && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.deliveryAddress}
                        </p>
                      )}
                    </div>

                    {/* City */}
                    <div>
                      <label
                        htmlFor="deliveryCity"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        City *
                      </label>
                      <input
                        type="text"
                        id="deliveryCity"
                        name="deliveryCity"
                        value={formData.deliveryCity}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent ${
                          errors.deliveryCity
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                        placeholder="New York"
                      />
                      {errors.deliveryCity && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.deliveryCity}
                        </p>
                      )}
                    </div>

                    {/* State & ZIP */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="deliveryState"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          State/Province *
                        </label>
                        <input
                          type="text"
                          id="deliveryState"
                          name="deliveryState"
                          value={formData.deliveryState}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent ${
                            errors.deliveryState
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                          placeholder="NY"
                        />
                        {errors.deliveryState && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.deliveryState}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="deliveryZip"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          ZIP/Postal Code *
                        </label>
                        <input
                          type="text"
                          id="deliveryZip"
                          name="deliveryZip"
                          value={formData.deliveryZip}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent ${
                            errors.deliveryZip
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                          placeholder="10001"
                        />
                        {errors.deliveryZip && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.deliveryZip}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Link href="/cart" className="flex-1">
                    <Button variant="secondary" className="w-full">
                      Back to Cart
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={createOrderMutation.isPending}
                    disabled={createOrderMutation.isPending}
                  >
                    Place Order
                  </Button>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h2>

                {/* Items */}
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex justify-between text-sm text-gray-600"
                    >
                      <span>
                        {item.product?.name || 'Product'} × {item.quantity}
                      </span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-sm">To be calculated</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Note */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> This is a demo checkout. No actual
                    payment will be processed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
