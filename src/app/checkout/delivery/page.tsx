'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/stores/cartStore'
import { useCheckoutStore, DeliveryDetails } from '@/stores/checkoutStore'
import { formatPrice } from '@/lib/utils'
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress'
import Button from '@/components/ui/Button'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

function validate(data: DeliveryDetails): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!data.customerName.trim())    errors.customerName    = 'Full name is required'
  if (!data.customerEmail.trim() || !data.customerEmail.includes('@'))
                                     errors.customerEmail   = 'Valid email is required'
  if (!data.customerPhone.trim())   errors.customerPhone   = 'Phone number is required'
  if (!data.deliveryAddress.trim()) errors.deliveryAddress = 'Street address is required'
  if (!data.deliveryCity.trim())    errors.deliveryCity    = 'City is required'
  if (!data.deliveryState.trim())   errors.deliveryState   = 'County / state is required'
  if (!data.deliveryZip.trim())     errors.deliveryZip     = 'Postal code is required'
  return errors
}

export default function DeliveryPage() {
  const router = useRouter()
  const items      = useCartStore((state) => state.items)
  const getTotal   = useCartStore((state) => state.getTotal)
  const cartShopToken = useCartStore((state) => state.shopToken)
  const saved      = useCheckoutStore((state) => state.delivery)
  const deliveryBuyerId = useCheckoutStore((state) => state.deliveryBuyerId)
  const setDelivery = useCheckoutStore((state) => state.setDelivery)
  const setShopToken = useCheckoutStore((state) => state.setShopToken)
  const { token, user, setUser } = useAuthStore()

  const [form, setForm] = useState<DeliveryDetails>(
    saved ?? {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      deliveryAddress: '',
      deliveryCity: '',
      deliveryState: '',
      deliveryZip: '',
    }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!token) { router.replace('/checkout/account'); return }
    // Delivery details are sensitive and may only be reused for the buyer who
    // entered them. Legacy saved details have no owner and are ignored.
    if ((saved && deliveryBuyerId === user?.id) || !user) return
    const address = user.addresses.find((item) => item.isDefault) ?? user.addresses[0]
    setForm({
      customerName: user.name || address?.recipientName || '', customerEmail: user.email || '',
      customerPhone: user.phone || address?.phone || '', deliveryAddress: address?.addressLine || '',
      deliveryCity: address?.city || '', deliveryState: address?.state || '', deliveryZip: address?.postalCode || '',
    })
  }, [token, user, saved, deliveryBuyerId, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { router.replace('/checkout/account'); return }
    const errs = validate(form)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    try {
      const result = await authAPI.saveAddress({
        label: 'Delivery address', recipientName: form.customerName, phone: form.customerPhone,
        addressLine: form.deliveryAddress, city: form.deliveryCity, state: form.deliveryState,
        postalCode: form.deliveryZip, isDefault: true,
      })
      if (user) setUser({ ...user, name: form.customerName, phone: form.customerPhone, addresses: [result.data.address, ...user.addresses.filter((item) => item.id !== result.data.address.id).map((item) => ({ ...item, isDefault: false }))] })
      setDelivery(form, user.id)
    } catch {
      setErrors({ form: 'We could not save your delivery address. Please try again.' })
      return
    }
    // Persist the shop token so the order confirmation page can link back to
    // the correct shop even after the cart has been cleared.
    if (cartShopToken) setShopToken(cartShopToken)
    router.push('/checkout/review')
  }

  // Guard: no items
  if (!token) return null

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-600 mb-6">Your cart is empty.</p>
        <Link href={cartShopToken ? `/${cartShopToken}` : '/'}><Button>Continue Shopping</Button></Link>
      </div>
    )
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent ${
      errors[field] ? 'border-red-500' : 'border-gray-300'
    }`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CheckoutProgress current="delivery" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Form ── */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {errors.form && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.form}</p>}
            {/* Customer info */}
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input id="customerName" name="customerName" type="text"
                    value={form.customerName} onChange={handleChange}
                    className={inputClass('customerName')} placeholder="Jane Doe" />
                  {errors.customerName && <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>}
                </div>
                <div>
                  <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input id="customerEmail" name="customerEmail" type="email"
                    value={form.customerEmail} onChange={handleChange}
                    className={inputClass('customerEmail')} placeholder="jane@example.com" />
                  {errors.customerEmail && <p className="mt-1 text-sm text-red-600">{errors.customerEmail}</p>}
                </div>
                <div>
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input id="customerPhone" name="customerPhone" type="tel"
                    value={form.customerPhone} onChange={handleChange}
                    className={inputClass('customerPhone')} placeholder="0712 345 678" />
                  {errors.customerPhone && <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>}
                </div>
              </div>
            </section>

            {/* Delivery address */}
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Address</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                  <textarea id="deliveryAddress" name="deliveryAddress"
                    value={form.deliveryAddress} onChange={handleChange}
                    rows={2} className={inputClass('deliveryAddress')}
                    placeholder="123 Moi Avenue, Apt 4B" />
                  {errors.deliveryAddress && <p className="mt-1 text-sm text-red-600">{errors.deliveryAddress}</p>}
                </div>
                <div>
                  <label htmlFor="deliveryCity" className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input id="deliveryCity" name="deliveryCity" type="text"
                    value={form.deliveryCity} onChange={handleChange}
                    className={inputClass('deliveryCity')} placeholder="Nairobi" />
                  {errors.deliveryCity && <p className="mt-1 text-sm text-red-600">{errors.deliveryCity}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="deliveryState" className="block text-sm font-medium text-gray-700 mb-1">County / State *</label>
                    <input id="deliveryState" name="deliveryState" type="text"
                      value={form.deliveryState} onChange={handleChange}
                      className={inputClass('deliveryState')} placeholder="Nairobi County" />
                    {errors.deliveryState && <p className="mt-1 text-sm text-red-600">{errors.deliveryState}</p>}
                  </div>
                  <div>
                    <label htmlFor="deliveryZip" className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                    <input id="deliveryZip" name="deliveryZip" type="text"
                      value={form.deliveryZip} onChange={handleChange}
                      className={inputClass('deliveryZip')} placeholder="00100" />
                    {errors.deliveryZip && <p className="mt-1 text-sm text-red-600">{errors.deliveryZip}</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex gap-4">
              <Link href="/cart" className="flex-1">
                <Button variant="secondary" className="w-full">Back to Cart</Button>
              </Link>
              <Button type="submit" className="flex-1">Review Order</Button>
            </div>
          </form>
        </div>

        {/* ── Order Summary Sidebar ── */}
        <aside>
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <ul className="space-y-2 mb-4 max-h-64 overflow-y-auto text-sm text-gray-600">
              {items.map((item) => (
                <li key={item.productId} className="flex justify-between">
                  <span>{item.product?.name || 'Product'} &times; {item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(getTotal())}</span>
            </div>
            <p className="mt-3 text-xs text-gray-400 text-center">Shipping calculated at next step</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
