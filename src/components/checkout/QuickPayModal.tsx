'use client'

/**
 * QuickPayModal
 *
 * One-sheet M-Pesa checkout for exactly the order it is given — it never reads
 * the cart itself.
 *
 * - source 'buyNow': express single-item purchase (Buy Now). The cart is not
 *   touched, before or after payment. A quantity stepper (bounded by stock) is
 *   shown in the sheet.
 * - source 'cart':   the cart page passes the cart's items. The cart is cleared
 *   by /checkout/processing once payment succeeds.
 *
 * Buyer states:
 * - Signed in with a complete default address → only confirm the M-Pesa number.
 * - Guest / incomplete profile → name, M-Pesa number, town, street/building,
 *   plus an optional email for the receipt.
 *
 * After the STK push is sent the order snapshot (incl. source) is saved to
 * checkoutStore and the buyer is navigated to /checkout/processing.
 */

import { FormEvent, useEffect, useId, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BadgeCheck, ChevronDown, Lock, Minus, Plus, X } from 'lucide-react'
import { Product } from '@/types'
import { CheckoutSource, useCheckoutStore } from '@/stores/checkoutStore'
import { useAuthStore } from '@/stores/authStore'
import { mpesaAPI } from '@/lib/api'
import { effectivePrice, formatPrice, validateKenyanPhone } from '@/lib/utils'
import { StarRating, formatReviewCount } from '@/components/ui/StarRating'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuickPayLineItem {
  product: Product
  quantity: number
  /** Unit price charged (sale price when lower than list price). */
  price: number
}

export interface QuickPayOrder {
  shopId: string
  shopName?: string
  /** Shop link token — lets the confirmation page send the buyer back to the shop. */
  shopToken?: string
  /** shop.verificationStatus === 'ACTIVE' */
  shopVerified?: boolean
  items: QuickPayLineItem[]
}

export interface QuickPayModalProps {
  isOpen: boolean
  onClose: () => void
  order: QuickPayOrder
  source: CheckoutSource
  /**
   * Where the "Sign in for faster checkout" link should return to.
   * Defaults to the current URL.
   */
  signInReturnPath?: string
}

