'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Camera, CheckCircle2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { authAPI } from '@/lib/api'
import { BuyerProfile, useAuthStore } from '@/stores/authStore'
import { useSwitchAccount } from '@/hooks/useSwitchAccount'
import { AccountSkeleton } from '@/components/skeletons/PageSkeletons'
import { AddressBook } from '@/components/account/AddressBook'
import { ChangeEmailDialog } from '@/components/account/ChangeEmailDialog'
import { ChangePasswordDialog } from '@/components/account/ChangePasswordDialog'
import { InfoRow, ProfileField, ProfileSection } from '@/components/account/ProfileSection'
import { useProfilePhoto } from '@/components/account/useProfilePhoto'

const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Login & security' },
  { id: 'addresses', label: 'Addresses' },
]

export default function AccountPage() {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const replaceToken = useAuthStore((state) => state.replaceToken)
  const { switchAccount, signOut } = useSwitchAccount()

  const [profileEditing, setProfileEditing] = useState(false)
  const [profileFocus, setProfileFocus] = useState<ProfileField | undefined>()
  const [headerNotice, setHeaderNotice] = useState('')
  const [securityNotice, setSecurityNotice] = useState('')
  const [emailOpen, setEmailOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  // Set when the buyer signs out / switches here, so the "not signed in"
  // redirect below doesn't override where those actions navigate to.
  const leaving = useRef(false)

  const photo = useProfilePhoto({ onUpdated: setUser, onNotice: setHeaderNotice })

  useEffect(() => {
    if (!token) { if (!leaving.current) router.replace('/checkout/account?next=/account'); return }
    // Refresh so the profile and address book reflect changes made elsewhere.
    authAPI.getMe().then((res) => setUser(res.data.user as BuyerProfile)).catch(() => {})
  }, [token, router, setUser])

  if (!token || !user) return <AccountSkeleton />

  const editProfile = (editing: boolean, focus?: ProfileField) => {
    setProfileFocus(focus)
    setProfileEditing(editing)
    if (editing) document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My account</h1>
        <nav aria-label="Account sections" className="mt-3 flex flex-wrap gap-2">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-600 hover:border-primary-200 hover:text-primary-700 transition-colors">
              {section.label}
            </a>
          ))}
        </nav>
      </div>

      {/* ── Who is signed in ── */}
      <section aria-label="Your account" className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={photo.pick}
              disabled={photo.uploading || photo.removing}
              className="group relative shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              aria-label={user.avatarUrl ? 'Change profile photo' : 'Add profile photo'}
              title={user.avatarUrl ? 'Change profile photo' : 'Add profile photo'}
            >
              <Avatar src={user.avatarUrl} name={user.name} fallback={user.email} size="lg" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-900 text-white shadow group-hover:bg-primary-600 transition-colors" aria-hidden="true">
                <Camera className="h-3.5 w-3.5" />
              </span>
            </button>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-gray-500">Signed in as</p>
              <p className="text-lg font-semibold text-gray-900 truncate">{user.name}</p>
              {user.username ? (
                <p className="text-sm text-gray-500 truncate">@{user.username}</p>
              ) : (
                <button type="button" onClick={() => editProfile(true, 'username')} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                  Create username
                </button>
              )}
              <p className="text-sm text-gray-600 truncate">{user.email}</p>
              {memberSince && <p className="text-xs text-gray-400 mt-0.5">Member since {memberSince}</p>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" onClick={() => { leaving.current = true; switchAccount('/account') }}>Switch account</Button>
            <Button variant="ghost" onClick={() => { leaving.current = true; signOut() }}>Sign out</Button>
          </div>
        </div>
        {headerNotice && <p className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700" role="status">{headerNotice}</p>}
        <p className="mt-4 text-xs text-gray-500">
          Sharing this device? Use <span className="font-medium">Switch account</span> so the next person signs in with their own
          account — your delivery details and orders are cleared from this browser.
        </p>
      </section>

      <ProfileSection
        user={user}
        onSaved={setUser}
        editing={profileEditing}
        onEditingChange={editProfile}
        focusField={profileFocus}
        onChangePhoto={photo.pick}
        onRemovePhoto={photo.remove}
        photoBusy={photo.uploading || photo.removing}
      />

      {/* ── Login & security ── */}
      <section id="security" aria-labelledby="security-heading" className="bg-white rounded-xl border border-gray-200 p-6 scroll-mt-24">
        <div className="mb-4">
          <h2 id="security-heading" className="text-xl font-semibold text-gray-900">Login &amp; security</h2>
          <p className="text-sm text-gray-500">How you sign in to Quzaurban. Changes need your current password.</p>
        </div>
        {securityNotice && <p className="mb-4 rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700" role="status">{securityNotice}</p>}
        <dl className="divide-y divide-gray-100">
          <InfoRow label="Email" action={<Button size="sm" variant="ghost" onClick={() => { setSecurityNotice(''); setEmailOpen(true) }}>Change</Button>}>
            <span className="flex items-center gap-2 flex-wrap">
              <span className="truncate">{user.email}</span>
              {user.emailVerifiedAt && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Verified
                </span>
              )}
            </span>
          </InfoRow>
          <InfoRow label="Password" action={<Button size="sm" variant="ghost" onClick={() => { setSecurityNotice(''); setPasswordOpen(true) }}>Change</Button>}>
            <span className="tracking-widest text-gray-500" aria-label="Password hidden">••••••••</span>
          </InfoRow>
        </dl>
      </section>

      <AddressBook user={user} setUser={setUser} />

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/track" className="text-primary-600 hover:text-primary-700">Track an order</Link>
        <Link href="/cart" className="text-primary-600 hover:text-primary-700">Go to cart</Link>
      </div>

      {photo.element}
      <ChangeEmailDialog
        open={emailOpen}
        currentEmail={user.email}
        onClose={() => setEmailOpen(false)}
        onChanged={(nextToken, nextUser) => {
          // The JWT carries the email, so the old token must be replaced.
          replaceToken(nextToken, nextUser)
          setEmailOpen(false)
          setSecurityNotice(`Your email is now ${nextUser.email}. We've sent a notice to your previous address.`)
        }}
      />
      <ChangePasswordDialog
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onChanged={() => { setPasswordOpen(false); setSecurityNotice('Your password has been changed.') }}
      />
    </div>
  )
}
