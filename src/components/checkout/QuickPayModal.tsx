'use client'

/**
 * QuickPayModal
 *
 * A self-contained bottom-sheet / modal that handles the full "pay now" flow
 * without redirecting away from the current page until the STK push is sent:
 *
 *   Not logged in:  enter name + email + phone → register (or login) → verify
 *                   email code → collect M-Pesa number → send STK push
 *   Logged in:      pre-fill name + phone → send STK push directly
 *
 * After the STK push is sent the buyer is navigated to /checkout/processing
 * where they enter their PIN.  On payment success they are redirected to
 * /checkout/delivery-after to supply the delivery address for tracking.
 */

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { useAuthStore, BuyerProfile } from '@/stores/authStore'
import { authAPI, mpesaAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'

// ── Helpers ───────────────────────────────────────────────────────────────────

function validateKenyanPhone(value: string): string | null {
  const cleaned = value.replace(/\s+/g, '')
  if (!cleaned) return 'Phone number is required'
  if (!/^(\+?254|0)[17]\d{8}$/.test(cleaned)) {
    return 'Enter a valid Kenyan number (e.g. 0712 345 678)'
  }
  return null
}

function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Step =
  | 'details'   // collect name + email (if guest) + M-Pesa phone
  | 'verify'    // email code verification (guest only)
  | 'sending'   // STK push in flight

export interface QuickPayModalProps {
  isOpen: boolean
  onClose: () => void
}

const CODE_LENGTH = 6

// ── Component ─────────────────────────────────────────────────────────────────

export function QuickPayModal({ isOpen, onClose }: QuickPayModalProps) {
  const router = useRouter()

  const items       = useCartStore((state) => state.items)
  const getTotal    = useCartStore((state) => state.getTotal)
  const shopId      = useCartStore((state) => state.shopId)
  const shopToken   = useCartStore((state) => state.shopToken)

  const setCheckoutRequestId = useCheckoutStore((state) => state.setCheckoutRequestId)
  const setOrderNumber       = useCheckoutStore((state) => state.setOrderNumber)
  const setMpesaPhone        = useCheckoutStore((state) => state.setMpesaPhone)
  const setShopToken         = useCheckoutStore((state) => state.setShopToken)
  // We skip the buyer-id guard by passing a fixed placeholder id for guest flow
  const setDelivery          = useCheckoutStore((state) => state.setDelivery)

  const { token, user, setSession } = useAuthStore()
  const isLoggedIn = !!token && !!user

  // ── Form state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('details')
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')   // M-Pesa / contact phone
  const [code, setCode]   = useState('')
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [phoneError, setPhoneError] = useState('')

  const attemptedCode = useRef<string | null>(null)
  const codeInputRef  = useRef<HTMLInputElement>(null)

  // Pre-fill from logged-in user
  useEffect(() => {
    if (isLoggedIn && user) {
      setName(user.name || '')
      setPhone(user.phone || '')
      setEmail(user.email || '')
    }
  }, [isLoggedIn, user])

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Reset when reopened
  useEffect(() => {
    if (isOpen) {
      setStep('details')
      setCode('')
      setError('')
      setPhoneError('')
      setLoading(false)
      attemptedCode.current = null
    }
  }, [isOpen])

  if (!isOpen) return null

  const total = getTotal()
  const apiMessage = (err: any) =>
    err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.'

  // ── Step 1: submit details ────────────────────────────────────────────────
  const handleDetailsSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const phoneErr = validateKenyanPhone(phone)
    if (phoneErr) { setPhoneError(phoneErr); return }
    setPhoneError('')
    setError('')

    if (isLoggedIn) {
      // Already authenticated — go straight to STK push
      await fireStkPush(user!.id)
      return
    }

    // Guest flow: register or login then verify
    setLoading(true)
    try {
      if (authMode === 'register') {
        // Auto-generate a secure throwaway password — buyer can reset later
        const tempPassword = `Q-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        await authAPI.registerBuyer({ name, email, phone, password: tempPassword })
      } else {
        // Login path — buyer already has an account
        await authAPI.beginBuyerLogin({ email, password: '' })
        // If the account needs a password, beginBuyerLogin will throw "invalid credentials"
        // The buyer can use the login path separately; here we surface the error cleanly
      }
      setCode('')
      attemptedCode.current = null
      setStep('verify')
    } catch (err: any) {
      const msg = apiMessage(err)
      // If email already exists, switch to login mode and prompt
      if (msg.toLowerCase().includes('already exists')) {
        setAuthMode('login')
        setError('This email is already registered. Enter your password below to sign in, or use the sign-in option.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: verify code ───────────────────────────────────────────────────
  const verifyCode = async (value: string) => {
    if (value.length !== CODE_LENGTH || attemptedCode.current === value) return
    attemptedCode.current = value
    setError('')
    setLoading(true)
    try {
      const { data } = await authAPI.verifyBuyerCode({
        email,
        code: value,
        purpose: authMode === 'login' ? 'LOGIN' : 'VERIFY_EMAIL',
      })
      const profile = (await authAPI.getMe(data.access_token)).data.user as BuyerProfile
      setSession(data.access_token, profile)
      // Fire the STK push immediately after auth
      await fireStkPush(profile.id, data.access_token)
    } catch (err: any) {
      setError(apiMessage(err))
      setCode('')
      attemptedCode.current = null
      requestAnimationFrame(() => codeInputRef.current?.focus())
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (raw: string) => {
    const value = raw.replace(/\D/g, '').slice(0, CODE_LENGTH)
    setCode(value)
    if (error) setError('')
    if (value.length === CODE_LENGTH) void verifyCode(value)
  }

  // ── Fire STK push ─────────────────────────────────────────────────────────
  const fireStkPush = async (buyerId: string, _token?: string) => {
    setStep('sending')
    setError('')
    const cleanPhone = phone.replace(/\s+/g, '')
    // Store a placeholder delivery so the payment page guard passes.
    // The buyer fills in the real address on /checkout/delivery-after.
    setDelivery(
      {
        customerName:    name,
        customerEmail:   email,
        customerPhone:   cleanPhone,
        deliveryAddress: 'To be confirmed',
        deliveryCity:    'Nairobi',
        deliveryState:   'Nairobi',
        deliveryZip:     '00100',
      },
      buyerId,
    )
    if (shopToken) setShopToken(shopToken)

    try {
      const response = await mpesaAPI.initiateStkPush({
        phoneNumber: cleanPhone,
        amount: total,
        orderPayload: {
          customerName:    name,
          customerEmail:   email,
          customerPhone:   cleanPhone,
          deliveryAddress: 'To be confirmed',
          deliveryCity:    'Nairobi',
          deliveryState:   'Nairobi',
          deliveryZip:     '00100',
          shopId:          shopId!,
          items: items.map((item) => ({
            productId: item.productId,
            quantity:  item.quantity,
            price:     item.price,
          })),
          total,
        },
      })

      setMpesaPhone(cleanPhone)
      setCheckoutRequestId(response.data.checkoutRequestId)
      setOrderNumber(response.data.orderNumber)
      onClose()
      router.push('/checkout/processing')
    } catch (err: any) {
      setError(apiMessage(err))
      setStep('details')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const inputClass = (hasError?: boolean) =>
    `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${
      hasError ? 'border-red-500' : 'border-gray-300'
    }`

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet — slides up from bottom on mobile, centred on desktop */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {step === 'verify' ? 'Check your email' : 'Complete your payment'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {step === 'verify'
                  ? `We sent a 6-digit code to ${email}`
                  : `Total: ${formatPrice(total)}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
              disabled={step === 'sending'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 py-5 space-y-4 max-h-[80vh] overflow-y-auto">

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ── Step: details ── */}
            {(step === 'details' || step === 'sending') && (
              <form onSubmit={handleDetailsSubmit} noValidate className="space-y-4">

                {/* Guest-only fields */}
                {!isLoggedIn && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass(!name && loading)}
                        placeholder="Jane Doe"
                        required
                        disabled={step === 'sending'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError('') }}
                        className={inputClass(false)}
                        placeholder="jane@example.com"
                        required
                        disabled={step === 'sending'}
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        We&apos;ll send your order confirmation here.
                      </p>
                    </div>
                  </>
                )}

                {/* Logged-in: show who's paying */}
                {isLoggedIn && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm flex items-center justify-between">
                    <span className="text-gray-700">
                      Paying as <strong className="text-gray-900">{user?.name || user?.email}</strong>
                    </span>
                    <span className="text-gray-400 text-xs">{user?.email}</span>
                  </div>
                )}

                {/* M-Pesa number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    M-Pesa Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setPhoneError('') }}
                    className={inputClass(!!phoneError)}
                    placeholder="0712 345 678"
                    autoComplete="tel"
                    required
                    disabled={step === 'sending'}
                  />
                  {phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
                  <p className="mt-1 text-xs text-gray-400">
                    You&apos;ll get a prompt to enter your M-Pesa PIN on this number.
                  </p>
                </div>

                {/* Amount summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between text-sm">
                  <span className="text-green-800 font-medium">Amount to pay</span>
                  <span className="font-bold text-green-900">{formatPrice(total)}</span>
                </div>

                <button
                  type="submit"
                  disabled={loading || step === 'sending'}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {step === 'sending' ? (
                    <><Spinner /> Sending payment request…</>
                  ) : loading ? (
                    <><Spinner /> Please wait…</>
                  ) : (
                    '🔒 Pay with M-Pesa'
                  )}
                </button>

                {!isLoggedIn && (
                  <p className="text-center text-xs text-gray-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                      className="text-primary-600 hover:underline"
                    >
                      {authMode === 'login' ? 'Create one' : 'Sign in instead'}
                    </button>
                  </p>
                )}
              </form>
            )}

            {/* ── Step: verify ── */}
            {step === 'verify' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  attemptedCode.current = null
                  void verifyCode(code)
                }}
                className="space-y-4"
              >
                <input
                  ref={codeInputRef}
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label="Verification code"
                  maxLength={CODE_LENGTH}
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-4 text-center font-mono text-2xl tracking-[0.45em] disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="000000"
                  required
                />
                <p className="text-center text-xs text-gray-500">
                  We&apos;ll verify automatically once all {CODE_LENGTH} digits are entered.
                </p>
                <button
                  type="submit"
                  disabled={loading || code.length !== CODE_LENGTH}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <><Spinner /> Verifying…</> : 'Verify & Pay'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('details')
                    setCode('')
                    setError('')
                    attemptedCode.current = null
                  }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Use a different email
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