/** Builds a single-item Buy Now order for a product. */
export function buildBuyNowOrder(
  product: Product,
  quantity: number,
  shop?: { name?: string; token?: string; verified?: boolean }
): QuickPayOrder {
  return {
    shopId: product.shopId,
    shopName: shop?.name,
    shopToken: shop?.token,
    shopVerified: shop?.verified,
    items: [{ product, quantity, price: effectivePrice(product) }],
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LOW_STOCK_THRESHOLD = 5

function stockOf(product: Product): number {
  return typeof product.stockQuantity === 'number' ? Math.max(0, product.stockQuantity) : Infinity
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

const inputBase =
  'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500'
const inputOk = 'border-gray-300 dark:border-slate-600'
const inputErr = 'border-red-500'
const labelCls = 'mb-1 block text-xs font-medium text-gray-700 dark:text-slate-300'

type FieldErrors = Partial<Record<'name' | 'mpesa' | 'city' | 'email', string>>

// ── Component ─────────────────────────────────────────────────────────────────

export function QuickPayModal({ isOpen, onClose, order, source, signInReturnPath }: QuickPayModalProps) {
  const router = useRouter()
  const titleId = useId()
  const fieldId = useId()

  const setCheckoutRequestId = useCheckoutStore((state) => state.setCheckoutRequestId)
  const setOrderNumber       = useCheckoutStore((state) => state.setOrderNumber)
  const setMpesaPhone        = useCheckoutStore((state) => state.setMpesaPhone)
  const setShopToken         = useCheckoutStore((state) => state.setShopToken)
  const setDelivery          = useCheckoutStore((state) => state.setDelivery)
  const setPendingPayment    = useCheckoutStore((state) => state.setPendingPayment)
  const savedDelivery        = useCheckoutStore((state) => state.delivery)
  const savedDeliveryBuyerId = useCheckoutStore((state) => state.deliveryBuyerId)
  const savedMpesaPhone      = useCheckoutStore((state) => state.mpesaPhone)

  const user = useAuthStore((state) => state.user)
  const isAuthenticated = !!user

  const defaultAddress = useMemo(
    () => user?.addresses?.find((a) => a.isDefault) ?? user?.addresses?.[0] ?? null,
    [user]
  )

  // Signed-in buyers with a complete default address only confirm the M-Pesa number.
  const hasFullDetails = !!(
    isAuthenticated &&
    defaultAddress &&
    (user.name || defaultAddress.recipientName) &&
    defaultAddress.addressLine &&
    defaultAddress.city
  )

  const isBuyNow = source === 'buyNow'

  // ── Form state ──────────────────────────────────────────────────────────────
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity]       = useState('')
  const [mpesaPhone, setMpesaPhoneState] = useState('')
  const [buyNowQty, setBuyNowQty] = useState(1)
  const [editDetails, setEditDetails] = useState(false)
  const [errors, setErrors]   = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const sheetRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const loadingRef = useRef(loading)
  loadingRef.current = loading

  // Lock body scroll while open; restore whatever was there (e.g. a product
  // modal underneath that also locks scrolling).
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [isOpen])

  // Escape closes (unless a payment request is in flight)
  useEffect(() => {
    if (!isOpen) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loadingRef.current) {
        e.stopPropagation()
        onCloseRef.current()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      previouslyFocused?.focus?.()
    }
  }, [isOpen])

  // Reset and pre-fill each time the sheet opens
  const initialQty = order.items[0]
    ? Math.max(1, Math.min(order.items[0].quantity, stockOf(order.items[0].product)))
    : 1
  useEffect(() => {
    if (!isOpen) return
    setErrors({})
    setError('')
    setLoading(false)
    setEditDetails(false)
    setBuyNowQty(initialQty)

    // Details typed on a previous attempt (e.g. a cancelled M-Pesa prompt),
    // only when they belong to the same buyer (or the same guest session).
    const saved = savedDelivery && savedDeliveryBuyerId === (user?.id ?? null) ? savedDelivery : null
    const profilePhone = user?.phone || defaultAddress?.phone || ''
    setName(user?.name || defaultAddress?.recipientName || saved?.customerName || '')
    setEmail(user ? '' : saved?.customerEmail || '')
    setAddress(defaultAddress?.addressLine || (saved?.deliveryAddress !== 'To be confirmed' ? saved?.deliveryAddress : '') || '')
    setCity(defaultAddress?.city || saved?.deliveryCity || '')
    setMpesaPhoneState((saved && savedMpesaPhone) || profilePhone || saved?.customerPhone || '')
    // Only reset when opened — not on every order/profile re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Move focus into the sheet when it opens
  useEffect(() => {
    if (!isOpen) return
    const id = requestAnimationFrame(() => {
      const target = sheetRef.current?.querySelector<HTMLElement>('[data-autofocus]')
      ;(target ?? sheetRef.current)?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [isOpen])

  if (!isOpen) return null

  // ── Derived order ───────────────────────────────────────────────────────────
  const items: QuickPayLineItem[] = isBuyNow && order.items[0]
    ? [{ ...order.items[0], quantity: buyNowQty }]
    : order.items
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const singleProduct = items.length === 1 ? items[0].product : null
  const buyNowMax = order.items[0] ? stockOf(order.items[0].product) : 1
  const overStock = items.find((item) => item.quantity > stockOf(item.product))

  const showForm = !hasFullDetails || editDetails
  const cleanMpesa = mpesaPhone.replace(/\s+/g, '')
  const returnPath = signInReturnPath
    ?? (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/')
  const signInHref = `/checkout/account?next=${encodeURIComponent(returnPath)}`

  const validate = (): FieldErrors => {
    const next: FieldErrors = {}
    const phoneErr = validateKenyanPhone(mpesaPhone)
    if (phoneErr) next.mpesa = phoneErr
    if (showForm) {
      if (!name.trim()) next.name = 'Enter your name'
      if (!city.trim()) next.city = 'Enter your town or city'
    }
    if (!isAuthenticated && email.trim() && !EMAIL_RE.test(email.trim())) {
      next.email = 'Enter a valid email, or leave it blank'
    }
    return next
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (loading) return
    const fieldErrors = validate()
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return
    if (!order.shopId || items.length === 0) {
      setError('This order is missing its shop. Please reload the page and try again.')
      return
    }
    if (overStock) {
      setError(`Only ${stockOf(overStock.product)} of "${overStock.product.name}" available. Please lower the quantity.`)
      return
    }

    setError('')
    setLoading(true)

    let contactName: string
    let deliveryAddress: string
    let deliveryCity: string
    let deliveryState: string
    let deliveryZip: string

    if (hasFullDetails && defaultAddress && !editDetails) {
      contactName     = user!.name || defaultAddress.recipientName
      deliveryAddress = defaultAddress.addressLine
      deliveryCity    = defaultAddress.city
      deliveryState   = defaultAddress.state || defaultAddress.city
      deliveryZip     = defaultAddress.postalCode || '00100'
    } else {
      contactName     = name.trim()
      deliveryAddress = address.trim() || 'To be confirmed'
      deliveryCity    = city.trim()
      deliveryState   = deliveryCity
      deliveryZip     = defaultAddress?.postalCode || '00100'
    }
    // Email must be a valid address or null — the API rejects an empty string.
    const contactEmail: string | null = isAuthenticated
      ? user!.email || null
      : email.trim() || null

    setDelivery({
      customerName: contactName,
      customerEmail: contactEmail || '',
      customerPhone: cleanMpesa,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryZip,
    }, user?.id ?? null)

    try {
      const response = await mpesaAPI.initiateStkPush({
        phoneNumber: cleanMpesa,
        amount: total,
        orderPayload: {
          customerName: contactName,
          customerEmail: contactEmail,
          customerPhone: cleanMpesa,
          deliveryAddress,
          deliveryCity,
          deliveryState,
          deliveryZip,
          shopId: order.shopId,
          items: items.map((item) => ({
            productId: item.product.id,
            quantity:  item.quantity,
            price:     item.price,
          })),
          total,
          buyerId: user?.id ?? null,
        },
      })

      if (order.shopToken) setShopToken(order.shopToken)
      // Snapshot what was charged and where it came from; /checkout/processing
      // reads this to show the amount and to decide whether to clear the cart.
      setPendingPayment({
        source,
        amount: total,
        shopId: order.shopId,
        shopToken: order.shopToken ?? null,
        shopName: order.shopName,
        items: items.map((item) => ({ product: item.product, quantity: item.quantity, price: item.price })),
      })
      setMpesaPhone(cleanMpesa)
      setCheckoutRequestId(response.data.checkoutRequestId)
      setOrderNumber(response.data.orderNumber)
      onClose()
      router.push('/checkout/processing')
    } catch (err: unknown) {
      const raw: unknown = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
      const detail = Array.isArray(raw) ? raw[0] : typeof raw === 'string' ? raw : null
      const isTechnical = typeof detail === 'string' &&
        (detail.includes('{') || detail.includes('errorCode') || detail.includes('STK push'))
      setError(isTechnical || !detail
        ? 'Payment request failed. Please check your number and try again.'
        : detail
      )
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = (err?: string) => `${inputBase} ${err ? inputErr : inputOk}`

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[55] bg-black/60 transition-opacity"
        onClick={() => { if (!loading) onClose() }}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="pointer-events-none fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="pointer-events-auto flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none dark:bg-slate-900 sm:max-w-md sm:rounded-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-slate-700">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-bold text-gray-900 dark:text-slate-100">
                {isBuyNow ? 'Buy now with M-Pesa' : 'Pay with M-Pesa'}
              </h2>
              {order.shopName && (
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                  <span className="truncate">Sold by <span className="font-medium text-gray-700 dark:text-slate-200">{order.shopName}</span></span>
                  {order.shopVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
                      <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                      Verified Seller
                    </span>
                  )}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close"
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex-1 space-y-4 overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 sm:pb-5"
          >
            {/* ── Order summary ── */}
            <section aria-label="Order summary" className="rounded-xl border border-gray-200 dark:border-slate-700">
              <ul className="max-h-48 divide-y divide-gray-100 overflow-y-auto dark:divide-slate-800">
                {items.map((item) => {
                  const stock = stockOf(item.product)
                  const lowStock = stock > 0 && stock <= LOW_STOCK_THRESHOLD
                  return (
                    <li key={item.product.id} className="flex gap-3 p-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-800">
                        {item.product.thumbnailUrl && (
                          <Image src={item.product.thumbnailUrl} alt="" fill sizes="56px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-slate-100">
                          {item.product.name}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                          {formatPrice(item.price)} each
                          {!isBuyNow && <> · Qty {item.quantity}</>}
                        </p>
                        {lowStock && (
                          <p className="mt-0.5 text-xs font-medium text-orange-600 dark:text-orange-400">
                            Only {stock} left
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-gray-900 dark:text-slate-100">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </li>
                  )
                })}
              </ul>

              {/* Quantity stepper (Buy Now only) */}
              {isBuyNow && order.items[0] && (
                <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2 dark:border-slate-800">
                  <span id={`${fieldId}-qty`} className="text-xs font-medium text-gray-700 dark:text-slate-300">Quantity</span>
                  <div role="group" aria-labelledby={`${fieldId}-qty`} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setBuyNowQty((q) => Math.max(1, q - 1))}
                      disabled={loading || buyNowQty <= 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-gray-900 dark:text-slate-100" aria-live="polite">
                      {buyNowQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setBuyNowQty((q) => Math.min(buyNowMax, q + 1))}
                      disabled={loading || buyNowQty >= buyNowMax}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Real rating for a single product — only when it has reviews */}
              {singleProduct && (singleProduct.reviewCount ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 border-t border-gray-100 px-3 py-2 text-xs text-gray-500 dark:border-slate-800 dark:text-slate-400">
                  <StarRating rating={singleProduct.averageRating ?? 0} size="sm" />
                  <span>
                    {(singleProduct.averageRating ?? 0).toFixed(1)} · {formatReviewCount(singleProduct.reviewCount ?? 0)}{' '}
                    {singleProduct.reviewCount === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
              )}
            </section>

            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {/* ── Delivery details ── */}
            {hasFullDetails && defaultAddress && !editDetails && (
              <div className="flex items-start justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                <div className="min-w-0 text-sm">
                  <p className="text-xs text-gray-500 dark:text-slate-400">Deliver to</p>
                  <p className="truncate font-medium text-gray-900 dark:text-slate-100">{user!.name || defaultAddress.recipientName}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-slate-400">
                    {defaultAddress.addressLine}, {defaultAddress.city}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditDetails(true)}
                  className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
                >
                  Change
                  <ChevronDown className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            )}

            {!isAuthenticated && (
              <p className="text-xs text-gray-500 dark:text-slate-400">
                No account needed.{' '}
                <Link href={signInHref} className="font-medium text-primary-600 hover:underline dark:text-primary-400">
                  Have an account? Sign in for faster checkout
                </Link>
              </p>
            )}

            {showForm && (
              <div className="space-y-3">
                <div>
                  <label htmlFor={`${fieldId}-name`} className={labelCls}>Full name</label>
                  <input
                    id={`${fieldId}-name`}
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, name: undefined })) }}
                    className={fieldClass(errors.name)}
                    autoComplete="name"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? `${fieldId}-name-err` : undefined}
                    disabled={loading}
                    data-autofocus
                  />
                  {errors.name && <p id={`${fieldId}-name-err`} className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>
              </div>
            )}

            {/* M-Pesa number — always shown; doubles as the contact phone */}
            <div>
              <label htmlFor={`${fieldId}-mpesa`} className={labelCls}>M-Pesa phone number</label>
              <input
                id={`${fieldId}-mpesa`}
                type="tel"
                inputMode="tel"
                value={mpesaPhone}
                onChange={(e) => { setMpesaPhoneState(e.target.value); setErrors((x) => ({ ...x, mpesa: undefined })) }}
                className={`${fieldClass(errors.mpesa)} py-3 text-base`}
                autoComplete="tel"
                aria-invalid={!!errors.mpesa}
                aria-describedby={errors.mpesa ? `${fieldId}-mpesa-err` : undefined}
                disabled={loading}
                {...(!showForm ? { 'data-autofocus': true } : {})}
              />
              {errors.mpesa && <p id={`${fieldId}-mpesa-err`} className="mt-1 text-xs text-red-600">{errors.mpesa}</p>}
            </div>

            {showForm && (
              <div className="space-y-3">
                <div>
                  <label htmlFor={`${fieldId}-city`} className={labelCls}>Town / city</label>
                  <input
                    id={`${fieldId}-city`}
                    type="text"
                    value={city}
                    onChange={(e) => { setCity(e.target.value); setErrors((x) => ({ ...x, city: undefined })) }}
                    className={fieldClass(errors.city)}
                    autoComplete="address-level2"
                    aria-invalid={!!errors.city}
                    aria-describedby={errors.city ? `${fieldId}-city-err` : undefined}
                    disabled={loading}
                  />
                  {errors.city && <p id={`${fieldId}-city-err`} className="mt-1 text-xs text-red-600">{errors.city}</p>}
                </div>
                <div>
                  <label htmlFor={`${fieldId}-address`} className={labelCls}>
                    Street / building <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>
                  </label>
                  <input
                    id={`${fieldId}-address`}
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={fieldClass()}
                    autoComplete="street-address"
                    disabled={loading}
                  />
                </div>
                {!isAuthenticated && (
                  <div>
                    <label htmlFor={`${fieldId}-email`} className={labelCls}>
                      Email for your receipt <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>
                    </label>
                    <input
                      id={`${fieldId}-email`}
                      type="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })) }}
                      className={fieldClass(errors.email)}
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? `${fieldId}-email-err` : undefined}
                      disabled={loading}
                    />
                    {errors.email && <p id={`${fieldId}-email-err`} className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>
                )}
                {editDetails && (
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    These details are used for this order only.{' '}
                    <Link href="/account" className="text-primary-600 underline dark:text-primary-400">Manage saved addresses</Link>
                  </p>
                )}
              </div>
            )}

            {/* ── Total + pay ── */}
            <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
              <span className="text-sm font-medium text-green-800 dark:text-green-300">Total to pay now</span>
              <span className="text-lg font-bold text-green-900 dark:text-green-200">{formatPrice(total)}</span>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
              >
                {loading ? (
                  <><Spinner /> Sending M-Pesa prompt…</>
                ) : (
                  <><Lock className="h-4 w-4" aria-hidden="true" /> Pay {formatPrice(total)} with M-Pesa</>
                )}
              </button>
              <p className="mt-2 text-center text-xs text-gray-500 dark:text-slate-400" aria-live="polite">
                You&apos;ll get an M-Pesa prompt on{' '}
                <span className="font-medium text-gray-700 dark:text-slate-200">
                  {cleanMpesa && !validateKenyanPhone(cleanMpesa) ? mpesaPhone.trim() : 'your phone'}
                </span>
                . Enter your PIN to confirm.
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
