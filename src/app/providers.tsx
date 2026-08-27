'use client'

import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query'
import { ReactNode, useEffect } from 'react'
import { ThemeProvider } from '@/context/ThemeContext'

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

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <GlobalErrorListeners />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
