'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/stores/cartStore'
import { useCheckoutStore, DeliveryDetails } from '@/stores/checkoutStore'
import { formatPrice } from '@/lib/utils'
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress'
import Button from '@/components/ui/Button'
import { authAPI } from '@/lib/api'
import { BuyerAddress, BuyerProfile, useAuthStore } from '@/stores/authStore'
import { useSwitchAccount } from '@/hooks/useSwitchAccount'
import { useShopHref } from '@/hooks/useShopHref'
import {
  AddressDraft, AddressFields, EMPTY_ADDRESS, MAX_SAVED_ADDRESSES, formatAddress, validateAddress,
} from '@/components/account/AddressFields'
import { CheckoutDeliverySkeleton } from '@/components/skeletons/PageSkeletons'

type Contact = Pick<DeliveryDetails, 'customerName' | 'customerEmail' | 'customerPhone'>
const NEW_ADDRESS = 'new'

function validateContact(data: Contact): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!data.customerName.trim())  errors.customerName  = 'Full name is required'
  if (!data.customerEmail.trim() || !data.customerEmail.includes('@'))
                                   errors.customerEmail = 'Valid email is required'
  if (!data.customerPhone.trim()) errors.customerPhone = 'Phone number is required'
  return errors
}

/** Finds the saved address a previously entered delivery used, if any. */
function matchSaved(addresses: BuyerAddress[], delivery: DeliveryDetails) {
  return addresses.find((a) =>
    a.addressLine === delivery.deliveryAddress && a.city === delivery.deliveryCity &&
    a.state === delivery.deliveryState && a.postalCode === delivery.deliveryZip)
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
  const { switchAccount } = useSwitchAccount()
  const continueShoppingHref = useShopHref(cartShopToken)

  const addresses = user?.addresses ?? []
  const atLimit = addresses.length >= MAX_SAVED_ADDRESSES

  const [contact, setContact] = useState<Contact>({ customerName: '', customerEmail: '', customerPhone: '' })
  const [selectedId, setSelectedId] = useState<string>(NEW_ADDRESS)
  const [draft, setDraft] = useState<AddressDraft>(EMPTY_ADDRESS)
  const [saveNew, setSaveNew] = useState(true)
  const [makeDefault, setMakeDefault] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const initialisedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!token) { router.replace('/checkout/account'); return }
    // Pull the latest address book (it may have been edited on the account page).
    authAPI.getMe().then((res) => setUser(res.data.user as BuyerProfile)).catch(() => {})
  }, [token, router, setUser])

  // Pre-fill once per buyer. Details saved earlier in this checkout are only
  // reused for the buyer who entered them; otherwise start from the default.
  useEffect(() => {
    if (!user || initialisedFor.current === user.id) return
    initialisedFor.current = user.id
    const own = saved && deliveryBuyerId === user.id ? saved : null
    const fallback = user.addresses.find((a) => a.isDefault) ?? user.addresses[0]

    if (own) {
      setContact({ customerName: own.customerName, customerEmail: own.customerEmail, customerPhone: own.customerPhone })
      const match = matchSaved(user.addresses, own)
      if (match?.id) setSelectedId(match.id)
      else {
        setSelectedId(NEW_ADDRESS)
        setDraft({ ...EMPTY_ADDRESS, addressLine: own.deliveryAddress, city: own.deliveryCity, state: own.deliveryState, postalCode: own.deliveryZip })
      }
      return
    }
    setContact({
      customerName: fallback?.recipientName || user.name || '',
      customerEmail: user.email || '',
      customerPhone: fallback?.phone || user.phone || '',
    })
    setSelectedId(fallback?.id ?? NEW_ADDRESS)
    setMakeDefault(user.addresses.length === 0)
  }, [user, saved, deliveryBuyerId])

  const selectAddress = (id: string) => {
    setSelectedId(id)
    setListOpen(false)
    setMakeDefault(id === NEW_ADDRESS && addresses.length === 0)
    setErrors({})
    // A saved address carries its own recipient — use it as the order contact.
    const address = addresses.find((a) => a.id === id)
    if (address) setContact((prev) => ({ ...prev, customerName: address.recipientName, customerPhone: address.phone }))
  }

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setContact((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { router.replace('/checkout/account'); return }
    const isNew = selectedId === NEW_ADDRESS
    const selected = addresses.find((a) => a.id === selectedId)
    const errs = { ...validateContact(contact), ...(isNew ? validateAddress(draft, false) : {}) }
    if (!isNew && !selected) errs.form = 'Please choose a delivery address.'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const address = isNew ? draft : selected!
    setSubmitting(true)
    try {
      const saveThisAddress = isNew && saveNew && !atLimit
      if (saveThisAddress) {
        await authAPI.saveAddress({
          ...draft, recipientName: contact.customerName, phone: contact.customerPhone, isDefault: makeDefault,
        })
      } else if (!isNew && makeDefault && !selected!.isDefault) {
        await authAPI.setDefaultAddress(selected!.id!)
      }
      if (saveThisAddress || makeDefault) {
        authAPI.getMe().then((res) => setUser(res.data.user as BuyerProfile)).catch(() => {})
      }
      setDelivery({
        ...contact,
        deliveryAddress: address.addressLine, deliveryCity: address.city,
        deliveryState: address.state, deliveryZip: address.postalCode,
      }, user.id)
    } catch {
      setErrors({ form: 'We could not save your delivery address. Please try again.' })
      setSubmitting(false)
      return
    }
    // Persist the shop token so the order confirmation page can link back to
    // the correct shop even after the cart has been cleared.
    if (cartShopToken) setShopToken(cartShopToken)
    router.push('/checkout/review')
  }

  // Guard: no items
  if (!token) return <CheckoutDeliverySkeleton />

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-600 mb-6">Your cart is empty.</p>
        <Link href={continueShoppingHref}><Button>Continue Shopping</Button></Link>
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

            {/* Signed-in buyer — easy to spot and change on a shared device */}
            {user && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                <p className="text-gray-700 min-w-0 truncate">
                  Checking out as <span className="font-medium text-gray-900">{user.name || user.email}</span>
                  <span className="text-gray-500"> ({user.email})</span>
                </p>
                <button type="button" onClick={() => switchAccount('/checkout/delivery')} className="shrink-0 font-medium text-primary-600 hover:text-primary-700">
                  Not you? Switch account
                </button>
              </div>
            )}

            {/* Delivery address */}
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Deliver to</h2>
                {addresses.length > 0 && <Link href="/account" className="text-sm text-primary-600 hover:text-primary-700">Manage addresses</Link>}
              </div>

              {addresses.length > 0 && !listOpen ? (
                // Collapsed: just the chosen address, with a way to change it.
                <div className="flex items-start justify-between gap-3 rounded-lg border border-primary-600 ring-1 ring-primary-600 bg-primary-50/40 p-4">
                  {(() => {
                    const chosen = addresses.find((a) => a.id === selectedId)
                    return chosen ? (
                      <span className="min-w-0">
                        <span className="font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                          {chosen.label}
                          {chosen.isDefault && <span className="text-xs font-semibold text-primary-700 bg-primary-50 rounded-full px-2 py-0.5">Default</span>}
                        </span>
                        <span className="block text-sm text-gray-700">{chosen.recipientName} · {chosen.phone}</span>
                        <span className="block text-sm text-gray-500">{formatAddress(chosen)}</span>
                      </span>
                    ) : (
                      <span className="font-medium text-gray-900">A different address</span>
                    )
                  })()}
                  <button type="button" onClick={() => setListOpen(true)} aria-expanded={false} aria-controls="delivery-address-list"
                    className="shrink-0 flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
                    Change
                    <span className="text-gray-400">({addresses.length} saved)</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
              ) : (
              <div id="delivery-address-list" className="space-y-3" role="radiogroup" aria-label="Delivery address">
                {addresses.length > 0 && (
                  <button type="button" onClick={() => setListOpen(false)} aria-expanded={true} aria-controls="delivery-address-list"
                    className="flex w-full items-center justify-end gap-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Collapse
                    <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                )}
                {addresses.map((address) => {
                  const checked = selectedId === address.id
                  return (
                    <label key={address.id} className={`flex gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${checked ? 'border-primary-600 ring-1 ring-primary-600 bg-primary-50/40' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="address" className="mt-1 h-4 w-4 text-primary-600" checked={checked} onChange={() => selectAddress(address.id!)} />
                      <span className="min-w-0">
                        <span className="font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                          {address.label}
                          {address.isDefault && <span className="text-xs font-semibold text-primary-700 bg-primary-50 rounded-full px-2 py-0.5">Default</span>}
                        </span>
                        <span className="block text-sm text-gray-700">{address.recipientName} · {address.phone}</span>
                        <span className="block text-sm text-gray-500">{formatAddress(address)}</span>
                      </span>
                    </label>
                  )
                })}

                <label className={`flex gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${selectedId === NEW_ADDRESS ? 'border-primary-600 ring-1 ring-primary-600 bg-primary-50/40' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="address" className="mt-1 h-4 w-4 text-primary-600" checked={selectedId === NEW_ADDRESS} onChange={() => selectAddress(NEW_ADDRESS)} />
                  <span className="font-medium text-gray-900">{addresses.length ? 'Deliver to a different address' : 'Add a delivery address'}</span>
                </label>
              </div>
              )}

              {selectedId === NEW_ADDRESS && (
                <div className="mt-5 space-y-4">
                  <AddressFields value={draft} onChange={(next) => { setDraft(next); setErrors({}) }} errors={errors} withRecipient={false} idPrefix="checkout-address" />
                  {atLimit ? (
                    <p className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                      You&apos;ve saved the maximum of {MAX_SAVED_ADDRESSES} addresses, so this one will be used for this order only.{' '}
                      <Link href="/account" className="font-medium underline">Remove one</Link> to save more.
                    </p>
                  ) : (
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={saveNew} onChange={(e) => { setSaveNew(e.target.checked); if (!e.target.checked) setMakeDefault(false) }} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                      Save this address to my account
                    </label>
                  )}
                </div>
              )}

              {(selectedId !== NEW_ADDRESS ? !addresses.find((a) => a.id === selectedId)?.isDefault : saveNew && !atLimit) && (
                <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                  Make this my default delivery address
                </label>
              )}
            </section>

            {/* Contact for this order */}
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Recipient &amp; contact</h2>
              <p className="text-sm text-gray-500 mb-4">Who should the seller contact about this delivery?</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input id="customerName" name="customerName" type="text"
                    value={contact.customerName} onChange={handleContactChange}
                    className={inputClass('customerName')} placeholder="Jane Doe" />
                  {errors.customerName && <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input id="customerPhone" name="customerPhone" type="tel"
                      value={contact.customerPhone} onChange={handleContactChange}
                      className={inputClass('customerPhone')} placeholder="0712 345 678" />
                    {errors.customerPhone && <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>}
                  </div>
                  <div>
                    <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input id="customerEmail" name="customerEmail" type="email"
                      value={contact.customerEmail} onChange={handleContactChange}
                      className={inputClass('customerEmail')} placeholder="jane@example.com" />
                    {errors.customerEmail && <p className="mt-1 text-sm text-red-600">{errors.customerEmail}</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex gap-4">
              <Link href="/cart" className="flex-1">
                <Button variant="secondary" className="w-full">Back to Cart</Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? 'Saving…' : 'Review Order'}</Button>
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
