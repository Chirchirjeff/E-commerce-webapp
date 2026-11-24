'use client'

import Image from 'next/image'
import { BadgeCheck, CalendarDays, Layers, Package } from 'lucide-react'
import { Shop } from '@/types'
import { ShopCover } from './ShopCover'

interface ShopHeaderProps {
  shop: Shop
  productCount?: number
  categoryCount?: number
}

function StatChip({ icon: Icon, label }: { icon: typeof Package; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100/80 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-700">
      <Icon className="h-3.5 w-3.5 text-primary-500 dark:text-primary-400" aria-hidden="true" />
      {label}
    </span>
  )
}

export function ShopHeader({ shop, productCount = 0, categoryCount = 0 }: ShopHeaderProps) {
  const isVerified = shop.verificationStatus === 'ACTIVE'
  const joined = new Date(shop.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  })

  return (
    <section className="relative">
      {/* ── Cover ─────────────────────────────────────────────────────────── */}
      <div className="relative h-56 w-full overflow-hidden sm:h-72 md:h-80 lg:h-[22rem]">
        {shop.coverPhoto ? (
          <ShopCover
            src={shop.coverPhoto}
            alt={`${shop.name} cover photo`}
            priority
            // Keep the whole cover above the identity card that overlaps the banner's bottom.
            foregroundClassName="inset-x-0 top-0 bottom-20 sm:bottom-24"
          />
        ) : (
          // Decorative brand backdrop when the seller hasn't uploaded a cover
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 dark:from-primary-800 dark:via-primary-900 dark:to-accent-900">
            <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-accent-300/40 blur-3xl dark:bg-accent-600/20" />
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '22px 22px',
              }}
            />
          </div>
        )}
        {/* Scrim so the overlapping card always reads cleanly */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      </div>

      {/* ── Floating identity card ────────────────────────────────────────── */}
      <div className="relative mx-auto -mt-20 max-w-7xl px-4 sm:-mt-24 sm:px-6 lg:px-8">
        <div className="animate-slide-up rounded-3xl border border-white/60 bg-white/85 p-5 shadow-xl shadow-gray-900/5 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/85 dark:shadow-black/30 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
            {/* Logo */}
            <div className="relative -mt-14 h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white shadow-lg ring-4 ring-white dark:bg-slate-800 dark:ring-slate-900 sm:mt-0 sm:h-28 sm:w-28">
              {shop.businessLogo ? (
                <Image
                  src={shop.businessLogo}
                  alt={`${shop.name} logo`}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-accent-500 text-4xl font-extrabold text-white">
                  {shop.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                  {shop.name}
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
                    <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                    Verified Seller
                  </span>
                )}
              </div>

              {shop.businessDescription && (
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600 line-clamp-3 dark:text-slate-300 sm:text-base">
                  {shop.businessDescription}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {productCount > 0 && (
                  <StatChip
                    icon={Package}
                    label={`${productCount} Product${productCount !== 1 ? 's' : ''}`}
                  />
                )}
                {categoryCount > 0 && (
                  <StatChip
                    icon={Layers}
                    label={`${categoryCount} Categor${categoryCount !== 1 ? 'ies' : 'y'}`}
                  />
                )}
                <StatChip icon={CalendarDays} label={`Joined ${joined}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Hero-shaped placeholder shown while the shop resolves. */
export { ShopHeaderSkeleton } from '@/components/skeletons/PageSkeletons'
