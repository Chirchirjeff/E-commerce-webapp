'use client'

import Link from 'next/link'
import { useCartStore } from '@/stores/cartStore'
import { Shop } from '@/types'

interface HeaderProps {
  shop?: Shop
}

export function Header({ shop }: HeaderProps) {
  const itemCount = useCartStore((state) => state.getItemCount())

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Shop Name */}
          <Link href={`/`} className="flex items-center gap-2">
            <div className="text-2xl font-bold text-primary-600">
              {shop?.name || 'Shop'}
            </div>
          </Link>

          {/* Cart Link */}
          <Link
            href="/cart"
            className="relative inline-flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
            <span className="hidden sm:inline">Cart</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
