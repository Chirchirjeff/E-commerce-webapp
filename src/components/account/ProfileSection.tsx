'use client'

import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { AtSign } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { authAPI, getApiErrorMessage } from '@/lib/api'
import { normalizeUsername } from '@/lib/username'
import { validateKenyanPhone } from '@/lib/utils'
import { BuyerProfile } from '@/stores/authStore'
import { UsernameField, UsernameStatus } from './UsernameField'

export type ProfileField = 'name' | 'username' | 'phone'
type Field = ProfileField

interface ProfileSectionProps {
  user: BuyerProfile
  onSaved: (user: BuyerProfile) => void
  editing: boolean
  onEditingChange: (editing: boolean, focus?: Field) => void
  /** Field to focus when the form opens (e.g. "username" from the create prompt). */
  focusField?: Field
  onChangePhoto: () => void
  onRemovePhoto: () => void
  photoBusy: boolean
}

/** One read-only line in the Google-account style list. */
export function InfoRow({ label, children, action }: { label: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-4 first:pt-0 last:pb-0">
      <dt className="sm:w-40 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="flex-1 min-w-0 text-gray-900">{children}</dd>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

const inputClass = (invalid: boolean) =>
  `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent ${
    invalid ? 'border-red-500' : 'border-gray-300'
  }`

export function ProfileSection({
  user, onSaved, editing, onEditingChange, focusField, onChangePhoto, onRemovePhoto, photoBusy,
}: ProfileSectionProps) {
  const [name, setName] = useState(user.name)
  const [username, setUsername] = useState(user.username ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('unchanged')
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const usernameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)

  // Fresh form every time it opens.
  useEffect(() => {
    if (!editing) return
    setName(user.name); setUsername(user.username ?? ''); setPhone(user.phone ?? '')
    setErrors({}); setFormError(''); setNotice('')
    const target = focusField === 'username' ? usernameRef : focusField === 'phone' ? phoneRef : nameRef
    requestAnimationFrame(() => target.current?.focus())
    // Only when the form opens, not on every user refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, focusField])

  const onUsernameStatus = useCallback((status: UsernameStatus) => setUsernameStatus(status), [])

  // The field already explains why; saving waits for a usable username.
  const usernameBlocks = usernameStatus === 'invalid' || usernameStatus === 'unavailable' || !!errors.username

  const clearError = (field: Field) => setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError('')
    const nextName = name.trim()
    const nextUsername = normalizeUsername(username)
    const nextPhone = phone.replace(/\s+/g, '')

    const errs: Partial<Record<Field, string>> = {}
    if (!nextName) errs.name = 'Please enter your full name'
    else if (nextName.length > 120) errs.name = 'Name is too long'
    const phoneError = validateKenyanPhone(nextPhone, false)
    if (phoneError) errs.phone = phoneError
    if (!nextUsername && user.username) errs.username = 'Your account needs a username'
    if (Object.values(errs).some(Boolean) || usernameBlocks) {
      setErrors(errs)
      const first = errs.name ? nameRef : errs.username || usernameBlocks ? usernameRef : phoneRef
      first.current?.focus()
      return
    }

    // Send only what changed.
    const payload: { name?: string; username?: string; phone?: string | null } = {}
    if (nextName !== user.name) payload.name = nextName
    if (nextUsername && nextUsername !== (user.username ?? '')) payload.username = nextUsername
    if (nextPhone !== (user.phone ?? '').replace(/\s+/g, '')) payload.phone = nextPhone || null
    if (Object.keys(payload).length === 0) { onEditingChange(false); return }

    setSaving(true)
    try {
      const { data } = await authAPI.updateProfile(payload)
      onSaved(data.user)
      onEditingChange(false)
      setNotice('Your profile has been updated.')
    } catch (err) {
      const message = getApiErrorMessage(err, 'We could not save your profile. Please try again.')
      const lower = message.toLowerCase()
      // Put the server's message next to the field it's about.
      if (lower.includes('username')) { setErrors({ username: message }); usernameRef.current?.focus() }
      else if (lower.includes('phone')) { setErrors({ phone: message }); phoneRef.current?.focus() }
      else if (lower.includes('name')) { setErrors({ name: message }); nameRef.current?.focus() }
      else setFormError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="profile" aria-labelledby="profile-heading" className="bg-white rounded-xl border border-gray-200 p-6 scroll-mt-24">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 id="profile-heading" className="text-xl font-semibold text-gray-900">Profile</h2>
          <p className="text-sm text-gray-500">Your name, @username and photo appear on reviews you write.</p>
        </div>
        {!editing && <Button size="sm" variant="secondary" onClick={() => onEditingChange(true)}>Edit profile</Button>}
      </div>

      {notice && !editing && <p className="mb-4 rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700" role="status">{notice}</p>}

      {!user.username && !editing && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-primary-200 bg-primary-50/60 p-4">
          <AtSign className="hidden sm:block h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-gray-900">Create your username</p>
            <p className="text-gray-600">Pick a unique @handle to show alongside your name on reviews.</p>
          </div>
          <Button size="sm" onClick={() => onEditingChange(true, 'username')} className="shrink-0">Create username</Button>
        </div>
      )}

      {editing ? (
        <form onSubmit={submit} noValidate className="rounded-lg border border-primary-200 bg-primary-50/40 p-4 space-y-4">
          {formError && <p className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700" role="alert">{formError}</p>}
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
            <input
              ref={nameRef} id="profile-name" value={name} autoComplete="name" maxLength={120}
              onChange={(e) => { setName(e.target.value); clearError('name') }}
              aria-invalid={!!errors.name} className={inputClass(!!errors.name)} placeholder="Jane Doe"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="profile-username" className="block text-sm font-medium text-gray-700 mb-1">
              Username{user.username ? ' *' : ''}
            </label>
            <UsernameField
              ref={usernameRef}
              id="profile-username"
              value={username}
              onChange={(next) => { setUsername(next); clearError('username') }}
              current={user.username}
              onStatusChange={onUsernameStatus}
              serverError={errors.username}
            />
          </div>
          <div>
            <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
            <input
              ref={phoneRef} id="profile-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone}
              onChange={(e) => { setPhone(e.target.value); clearError('phone') }}
              aria-invalid={!!errors.phone} className={inputClass(!!errors.phone)} placeholder="0712 345 678"
            />
            {errors.phone
              ? <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              : <p className="mt-1 text-xs text-gray-500">Used to pre-fill M-Pesa payments and delivery contact.</p>}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => onEditingChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" isLoading={saving} disabled={usernameBlocks}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </form>
      ) : (
        <dl className="divide-y divide-gray-100">
          <InfoRow
            label="Photo"
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={onChangePhoto} disabled={photoBusy}>{user.avatarUrl ? 'Change' : 'Add photo'}</Button>
                {user.avatarUrl && (
                  <Button size="sm" variant="ghost" onClick={onRemovePhoto} disabled={photoBusy} className="!text-red-600 hover:!bg-red-50">
                    {photoBusy ? 'Removing…' : 'Remove'}
                  </Button>
                )}
              </div>
            }
          >
            <div className="flex items-center gap-3">
              <Avatar src={user.avatarUrl} name={user.name} fallback={user.email} size="md" />
              <span className="text-sm text-gray-500">{user.avatarUrl ? 'Shown on your reviews' : 'Add a photo to personalise your account'}</span>
            </div>
          </InfoRow>
          <InfoRow label="Name">{user.name}</InfoRow>
          <InfoRow label="Username">
            {user.username ? <span>@{user.username}</span> : <span className="text-gray-400">Not set</span>}
          </InfoRow>
          <InfoRow label="Phone">
            {user.phone ? user.phone : <span className="text-gray-400">Not added</span>}
          </InfoRow>
        </dl>
      )}
    </section>
  )
}
