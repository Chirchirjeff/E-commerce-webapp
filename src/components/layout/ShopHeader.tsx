'use client'

import Image from 'next/image'
import { Shop } from '@/types'
import { useTheme } from '@/context/ThemeContext'
import { ThemedText, ThemedBadge } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ShopHeaderProps {
  shop: Shop
}

export function ShopHeader({ shop }: ShopHeaderProps) {
  const { theme } = useTheme()
  const isVerified = shop.verificationStatus === 'ACTIVE'

  const bgClass =
    theme === 'dark'
      ? 'bg-slate-900 border-b border-slate-700'
      : 'bg-white border-b border-gray-200'

  const descriptionClass =
    theme === 'dark'
      ? 'text-slate-300'
      : 'text-gray-600'

  return (
    <div className={cn('transition-colors duration-200', bgClass)}>
      {/* Cover Image */}
      {shop.coverPhoto ? (
        <div className={cn(
          'relative w-full h-40 sm:h-56 md:h-64 bg-gradient-to-br overflow-hidden',
          theme === 'dark'
            ? 'from-slate-800 to-slate-900'
            : 'from-warm-100 to-gold-100'
        )}>
          <Image
            src={shop.coverPhoto}
            alt={shop.name}
            fill
            className="object-cover"
            priority
          />
          {/* Overlay for dark theme */}
          {theme === 'dark' && (
            <div className="absolute inset-0 bg-black/20" />
          )}
        </div>
      ) : (
        <div className={cn(
          'relative w-full h-40 sm:h-56 md:h-64 bg-gradient-to-br',
          theme === 'dark'
            ? 'from-warm-900/20 to-gold-900/20 border-b border-slate-700'
            : 'from-warm-50 to-gold-100 border-b border-warm-200'
        )} />
      )}

      {/* Shop Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 items-start">
          {/* Logo / Profile Image */}
          <div className={cn(
            'relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0',
            'shadow-lg border-4 transition-all duration-200',
            theme === 'dark'
              ? 'border-slate-800 shadow-warm-600/20'
              : 'border-white shadow-warm-500/20'
          )}>
            {shop.businessLogo ? (
              <Image
                src={shop.businessLogo}
                alt={`${shop.name} logo`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className={cn(
                'w-full h-full flex items-center justify-center text-3xl sm:text-4xl font-bold',
                theme === 'dark'
                  ? 'bg-gradient-to-br from-warm-600 to-gold-600 text-white'
                  : 'bg-gradient-to-br from-warm-400 to-gold-500 text-white'
              )}>
                {shop.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Shop Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <ThemedText
                variant="h2"
                className="truncate"
              >
                {shop.name}
              </ThemedText>

              {/* Verified Badge */}
              {isVerified && (
                <ThemedBadge variant="success">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified Seller
                </ThemedBadge>
              )}
            </div>

            {/* Description */}
            {shop.businessDescription && (
              <p className={cn(
                'mt-2 text-sm sm:text-base line-clamp-2 transition-colors duration-200',
                descriptionClass
              )}>
                {shop.businessDescription}
              </p>
            )}

            {/* Join Date */}
            <div className="mt-4">
              <p className={cn(
                'text-xs font-semibold uppercase tracking-wide',
                theme === 'dark'
                  ? 'text-slate-400'
                  : 'text-gray-500'
              )}>
                Joined
              </p>
              <p className={cn(
                'text-sm',
                theme === 'dark'
                  ? 'text-slate-300'
                  : 'text-gray-700'
              )}>
                {new Date(shop.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
