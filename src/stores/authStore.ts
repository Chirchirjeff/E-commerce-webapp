import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  email: string
  phone?: string | null
  emailVerifiedAt?: string | null
  addresses: BuyerAddress[]
}

interface AuthState {
  token: string | null
  user: BuyerProfile | null
  setSession: (token: string, user: BuyerProfile) => void
  setUser: (user: BuyerProfile) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      signOut: () => set({ token: null, user: null }),
    }),
    { name: 'buyer-auth-storage' },
  ),
)
