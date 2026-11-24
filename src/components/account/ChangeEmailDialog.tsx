'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { authAPI, getApiErrorMessage } from '@/lib/api'
import { BuyerProfile } from '@/stores/authStore'
import { AccountDialog } from './AccountDialog'
import { PasswordInput } from './PasswordInput'

const CODE_LENGTH = 6
const RESEND_AFTER_SECONDS = 60
/** The server burns the code after this many wrong attempts. */
const MAX_CODE_ATTEMPTS = 5
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ChangeEmailDialogProps {
  open: boolean
  currentEmail: string
  onClose: () => void
  /** Called with the re-issued token and updated account once the code is confirmed. */
  onChanged: (token: string, user: BuyerProfile) => void
}

export function ChangeEmailDialog({ open, currentEmail, onClose, onChanged }: ChangeEmailDialogProps) {
  const [step, setStep] = useState<'details' | 'code'>('details')
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [expiresAt, setExpiresAt] = useState(0)
  const [resendAt, setResendAt] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const codeInputRef = useRef<HTMLInputElement>(null)
  // Stops the same wrong code being auto-submitted twice.
  const attemptedCode = useRef<string | null>(null)

  // Reset whenever the dialog is opened.
  useEffect(() => {
    if (!open) return
    setStep('details'); setNewEmail(''); setPassword(''); setCode(''); setSentTo('')
    setFailedAttempts(0); setError(''); setInfo(''); setLoading(false)
    attemptedCode.current = null
  }, [open])

  // Tick once a second while waiting for a code, for the resend countdown.
  useEffect(() => {
    if (!open || step !== 'code') return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [open, step])

  const secondsUntilResend = Math.max(0, Math.ceil((resendAt - now) / 1000))
  const expired = step === 'code' && expiresAt > 0 && now >= expiresAt
  const codeBurned = failedAttempts >= MAX_CODE_ATTEMPTS

  const sendCode = async () => {
    const { data } = await authAPI.requestEmailChange({ newEmail: newEmail.trim().toLowerCase(), currentPassword: password })
    const sentAt = Date.now()
    setSentTo(data.email)
    setExpiresAt(sentAt + (data.expiresInSeconds || 600) * 1000)
    setResendAt(sentAt + RESEND_AFTER_SECONDS * 1000)
    setNow(sentAt)
    setCode(''); setFailedAttempts(0); attemptedCode.current = null
  }

  const submitDetails = async (event: FormEvent) => {
    event.preventDefault()
    const email = newEmail.trim().toLowerCase()
    if (!EMAIL_RE.test(email)) { setError('Please enter a valid email address'); return }
    if (email === currentEmail.toLowerCase()) { setError('That is already your email address'); return }
    if (!password) { setError('Enter your current password to continue'); return }
    setError(''); setLoading(true)
    try {
      await sendCode()
      setStep('code')
      requestAnimationFrame(() => codeInputRef.current?.focus())
    } catch (err) {
      setError(getApiErrorMessage(err, 'We could not send a code. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setError(''); setInfo(''); setLoading(true)
    try {
      await sendCode()
      setInfo(`We sent a new code to ${newEmail.trim().toLowerCase()}.`)
      requestAnimationFrame(() => codeInputRef.current?.focus())
    } catch (err) {
      setError(getApiErrorMessage(err, 'We could not send a new code. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const verify = async (value: string) => {
    if (value.length !== CODE_LENGTH || attemptedCode.current === value || codeBurned) return
    attemptedCode.current = value
    setError(''); setInfo(''); setLoading(true)
    try {
      const { data } = await authAPI.confirmEmailChange(value)
      onChanged(data.access_token, data.user)
    } catch (err) {
      const attempts = failedAttempts + 1
      setFailedAttempts(attempts)
      setError(attempts >= MAX_CODE_ATTEMPTS
        ? 'Too many incorrect attempts, so that code no longer works. Request a new code to try again.'
        : getApiErrorMessage(err, 'The verification code is invalid or expired'))
      setCode(''); attemptedCode.current = null
      requestAnimationFrame(() => codeInputRef.current?.focus())
    } finally {
      setLoading(false)
    }
  }

  const onCodeChange = (raw: string) => {
    const value = raw.replace(/\D/g, '').slice(0, CODE_LENGTH)
    setCode(value)
    if (error && !codeBurned) setError('')
    if (value.length === CODE_LENGTH) void verify(value)
  }

  const submitCode = (event: FormEvent) => {
    event.preventDefault()
    attemptedCode.current = null
    void verify(code)
  }

  return (
    <AccountDialog
      open={open}
      title={step === 'details' ? 'Change email address' : 'Check your new inbox'}
      description={step === 'details'
        ? <>You currently sign in with <span className="font-medium text-gray-700">{currentEmail}</span>.</>
        : <>Enter the 6-digit code we sent to <span className="font-medium text-gray-700">{sentTo}</span>.</>}
      onClose={onClose}
      busy={loading}
    >
      {error && <p className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700" role="alert">{error}</p>}
      {info && !error && <p className="mb-4 rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700" role="status">{info}</p>}

      {step === 'details' ? (
        <form onSubmit={submitDetails} noValidate className="space-y-4">
          <div>
            <label htmlFor="change-email-new" className="block text-sm font-medium text-gray-700 mb-1">New email address</label>
            <input
              id="change-email-new" type="email" autoComplete="email" value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); setError('') }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="change-email-password" className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
            <PasswordInput
              id="change-email-password" autoComplete="current-password" value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
            />
            <p className="mt-1 text-xs text-gray-500">For your security, confirm it&apos;s you before we change how you sign in.</p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="flex-1" isLoading={loading}>{loading ? 'Sending code…' : 'Send code'}</Button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitCode} className="space-y-4">
          <input
            ref={codeInputRef} inputMode="numeric" autoComplete="one-time-code" aria-label="Verification code"
            maxLength={CODE_LENGTH} value={code} onChange={(e) => onCodeChange(e.target.value)}
            disabled={loading || codeBurned || expired}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-mono text-2xl tracking-[0.45em] disabled:bg-gray-50"
            placeholder="000000"
          />
          <p className="text-center text-xs text-gray-500">
            {expired
              ? 'This code has expired. Request a new one below.'
              : `We'll verify automatically once all ${CODE_LENGTH} digits are in. The code expires in 10 minutes.`}
          </p>
          <Button type="submit" className="w-full" disabled={loading || code.length !== CODE_LENGTH || codeBurned || expired}>
            {loading ? 'Verifying…' : 'Confirm new email'}
          </Button>
          <div className="flex items-center justify-between gap-3 text-sm">
            <button type="button" onClick={() => { setStep('details'); setError(''); setInfo('') }} disabled={loading} className="text-gray-600 hover:text-gray-900 disabled:opacity-50">
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
          <p className="text-xs text-gray-500">Not seeing it? Check your spam folder. We&apos;ll also let {currentEmail} know about this change.</p>
        </form>
      )}
    </AccountDialog>
  )
}
