'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

export type CheckoutStep = 'cart' | 'account' | 'delivery' | 'review' | 'payment' | 'confirmation'

const STEPS: { key: CheckoutStep; label: string; href: string }[] = [
  { key: 'cart',         label: 'Cart',         href: '/cart' },
  { key: 'account',      label: 'Account',      href: '/checkout/account' },
  { key: 'delivery',     label: 'Delivery',     href: '/checkout/delivery' },
  { key: 'review',       label: 'Review',       href: '/checkout/review' },
  { key: 'payment',      label: 'Payment',      href: '/checkout/payment' },
  { key: 'confirmation', label: 'Confirmation', href: '#' },
]

interface CheckoutProgressProps {
  current: CheckoutStep
}

export function CheckoutProgress({ current }: CheckoutProgressProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === current)

  return (
    <nav aria-label="Checkout progress" className="mb-8">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const isDone    = idx < currentIndex
          const isActive  = idx === currentIndex
          const isLast    = idx === STEPS.length - 1

          return (
            <li key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Step bubble + label */}
              <div className="flex flex-col items-center gap-1 min-w-0">
                {isDone ? (
                  <Link
                    href={step.href}
                    className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center shrink-0 hover:bg-primary-700 transition-colors"
                    aria-label={`Go back to ${step.label}`}
                  >
                    {/* Checkmark */}
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </Link>
                ) : (
                  <span
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold',
                      isActive
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                        : 'bg-gray-100 text-gray-400'
                    )}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    {idx + 1}
                  </span>
                )}
                <span
                  className={cn(
                    'text-xs font-medium hidden sm:block',
                    isActive  ? 'text-primary-600' :
                    isDone    ? 'text-primary-500' :
                                'text-gray-400'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (not after last step) */}
              {!isLast && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 rounded-full',
                    idx < currentIndex ? 'bg-primary-600' : 'bg-gray-200'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
