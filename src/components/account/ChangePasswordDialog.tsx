'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { authAPI, getApiErrorMessage } from '@/lib/api'
import { AccountDialog } from './AccountDialog'
import { PasswordInput } from './PasswordInput'
import { useAuthStore } from '@/stores/authStore'

const MIN_PASSWORD = 8

interface ChangePasswordDialogProps {
  open: boolean
  onClose: () => void
  onChanged: () => void
}

export function ChangePasswordDialog({ open, onClose, onChanged }: ChangePasswordDialogProps) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const email = useAuthStore((state) => state.user?.email ?? '')

  useEffect(() => {
    if (open) { setCurrent(''); setNext(''); setConfirm(''); setError(''); setLoading(false) }
  }, [open])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!current) { setError('Enter your current password'); return }
    if (next.length < MIN_PASSWORD) { setError(`Your new password needs at least ${MIN_PASSWORD} characters`); return }
    if (next !== confirm) { setError('The new passwords don’t match'); return }
    if (next === current) { setError('Choose a password you aren’t already using'); return }
    setError(''); setLoading(true)
    try {
      await authAPI.changePassword({ currentPassword: current, newPassword: next })
      onChanged()
    } catch (err) {
      setError(getApiErrorMessage(err, 'We could not change your password. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AccountDialog open={open} title="Change password" description="Use at least 8 characters. Avoid reusing a password from another site." onClose={onClose} busy={loading}>
      <form onSubmit={submit} noValidate className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700" role="alert">{error}</p>}
        <div>
          <label htmlFor="password-current" className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
          <PasswordInput id="password-current" autoComplete="current-password" value={current} onChange={(e) => { setCurrent(e.target.value); setError('') }} />
          <Link
            href={`/reset-password?email=${encodeURIComponent(email)}&next=${encodeURIComponent('/account')}`}
            className="mt-1 inline-block text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Forgot your password? We&apos;ll email you a reset code
          </Link>
        </div>
        <div>
          <label htmlFor="password-new" className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <PasswordInput id="password-new" autoComplete="new-password" minLength={MIN_PASSWORD} value={next} onChange={(e) => { setNext(e.target.value); setError('') }} />
        </div>
        <div>
          <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
          <PasswordInput id="password-confirm" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError('') }} />
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" className="flex-1" isLoading={loading}>{loading ? 'Saving…' : 'Change password'}</Button>
        </div>
      </form>
    </AccountDialog>
  )
}
