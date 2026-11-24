'use client'

import { FormEvent, Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress'
import { PasswordInput } from '@/components/account/PasswordInput'
import { authAPI } from '@/lib/api'
import { BuyerProfile, useAuthStore } from '@/stores/authStore'
import { AuthCardSkeleton } from '@/components/skeletons/PageSkeletons'

type Mode = 'login' | 'register' | 'verify'

function CheckoutAccountPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token, setSession } = useAuthStore()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [purpose, setPurpose] = useState<'LOGIN' | 'VERIFY_EMAIL'>('LOGIN')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const requestedNext = searchParams.get('next')
  const nextPath = requestedNext?.startsWith('/') && !requestedNext.startsWith('//')
    ? requestedNext
    : '/checkout/delivery'

  useEffect(() => { if (token) router.replace(nextPath) }, [token, nextPath, router])

  const resetHref = `/reset-password?email=${encodeURIComponent(email.trim())}&next=${encodeURIComponent(nextPath)}`

  const message = (err: any) => err?.response?.data?.message || 'Something went wrong. Please try again.'
  const getProfile = async (accessToken: string) => {
    const profile = (await authAPI.getMe(accessToken)).data.user as BuyerProfile
    setSession(accessToken, profile)
    router.replace(nextPath)
  }

  const submitCredentials = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setLoading(true)
    try {
      if (mode === 'register') {
        await authAPI.registerBuyer({ name, email, password, phone })
        setPurpose('VERIFY_EMAIL')
      } else {
        const response = await authAPI.beginBuyerLogin({ email, password })
        setPurpose(response.data.purpose)
      }
      setCode(''); attemptedCode.current = null
      setMode('verify')
    } catch (err) {
      const msg = message(err)
      // Email already registered — switch to login mode automatically so the
      // buyer doesn't have to find and click the toggle themselves.
      if (mode === 'register' && msg.toLowerCase().includes('already exists')) {
        setMode('login')
        setError('This email is already registered. Enter your password to sign in.')
      } else {
        setError(msg)
      }
    } finally { setLoading(false) }
  }

  const CODE_LENGTH = 6
  const codeInputRef = useRef<HTMLInputElement>(null)
  // The last code sent for verification — stops the same wrong code being
  // auto-submitted again, and stops a double submit while one is in flight.
  const attemptedCode = useRef<string | null>(null)

  const verifyCode = async (value: string) => {
    if (value.length !== CODE_LENGTH || attemptedCode.current === value) return
    attemptedCode.current = value
    setError(''); setLoading(true)
    try {
      const { data } = await authAPI.verifyBuyerCode({ email, code: value, purpose })
      await getProfile(data.access_token)
    } catch (err) {
      setError(message(err))
      // Clear the wrong code so the buyer can type the right one straight away.
      setCode('')
      attemptedCode.current = null
      requestAnimationFrame(() => codeInputRef.current?.focus())
    } finally { setLoading(false) }
  }

  const handleCodeChange = (raw: string) => {
    // Digits only; also handles pasting a code with spaces or dashes.
    const value = raw.replace(/\D/g, '').slice(0, CODE_LENGTH)
    setCode(value)
    if (error) setError('')
    // Verify automatically as soon as the last digit is entered (or pasted).
    if (value.length === CODE_LENGTH) void verifyCode(value)
  }

  const submitCode = (event: FormEvent) => {
    event.preventDefault()
    attemptedCode.current = null // an explicit click always retries
    void verifyCode(code)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <CheckoutProgress current="account" />
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{mode === 'verify' ? 'Check your email' : nextPath === '/checkout/delivery' ? 'Continue to checkout' : nextPath.startsWith('/track') || nextPath.startsWith('/order') ? 'Sign in to track your order' : 'Sign in to your account'}</h1>
        <p className="text-sm text-gray-600 mt-2 mb-6">{mode === 'verify' ? `We sent a six-digit code to ${email}.` : 'Sign in with your verified buyer account.'}</p>
        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"><p>{error}</p>{mode === 'register' && error.toLowerCase().includes('already exists') && <Link href={resetHref} className="mt-2 inline-block font-medium underline">Reset this account&apos;s password</Link>}</div>}
        {mode === 'verify' ? (
          <form onSubmit={submitCode} className="space-y-4">
            <input ref={codeInputRef} autoFocus inputMode="numeric" autoComplete="one-time-code" aria-label="Verification code" maxLength={CODE_LENGTH} value={code} onChange={(e) => handleCodeChange(e.target.value)} disabled={loading} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-mono text-2xl tracking-[0.45em] disabled:bg-gray-50" required />
            <p className="text-center text-xs text-gray-500">We&apos;ll verify automatically once all {CODE_LENGTH} digits are in.</p>
            <Button type="submit" className="w-full" disabled={loading || code.length !== CODE_LENGTH}>{loading ? 'Verifying…' : 'Verify and continue'}</Button>
            <button type="button" onClick={() => { setMode('login'); setCode(''); setError(''); attemptedCode.current = null }} className="w-full text-sm text-primary-600">Use a different account</button>
          </form>
        ) : (
          <form onSubmit={submitCredentials} className="space-y-4">
            {mode === 'register' && <>
              <div><label htmlFor="account-name" className="mb-1 block text-sm font-medium text-gray-700">Full name</label><input id="account-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3" required /></div>
              <div><label htmlFor="account-phone" className="mb-1 block text-sm font-medium text-gray-700">M-Pesa phone number</label><input id="account-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3" required /></div>
            </>}
            <div><label htmlFor="account-email" className="mb-1 block text-sm font-medium text-gray-700">Email address</label><input id="account-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3" required /></div>
            <div>
            <label htmlFor="account-password" className="mb-1 block text-sm font-medium text-gray-700">Password (at least 8 characters)</label>
            <PasswordInput
              id="account-password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              className="py-3" required
            />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</Button>
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }} className="w-full text-sm text-primary-600">{mode === 'login' ? 'New to Quza? Create an account' : 'Already have an account? Sign in'}</button>
            {mode === 'login' && <Link href={resetHref} className="block w-full text-center text-sm text-primary-600">Forgot password?</Link>}
          </form>
        )}
      </div>
      <Link href={nextPath === '/checkout/delivery' ? '/cart' : '/track'} className="mt-5 block text-center text-sm text-gray-500">{nextPath === '/checkout/delivery' ? 'Back to cart' : 'Back to order tracking'}</Link>
    </div>
  )
}

export default function CheckoutAccountPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <CheckoutAccountPageContent />
    </Suspense>
  )
}
