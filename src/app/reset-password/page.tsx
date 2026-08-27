'use client'

import { FormEvent, Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import { authAPI } from '@/lib/api'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const requestReset = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage(''); setLoading(true)
    try {
      const response = await authAPI.requestBuyerPasswordReset(email)
      setMessage(response.data.message)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'We could not send a reset email. Please try again.')
    } finally { setLoading(false) }
  }

  const confirmReset = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage('')
    if (password !== confirmPassword) { setError('The passwords do not match.'); return }
    setLoading(true)
    try {
      const response = await authAPI.confirmBuyerPasswordReset({ token, password })
      setMessage(response.data.message)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'We could not reset your password. Please request a new link.')
    } finally { setLoading(false) }
  }

  const form = token ? (
    <form onSubmit={confirmReset} className="space-y-4">
      <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3" placeholder="New password (at least 8 characters)" required />
      <input type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3" placeholder="Confirm new password" required />
      <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Changing password…' : 'Change password'}</Button>
    </form>
  ) : (
    <form onSubmit={requestReset} className="space-y-4">
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3" placeholder="Email address" required />
      <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending link…' : 'Email me a reset link'}</Button>
    </form>
  )

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{token ? 'Choose a new password' : 'Reset your password'}</h1>
        <p className="mt-2 mb-6 text-sm text-gray-600">{token ? 'Enter a new password for your Quza buyer account.' : 'Enter your email address and we’ll send a one-time reset link.'}</p>
        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {message && <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}
        {!message && form}
        <Link href="/checkout/account" className="mt-5 block text-center text-sm text-primary-600">Back to sign in</Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="px-4 py-12 text-center text-gray-500">Loading…</div>}><ResetPasswordContent /></Suspense>
}
