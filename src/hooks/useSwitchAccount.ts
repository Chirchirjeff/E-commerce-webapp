'use client'

import { useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useCheckoutStore } from '@/stores/checkoutStore'

/**
 * Sign-out helpers for shared devices.
 *
 * Both clear everything tied to the current buyer on this browser: the
 * session, their saved checkout/delivery details and any cached order data.
 * The cart is left alone, since it belongs to the device rather than an account.
 *
 * - `switchAccount` sends the next person straight to the sign-in page and
 *   returns them to where they were afterwards.
 * - `signOut` just ends the session.
 */
export function useSwitchAccount() {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const clearBuyer = useCallback(() => {
    useAuthStore.getState().signOut()
    useCheckoutStore.getState().clearBuyerDetails()
    queryClient.clear()
  }, [queryClient])

  const switchAccount = useCallback((returnTo?: string) => {
    clearBuyer()
    // Mid-checkout pages depend on the previous buyer's details, so a new
    // buyer restarts checkout at the delivery step.
    const target = returnTo ?? (pathname.startsWith('/checkout') ? '/checkout/delivery' : pathname)
    router.push(`/checkout/account?next=${encodeURIComponent(target)}`)
  }, [clearBuyer, pathname, router])

  const signOut = useCallback((redirectTo = '/cart') => {
    clearBuyer()
    router.replace(redirectTo)
  }, [clearBuyer, router])

  return { switchAccount, signOut }
}
