'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { authAPI } from '@/lib/api'
import { BuyerAddress, BuyerProfile, useAuthStore } from '@/stores/authStore'
import { useSwitchAccount } from '@/hooks/useSwitchAccount'
import { AccountSkeleton } from '@/components/skeletons/PageSkeletons'
import {
  AddressDraft, AddressFields, EMPTY_ADDRESS, MAX_SAVED_ADDRESSES, formatAddress, validateAddress,
} from '@/components/account/AddressFields'

type Editing = { id?: string; draft: AddressDraft; makeDefault: boolean } | null

export default function AccountPage() {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const { switchAccount, signOut } = useSwitchAccount()

  const [editing, setEditing] = useState<Editing>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [showAll, setShowAll] = useState(false)
  // Set when the buyer signs out / switches here, so the "not signed in"
  // redirect below doesn't override where those actions navigate to.
  const leaving = useRef(false)

  useEffect(() => {
    if (!token) { if (!leaving.current) router.replace('/checkout/account?next=/account'); return }
    // Refresh so the address book reflects changes made elsewhere.
    authAPI.getMe().then((res) => setUser(res.data.user as BuyerProfile)).catch(() => {})
  }, [token, router, setUser])

  if (!token || !user) return <AccountSkeleton />

  const addresses = user.addresses ?? []
  const atLimit = addresses.length >= MAX_SAVED_ADDRESSES
  // Collapsed view shows only the default (listed first by the API).
  const visibleAddresses = showAll ? addresses : addresses.slice(0, 1)
  const setAddresses = (next: BuyerAddress[]) => setUser({ ...user, addresses: next })
  const fail = (err: unknown, fallback: string) =>
    setNotice((err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback)

  const startAdd = () => {
    setErrors({}); setNotice('')
    setEditing({ draft: { ...EMPTY_ADDRESS, recipientName: user.name, phone: user.phone ?? '' }, makeDefault: addresses.length === 0 })
  }

  const startEdit = (address: BuyerAddress) => {
    setErrors({}); setNotice('')
    const { id, isDefault, ...draft } = address
    setEditing({ id, draft, makeDefault: isDefault })
  }

  const saveAddress = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing) return
    const errs = validateAddress(editing.draft, true)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setBusyId(editing.id ?? 'new')
    try {
      await authAPI.saveAddress({ ...editing.draft, id: editing.id, isDefault: editing.makeDefault })
      const me = await authAPI.getMe()
      setUser(me.data.user as BuyerProfile)
      setEditing(null)
      setNotice(editing.id ? 'Address updated.' : 'Address added.')
    } catch (err) {
      fail(err, 'We could not save this address. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  const makeDefault = async (id: string) => {
    setBusyId(id); setNotice('')
    try {
      setAddresses((await authAPI.setDefaultAddress(id)).data.addresses)
      setNotice('Default delivery address updated.')
    } catch (err) {
      fail(err, 'We could not change your default address.')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (address: BuyerAddress) => {
    if (!address.id || !window.confirm(`Remove "${address.label}" from your addresses?`)) return
    setBusyId(address.id); setNotice('')
    try {
      setAddresses((await authAPI.deleteAddress(address.id)).data.addresses)
      setNotice('Address removed.')
    } catch (err) {
      fail(err, 'We could not remove this address.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My account</h1>

      {/* ── Who is signed in ── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 shrink-0 rounded-full bg-primary-600 text-white flex items-center justify-center text-lg font-bold">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-gray-500">Signed in as</p>
              <p className="font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-sm text-gray-600 truncate">{user.email}{user.phone ? ` · ${user.phone}` : ''}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" onClick={() => { leaving.current = true; switchAccount('/account') }}>Switch account</Button>
            <Button variant="ghost" onClick={() => { leaving.current = true; signOut() }}>Sign out</Button>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          Sharing this device? Use <span className="font-medium">Switch account</span> so the next person signs in with their own
          account — your delivery details and orders are cleared from this browser.
        </p>
      </section>

      {/* ── Address book ── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Delivery addresses</h2>
            <p className="text-sm text-gray-500">Your default address is pre-selected at checkout. You can still pick another for any order.</p>
          </div>
          {!editing && (
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Button size="sm" onClick={startAdd} disabled={atLimit} title={atLimit ? `You can save up to ${MAX_SAVED_ADDRESSES} addresses` : undefined}>Add address</Button>
              <span className="text-xs text-gray-500">{addresses.length} of {MAX_SAVED_ADDRESSES} saved</span>
            </div>
          )}
        </div>

        {notice && <p className="mb-4 rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700" role="status">{notice}</p>}

        {editing && (
          <form onSubmit={saveAddress} noValidate className="mb-6 rounded-lg border border-primary-200 bg-primary-50/40 p-4 space-y-4">
            <h3 className="font-semibold text-gray-900">{editing.id ? 'Edit address' : 'New address'}</h3>
            <AddressFields
              value={editing.draft}
              onChange={(draft) => setEditing({ ...editing, draft })}
              errors={errors}
              idPrefix="account-address"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={editing.makeDefault}
                // The current default can only be replaced by choosing another
                // address as default, so a default always exists.
                disabled={!!editing.id && addresses.find((a) => a.id === editing.id)?.isDefault}
                onChange={(e) => setEditing({ ...editing, makeDefault: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-600"
              />
              Use as my default delivery address
            </label>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={busyId !== null}>{busyId ? 'Saving…' : 'Save address'}</Button>
            </div>
          </form>
        )}

        {addresses.length === 0 && !editing ? (
          <p className="text-sm text-gray-500 py-6 text-center">No saved addresses yet. Add one, or it will be saved when you check out.</p>
        ) : (
          <>
          {atLimit && !editing && (
            <p className="mb-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              You&apos;ve reached the limit of {MAX_SAVED_ADDRESSES} saved addresses. Remove one to add another.
            </p>
          )}
          <ul id="account-address-list" className="space-y-3">
            {visibleAddresses.map((address) => (
              <li
                key={address.id}
                className={`rounded-lg border p-4 ${address.isDefault ? 'border-primary-600 ring-1 ring-primary-600' : 'border-gray-200'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                      {address.label}
                      {address.isDefault && (
                        <span className="text-xs font-semibold text-primary-700 bg-primary-50 rounded-full px-2 py-0.5">Default</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-700">{address.recipientName} · {address.phone}</p>
                    <p className="text-sm text-gray-500">{formatAddress(address)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {!address.isDefault && (
                      <Button size="sm" variant="secondary" disabled={busyId !== null} onClick={() => makeDefault(address.id!)}>
                        {busyId === address.id ? 'Saving…' : 'Set as default'}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" disabled={busyId !== null} onClick={() => startEdit(address)}>Edit</Button>
                    <Button size="sm" variant="ghost" disabled={busyId !== null} onClick={() => remove(address)} className="!text-red-600 hover:!bg-red-50">Remove</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {addresses.length > 1 && (
            <button type="button" onClick={() => setShowAll((open) => !open)} aria-expanded={showAll} aria-controls="account-address-list"
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium text-primary-600 hover:bg-primary-50">
              {showAll ? 'Show less' : `Show all ${addresses.length} addresses`}
              <svg className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          )}
          </>
        )}
      </section>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/track" className="text-primary-600 hover:text-primary-700">Track an order</Link>
        <Link href="/cart" className="text-primary-600 hover:text-primary-700">Go to cart</Link>
      </div>
    </div>
  )
}
