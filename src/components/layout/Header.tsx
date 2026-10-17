'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { useTheme } from '@/context/ThemeContext'

export function Header() {
  const router = useRouter()
  const buyer = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const itemCount = useCartStore((state) => state.getItemCount())
  const shopToken = useCartStore((state) => state.shopToken)
  const { theme, toggleTheme } = useTheme()

  const switchAccount = () => {
    signOut()
    useCheckoutStore.getState().clearBuyerDetails()
    router.push('/checkout/account')
  }

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Left: Logo / Brand */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="text-2xl font-bold text-primary-600">Shop</div>
          </Link>

          {/* Center: Back to Shop */}
          {shopToken && (
            <Link
              href={`/${shopToken}`}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Back to Shop</span>
            </Link>
          )}

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors duration-200"
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.828-2.828a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM13 11a1 1 0 110 2h-1a1 1 0 110-2h1zm4-4a1 1 0 01-2 0v-1a1 1 0 012 0v1zM9 20a1 1 0 011-1v-1a1 1 0 11-2 0v1a1 1 0 011 1zm-4-4a1 1 0 110 2H4a1 1 0 110-2h1zm-2-8a1 1 0 00-2 0v1a1 1 0 002 0V4zm0 12a1 1 0 110-2h-1a1 1 0 110 2h1z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {buyer ? (
              <button onClick={switchAccount} className="px-2 py-2 text-sm text-gray-600 hover:text-primary-600" title="Sign out and use a different buyer account">
                Switch account
              </button>
            ) : (
              <Link href="/checkout/account" className="px-2 py-2 text-sm text-gray-600 hover:text-primary-600">Sign in</Link>
            )}
          {/* Right: Cart */}
          <Link
            href="/cart"
            className="relative inline-flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
            <span className="hidden sm:inline">Cart</span>
          </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
