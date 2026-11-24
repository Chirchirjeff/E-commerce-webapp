'use client'

import { forwardRef, useEffect, useState } from 'react'
import axios from 'axios'
import { Check, Loader2, X } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { USERNAME_MAX, normalizeUsername, usernameProblem } from '@/lib/username'

const CHECK_DELAY_MS = 400

/**
 * - `empty` / `unchanged`: nothing to check
 * - `invalid`: breaks the format rules (known instantly, client-side)
 * - `checking` → `available` | `unavailable` (taken or reserved, per the server)
 * - `error`: the check itself failed; the server will still validate on save
 */
export type UsernameStatus = 'empty' | 'unchanged' | 'invalid' | 'checking' | 'available' | 'unavailable' | 'error'

interface CheckResult {
  username: string
  status: 'available' | 'unavailable' | 'error'
  reason: string | null
  suggestions: string[]
}

interface UsernameFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  /** The buyer's current username, which never needs checking. */
  current?: string | null
  onStatusChange?: (status: UsernameStatus) => void
  /** Error returned by the server on save, shown until the value changes. */
  serverError?: string
}

export const UsernameField = forwardRef<HTMLInputElement, UsernameFieldProps>(function UsernameField(
  { id, value, onChange, current, onStatusChange, serverError },
  ref,
) {
  const username = normalizeUsername(value)
  const problem = username ? usernameProblem(username) : null
  const unchanged = !!username && username === (current ?? '')
  const [check, setCheck] = useState<CheckResult | null>(null)

  useEffect(() => {
    if (!username || problem || unchanged) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await authAPI.checkUsername(username, controller.signal)
        setCheck({
          username,
          status: data.available ? 'available' : 'unavailable',
          reason: data.reason,
          suggestions: data.suggestions ?? [],
        })
      } catch (err) {
        if (axios.isCancel(err)) return
        setCheck({ username, status: 'error', reason: null, suggestions: [] })
      }
    }, CHECK_DELAY_MS)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [username, problem, unchanged])

  // Only trust a result for exactly what is in the box right now.
  const result = check?.username === username ? check : null
  const status: UsernameStatus = !username ? 'empty'
    : problem ? 'invalid'
    : unchanged ? 'unchanged'
    : result?.status ?? 'checking'

  useEffect(() => { onStatusChange?.(status) }, [status, onStatusChange])

  const message = serverError
    ?? (status === 'invalid' ? problem
      : status === 'unavailable' ? (result?.reason || 'That username isn’t available')
      : null)
  const describedBy = `${id}-status`

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500" aria-hidden="true">@</span>
        <input
          ref={ref}
          id={id}
          value={value}
          // Lowercase as they type, and accept a pasted "@handle".
          onChange={(e) => onChange(e.target.value.replace(/^@+/, '').toLowerCase())}
          maxLength={USERNAME_MAX + 1}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
          spellCheck={false}
          aria-invalid={!!message}
          aria-describedby={describedBy}
          className={`w-full pl-8 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent ${
            message ? 'border-red-500' : status === 'available' ? 'border-green-500' : 'border-gray-300'
          }`}
          placeholder="jane.doe"
        />
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3" aria-hidden="true">
          {status === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          {status === 'available' && !serverError && <Check className="h-4 w-4 text-green-600" />}
          {message && <X className="h-4 w-4 text-red-500" />}
        </span>
      </div>

      <div id={describedBy} aria-live="polite" className="mt-1 min-h-[1.25rem] text-sm">
        {message ? (
          <p className="text-red-600">{message}</p>
        ) : status === 'available' ? (
          <p className="text-green-700">@{username} is available</p>
        ) : status === 'checking' ? (
          <p className="text-gray-500">Checking availability…</p>
        ) : status === 'error' ? (
          <p className="text-gray-500">We couldn’t check availability right now — we’ll confirm when you save.</p>
        ) : (
          <p className="text-gray-500">3–30 characters: letters, numbers, periods and underscores.</p>
        )}
      </div>

      {!serverError && status === 'unavailable' && result && result.suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Available:</span>
          {result.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onChange(suggestion)}
              className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors"
            >
              @{suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
