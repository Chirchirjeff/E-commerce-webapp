'use client'

import Link from 'next/link'
import { useCartStore } from '@/stores/cartStore'

export function Header() {
  const itemCount = useCartStore((state) => state.getItemCount())
  const shopToken = useCartStore((state) => state.shopToken)

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
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
    </header>
  )
}
