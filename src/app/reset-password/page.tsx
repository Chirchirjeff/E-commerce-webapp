'use client'

import { FormEvent, Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import { PasswordInput } from '@/components/account/PasswordInput'
import { authAPI, getApiErrorMessage } from '@/lib/api'
import { BuyerProfile, useAuthStore } from '@/stores/authStore'
import { AuthCardSkeleton } from '@/components/skeletons/PageSkeletons'

const CODE_LENGTH = 6
const MIN_PASSWORD = 8
/** The server ignores re-sends inside this window, so the link stays hidden until it passes. */
const RESEND_AFTER_SECONDS = 60
/** The server burns the code after this many wrong attempts (verify + confirm combined). */
const MAX_CODE_ATTEMPTS = 5
const DEFAULT_EXPIRES_SECONDS = 900
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Step = 'email' | 'code' | 'password'

/** Only same-site paths are allowed as a return target. */
function safeNextPath(raw: string | null): string {
  return raw?.startsWith('/') && !raw.startsWith('//') ? raw : '/account'
}

function isCodeError(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status
  return status === 400 && /code/i.test(getApiErrorMessage(err, ''))
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setSession = useAuthStore((state) => state.setSession)
  const nextPath = safeNextPath(searchParams.get('next'))

  // Legacy emailed links (?token=…) skip straight to choosing a new password.
  const [legacyToken, setLegacyToken] = useState(searchParams.get('token') || '')
  const [step, setStep] = useState<Step>(legacyToken ? 'password' : 'email')
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [sentTo, setSentTo] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [expiresAt, setExpiresAt] = useState(0)
  const [resendAt, setResendAt] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  // Set when the password changed but we couldn't sign the buyer in automatically.
  const [doneWithoutSession, setDoneWithoutSession] = useState(false)

  const emailInputRef = useRef<HTMLInputElement>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  // The last code sent for checking — stops the same wrong code being
  // auto-submitted twice, and a double submit while one is in flight.
  const attemptedCode = useRef<string | null>(null)

  // Tick once a second while a code is outstanding, for the resend countdown and expiry.
  useEffect(() => {
    if (legacyToken || step === 'email') return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [step, legacyToken])

  // Move focus to the main field of each step.
  useEffect(() => {
    const target = step === 'email' ? emailInputRef : step === 'code' ? codeInputRef : passwordInputRef
    requestAnimationFrame(() => target.current?.focus())
  }, [step])

  const secondsUntilResend = Math.max(0, Math.ceil((resendAt - now) / 1000))
  const expired = !legacyToken && step !== 'email' && expiresAt > 0 && now >= expiresAt
  const codeBurned = failedAttempts >= MAX_CODE_ATTEMPTS
  const sentToEmail = sentTo || email.trim().toLowerCase()

  const sendCode = async () => {
    const normalised = email.trim().toLowerCase()
    const { data } = await authAPI.requestPasswordReset(normalised)
    const sentAt = Date.now()
    setSentTo(normalised)
    setExpiresAt(sentAt + (data.expiresInSeconds || DEFAULT_EXPIRES_SECONDS) * 1000)
    setResendAt(sentAt + RESEND_AFTER_SECONDS * 1000)
    setNow(sentAt)
    setCode(''); setFailedAttempts(0); attemptedCode.current = null
  }

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault()
    if (!EMAIL_RE.test(email.trim())) { setError('Please enter a valid email address'); return }
    setError(''); setInfo(''); setLoading(true)
    try {
      await sendCode()
      setStep('code')
    } catch (err) {
      setError(getApiErrorMessage(err, 'We could not send a reset code. Please try again.'))
    } finally { setLoading(false) }
  }

  const resend = async () => {
    setError(''); setInfo(''); setLoading(true)
    try {
      await sendCode()
      setStep('code')
      setInfo(`We sent a new code to ${email.trim().toLowerCase()}.`)
      requestAnimationFrame(() => codeInputRef.current?.focus())
    } catch (err) {
      setError(getApiErrorMessage(err, 'We could not send a new code. Please try again.'))
    } finally { setLoading(false) }
  }

  /** Records a wrong code (the server counts these too) and explains what happened. */
  const recordWrongCode = (err: unknown) => {
    const attempts = failedAttempts + 1
    setFailedAttempts(attempts)
    setError(attempts >= MAX_CODE_ATTEMPTS
      ? 'Too many incorrect attempts, so that code no longer works. Request a new code to try again.'
      : getApiErrorMessage(err, 'The reset code is invalid or has expired'))
    setCode(''); attemptedCode.current = null
    requestAnimationFrame(() => codeInputRef.current?.focus())
  }

  const verifyCode = async (value: string) => {
    if (value.length !== CODE_LENGTH || attemptedCode.current === value || codeBurned || expired) return
    attemptedCode.current = value
    setError(''); setInfo(''); setLoading(true)
    try {
      await authAPI.verifyPasswordResetCode({ email: sentToEmail, code: value })
      setStep('password')
    } catch (err) {
      if (isCodeError(err)) recordWrongCode(err)
      else {
        setError(getApiErrorMessage(err, 'We could not check that code. Please try again.'))
        attemptedCode.current = null
      }
    } finally { setLoading(false) }
  }

  const onCodeChange = (raw: string) => {
    // Digits only; also handles pasting a code with spaces or dashes.
    const value = raw.replace(/\D/g, '').slice(0, CODE_LENGTH)
    setCode(value)
    if (error && !codeBurned) setError('')
    if (value.length === CODE_LENGTH) void verifyCode(value)
  }

  const submitCode = (event: FormEvent) => {
    event.preventDefault()
    attemptedCode.current = null // an explicit click always retries
    void verifyCode(code)
  }

  const changeEmail = () => {
    setStep('email'); setCode(''); setPassword(''); setConfirmPassword('')
    setError(''); setInfo(''); setFailedAttempts(0); attemptedCode.current = null
  }

  const signIn = async (accessToken: string) => {
    try {
      const profile = (await authAPI.getMe(accessToken)).data.user as BuyerProfile
      setSession(accessToken, profile)
      router.replace(nextPath)
    } catch {
      // The password did change; we just couldn't start the session here.
      setDoneWithoutSession(true)
    }
  }

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault()
    if (password.length < MIN_PASSWORD) { setError(`Your new password needs at least ${MIN_PASSWORD} characters`); return }
    if (password !== confirmPassword) { setError('The passwords don’t match'); return }
    setError(''); setInfo(''); setLoading(true)
    try {
      const { data } = await authAPI.confirmPasswordReset(
        legacyToken ? { token: legacyToken, password } : { email: sentToEmail, code, password },
      )
      await signIn(data.access_token)
    } catch (err) {
      if (!legacyToken && isCodeError(err)) {
        // The code expired or was used up between steps — send them back for a new one.
        setStep('code')
        recordWrongCode(err)
      } else {
        setError(getApiErrorMessage(err, legacyToken
          ? 'We could not reset your password. This link may have expired — request a reset code instead.'
          : 'We could not reset your password. Please try again.'))
      }
    } finally { setLoading(false) }
  }

  const switchFromLegacyLink = () => {
    setLegacyToken(''); setPassword(''); setConfirmPassword('')
    setError(''); setInfo(''); setStep('email')
  }

  const signInHref = `/checkout/account?next=${encodeURIComponent(nextPath)}`

  const title = doneWithoutSession
    ? 'Password changed'
    : step === 'email' ? 'Reset your password' : step === 'code' ? 'Check your email' : 'Choose a new password'
  const description = doneWithoutSession
    ? 'Your password has been changed. Sign in with your new password to continue.'
    : step === 'email'
      ? 'Enter the email address for your Quza account and we’ll send you a 6-digit reset code.'
      : step === 'code'
        ? <>Enter the 6-digit code we sent to <span className="font-medium text-gray-800">{sentToEmail}</span>.</>
        : legacyToken
          ? 'Enter a new password for your Quza buyer account.'
          : <>Create a new password for <span className="font-medium text-gray-800">{sentToEmail}</span>.</>

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 mb-6 text-sm text-gray-600">{description}</p>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700" role="alert">
            <p>{error}</p>
            {legacyToken && (
              <button type="button" onClick={switchFromLegacyLink} className="mt-2 font-medium underline">Get a reset code instead</button>
            )}
          </div>
        )}
        {info && !error && <p className="mb-4 rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700" role="status">{info}</p>}

        {doneWithoutSession ? (
          <Link href={signInHref} className="flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700">Sign in</Link>
        ) : step === 'email' ? (
          <form onSubmit={submitEmail} noValidate className="space-y-4">
            <label htmlFor="reset-email" className="sr-only">Email address</label>
            <input
              ref={emailInputRef} id="reset-email" type="email" autoComplete="email" value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              className="w-full rounded-lg border border-gray-300 px-4 py-3" placeholder="Email address" required
            />
            <Button type="submit" className="w-full" isLoading={loading}>{loading ? 'Sending code…' : 'Send code'}</Button>
          </form>
        ) : step === 'code' ? (
          <form onSubmit={submitCode} className="space-y-4">
            <input
              ref={codeInputRef} inputMode="numeric" autoComplete="one-time-code" aria-label="Reset code"
              maxLength={CODE_LENGTH} value={code} onChange={(e) => onCodeChange(e.target.value)}
              disabled={loading || codeBurned || expired}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-mono text-2xl tracking-[0.45em] disabled:bg-gray-50"
              placeholder="000000"
            />
            <p className="text-center text-xs text-gray-500">
              {expired
                ? 'This code has expired. Request a new one below.'
                : `We'll check it automatically once all ${CODE_LENGTH} digits are in. The code expires in 15 minutes.`}
            </p>
            <Button type="submit" className="w-full" disabled={loading || code.length !== CODE_LENGTH || codeBurned || expired}>
              {loading ? 'Checking…' : 'Next'}
            </Button>
            <div className="flex items-center justify-between gap-3 text-sm">
              <button type="button" onClick={changeEmail} disabled={loading} className="text-gray-600 hover:text-gray-900 disabled:opacity-50">
                Use a different email
              </button>
              {secondsUntilResend > 0 ? (
                <span className="text-gray-500" aria-live="off">Resend code in {secondsUntilResend}s</span>
              ) : (
                <button type="button" onClick={resend} disabled={loading} className="font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50">
                  Resend code
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">Not seeing it? Check your spam folder, and make sure this is the email you use to sign in.</p>
          </form>
        ) : (
          <form onSubmit={submitPassword} noValidate className="space-y-4">
            <div>
              <label htmlFor="reset-password-new" className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <PasswordInput
                ref={passwordInputRef} id="reset-password-new" autoComplete="new-password" minLength={MIN_PASSWORD}
                value={password} onChange={(e) => { setPassword(e.target.value); setError('') }}
                className="py-3" placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label htmlFor="reset-password-confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <PasswordInput
                id="reset-password-confirm" autoComplete="new-password" minLength={MIN_PASSWORD}
                value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                invalid={confirmPassword.length >= password.length && confirmPassword.length > 0 && confirmPassword !== password}
                className="py-3"
              />
            </div>
            {/* Hidden username field so password managers save the new password against the right account. */}
            {!legacyToken && <input type="email" name="username" autoComplete="username" value={sentToEmail} readOnly hidden />}
            <Button type="submit" className="w-full" isLoading={loading}>{loading ? 'Saving…' : 'Save password and sign in'}</Button>
            {!legacyToken && (
              <button type="button" onClick={changeEmail} disabled={loading} className="w-full text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50">
                Use a different email
              </button>
            )}
          </form>
        )}
        {!doneWithoutSession && <Link href={signInHref} className="mt-5 block text-center text-sm text-primary-600">Back to sign in</Link>}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<AuthCardSkeleton label="Loading…" showProgress={false} />}><ResetPasswordContent /></Suspense>
}
