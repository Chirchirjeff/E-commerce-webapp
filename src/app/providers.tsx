'use client'

import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query'
import { ReactNode, useEffect } from 'react'
import { ThemeProvider } from '@/context/ThemeContext'
import { useAuthStore } from '@/stores/authStore'
import { useCheckoutStore } from '@/stores/checkoutStore'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error(
        `[QUERY ERROR] queryKey: ${JSON.stringify(query.queryKey)}`,
        '\nError:', error,
      )
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      console.error(
        `[MUTATION ERROR] mutationKey: ${JSON.stringify(mutation.options.mutationKey ?? 'unknown')}`,
        '\nError:', error,
      )
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
})

/** Catches unhandled JS errors and promise rejections that slip past React. */
function GlobalErrorListeners() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      console.error('[UNHANDLED ERROR]', event.message, '\nSource:', event.filename, `line ${event.lineno}`, '\nError:', event.error)
    }
    function onUnhandledRejection(event: PromiseRejectionEvent) {
      console.error('[UNHANDLED PROMISE REJECTION]', event.reason)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}

/** Clears browser-held buyer context as soon as its configured session ends. */
function BuyerSessionExpiry() {
  const expiresAt = useAuthStore((state) => state.sessionExpiresAt)
  const signOut = useAuthStore((state) => state.signOut)

  useEffect(() => {
    if (!expiresAt) return
    const expire = () => {
      signOut()
      useCheckoutStore.getState().clearBuyerDetails()
    }
    const delay = expiresAt - Date.now()
    if (delay <= 0) { expire(); return }
    const timeout = window.setTimeout(expire, delay)
    return () => window.clearTimeout(timeout)
  }, [expiresAt, signOut])

  useEffect(() => {
    // Remove the indefinitely-persisted authentication record left by older
    // releases. New sessions are stored only in sessionStorage.
    window.localStorage.removeItem('buyer-auth-storage')
  }, [])

  return null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <GlobalErrorListeners />
        <BuyerSessionExpiry />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
