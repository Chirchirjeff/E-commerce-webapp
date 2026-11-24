import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// Buyer sessions are deliberately short-lived on shared devices. Change this
// value if the checkout needs a different inactivity window.
export const BUYER_SESSION_DURATION_MS = 30 * 60 * 1000

export interface BuyerAddress {
  id?: string
  label: string
  recipientName: string
  phone: string
  addressLine: string
  city: string
  state: string
  postalCode: string
  isDefault: boolean
}

export interface BuyerProfile {
  id: string
  name: string
  /** Public @handle. Older accounts may not have one yet (null). */
  username?: string | null
  /** Square, face-centred profile photo on Cloudinary, or null. */
  avatarUrl?: string | null
  email: string
  phone?: string | null
  emailVerifiedAt?: string | null
  addresses: BuyerAddress[]
  createdAt?: string
}

interface AuthState {
  token: string | null
  user: BuyerProfile | null
  sessionExpiresAt: number | null
  setSession: (token: string, user: BuyerProfile) => void
  setUser: (user: BuyerProfile) => void
  /**
   * Swap in a re-issued token (e.g. after an email change, since the JWT
   * carries the email) without extending or resetting the session window.
   */
  replaceToken: (token: string, user: BuyerProfile) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      sessionExpiresAt: null,
      setSession: (token, user) => set({ token, user, sessionExpiresAt: Date.now() + BUYER_SESSION_DURATION_MS }),
      setUser: (user) => set({ user }),
      replaceToken: (token, user) => set({ token, user }),
      signOut: () => set({ token: null, user: null, sessionExpiresAt: null }),
    }),
    {
      name: 'buyer-auth-storage',
      // Session storage is cleared when the browser tab is closed, unlike the
      // previous localStorage implementation which retained buyer data until
      // it was explicitly overwritten.
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.sessionExpiresAt && state.sessionExpiresAt <= Date.now()) state.signOut()
      },
    },
  ),
)
