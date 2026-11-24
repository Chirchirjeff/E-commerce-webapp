import { Skeleton as S, SkeletonRegion } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

/**
 * Layout-shaped placeholders for each storefront page.
 *
 * Server-safe (no hooks) so they back both the route `loading.tsx` files and
 * the in-page React Query loading states. Each mirrors the final layout's
 * containers and spacing so content swaps in without the page jumping.
 */

interface PartProps {
  /** Wrap in its own role="status" region (false when nested in a larger skeleton). */
  standalone?: boolean
  label?: string
}

const card = 'rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900'

// ─── Storefront ───────────────────────────────────────────────────────────────

/** Hero-shaped placeholder: cover image + floating identity card. */
export function ShopHeaderSkeleton({ standalone = true, label = 'Loading shop…' }: PartProps) {
  return (
    <SkeletonRegion standalone={standalone} label={label} className="relative">
      <S className="h-56 w-full rounded-none sm:h-72 md:h-80 lg:h-[22rem]" />
      <div className="relative mx-auto -mt-20 max-w-7xl px-4 sm:-mt-24 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 rounded-3xl border border-gray-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:p-7">
          <S className="h-24 w-24 rounded-2xl sm:h-28 sm:w-28" />
          <div className="flex-1 space-y-3">
            <S className="h-7 w-1/3 rounded-lg" />
            <S className="h-4 w-2/3" />
            <div className="flex gap-2">
              <S className="h-6 w-24 rounded-full" />
              <S className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </SkeletonRegion>
  )
}

/** Row of category pills. */
export function CategoryBarSkeleton({ standalone = true, label = 'Loading categories…' }: PartProps) {
  return (
    <SkeletonRegion standalone={standalone} label={label} className="flex items-center gap-2 overflow-hidden py-1">
      {[...Array(6)].map((_, i) => (
        <S key={i} className={cn('h-9 flex-shrink-0 rounded-full', i === 0 ? 'w-20' : 'w-28')} />
      ))}
    </SkeletonRegion>
  )
}

export const PRODUCT_GRID_CLASSES =
  'grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'

/** Product cards: square image + name / price / rating lines. */
export function ProductGridSkeleton({
  count = 10,
  standalone = true,
  label = 'Loading products…',
}: PartProps & { count?: number }) {
  return (
    <SkeletonRegion standalone={standalone} label={label} className={PRODUCT_GRID_CLASSES}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900"
        >
          <S className="aspect-square rounded-none" />
          <div className="space-y-2 p-3 sm:p-4">
            <S className="h-4 w-4/5" />
            <S className="h-4 w-1/2" />
            <S className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </SkeletonRegion>
  )
}

function CarouselSkeleton() {
  return (
    <div className="space-y-4 py-6">
      <S className="h-14 w-72 rounded-xl" />
      <div className="flex gap-4 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-[200px] flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <S className="h-44 rounded-none" />
            <div className="space-y-2 p-3">
              <S className="h-3 w-4/5" />
              <S className="h-3 w-3/5" />
              <S className="mt-1 h-4 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Two collection carousels (title bar + horizontal row of cards). */
export function CollectionsSkeleton({ standalone = true, label = 'Loading collections…' }: PartProps) {
  return (
    <SkeletonRegion standalone={standalone} label={label} className="space-y-10">
      <CarouselSkeleton />
      <CarouselSkeleton />
    </SkeletonRegion>
  )
}

/** Whole storefront: hero, sticky toolbar, heading and product grid. */
export function StorefrontSkeleton({ label = 'Loading shop…' }: { label?: string }) {
  return (
    <SkeletonRegion
      label={label}
      className="min-h-screen bg-gradient-to-b from-primary-50/40 via-gray-50 to-gray-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950"
    >
      <ShopHeaderSkeleton standalone={false} />
      <div className="mt-6 border-y border-gray-200/70 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto max-w-7xl space-y-3 px-4 py-3 sm:px-6 lg:px-8">
          <S className="h-11 w-full rounded-full" />
          <CategoryBarSkeleton standalone={false} />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-2">
          <S className="h-7 w-48 rounded-lg" />
          <S className="h-4 w-20" />
        </div>
        <ProductGridSkeleton standalone={false} />
      </div>
    </SkeletonRegion>
  )
}

// ─── Product ──────────────────────────────────────────────────────────────────

/** Product detail page: gallery on the left, title / price / cards on the right. */
export function ProductDetailSkeleton({ label = 'Loading product…' }: { label?: string }) {
  return (
    <SkeletonRegion label={label} className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-2">
          <S className="h-4 w-10" />
          <S className="h-4 w-40" />
        </div>
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-4 dark:bg-slate-900 lg:p-6">
            <S className="aspect-square w-full rounded-lg" />
            <div className="mt-4 grid grid-cols-5 gap-2">
              {[...Array(5)].map((_, i) => (
                <S key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <S className="h-9 w-3/4" />
              <div className="flex items-center gap-4">
                <S className="h-10 w-40" />
                <S className="h-6 w-20 rounded-full" />
              </div>
              <S className="h-4 w-32" />
            </div>
            <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <S className="h-10 w-32" />
              <div className="flex gap-3">
                <S className="h-11 flex-1 rounded-lg" />
                <S className="h-11 flex-1 rounded-lg" />
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <S className="h-11 w-full rounded-lg" />
            </div>
            <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <S className="h-5 w-32" />
              <S className="h-4 w-full" />
              <S className="h-4 w-5/6" />
              <S className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </SkeletonRegion>
  )
}

/** Placeholder shown while the quick-view modal's code chunk loads. */
export function ProductModalSkeleton() {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
        <SkeletonRegion
          label="Loading product details…"
          className="my-8 w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-slate-700">
            <div className="flex-1 space-y-2">
              <S className="h-7 w-1/2" />
              <S className="h-4 w-32" />
            </div>
            <S className="h-10 w-10 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="space-y-4 border-r border-gray-200 p-6 dark:border-slate-700">
              <S className="aspect-square w-full rounded-lg" />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <S key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-4 p-6">
              <S className="h-9 w-40" />
              <div className="flex gap-2">
                <S className="h-9 w-24 rounded-lg" />
                <S className="h-9 w-24 rounded-lg" />
                <S className="h-9 w-24 rounded-lg" />
              </div>
              <S className="h-4 w-full" />
              <S className="h-4 w-5/6" />
              <S className="h-4 w-2/3" />
              <S className="mt-6 h-11 w-full rounded-lg" />
            </div>
          </div>
        </SkeletonRegion>
      </div>
    </>
  )
}

// ─── Orders ───────────────────────────────────────────────────────────────────

function ItemRowsSkeleton({ rows = 2, thumb = 'h-14 w-14' }: { rows?: number; thumb?: string }) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-slate-800">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
          <S className={cn('shrink-0 rounded-lg', thumb)} />
          <div className="min-w-0 flex-1 space-y-2">
            <S className="h-4 w-2/3" />
            <S className="h-3 w-1/3" />
          </div>
          <S className="h-4 w-20 shrink-0" />
        </div>
      ))}
    </div>
  )
}

/** /order/[orderId]: header, status timeline, items, customer card. */
export function OrderSkeleton({ label = 'Loading your order…' }: { label?: string }) {
  return (
    <SkeletonRegion label={label} className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <S className="h-4 w-48" />
          <S className="h-9 w-56" />
          <S className="h-6 w-24 rounded-full" />
        </div>
        <S className="h-12 w-full rounded-xl sm:w-72" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className={cn(card, 'space-y-5 p-6')}>
            <S className="h-4 w-28" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <S className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <S className="h-4 w-3/4" />
                  <S className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <div className={cn(card, 'p-6')}>
            <S className="mb-4 h-4 w-16" />
            <ItemRowsSkeleton rows={2} />
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-slate-800">
              <S className="h-4 w-20" />
              <S className="h-6 w-28" />
            </div>
          </div>
          <div className={cn(card, 'p-6')}>
            <S className="mb-4 h-4 w-24" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <S className="h-10" />
              <S className="h-10" />
              <S className="h-10 sm:col-span-2" />
            </div>
          </div>
        </div>
      </div>
    </SkeletonRegion>
  )
}

/** /track/[token]: centred header, stage list, items card. */
export function TrackOrderSkeleton({ label = 'Loading your order…' }: { label?: string }) {
  return (
    <SkeletonRegion label={label} className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-10 flex flex-col items-center gap-2">
        <S className="h-4 w-32" />
        <S className="h-9 w-64" />
        <S className="h-5 w-48" />
        <S className="h-4 w-36" />
      </div>
      <div className={cn(card, 'mb-6 rounded-lg p-6')}>
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <S className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <S className="h-4 w-40" />
                <S className="h-3 w-56 max-w-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-200 pt-5 dark:border-slate-800 sm:grid-cols-2">
          <S className="h-10" />
          <S className="h-10" />
        </div>
      </div>
      <div className={cn(card, 'mb-6 rounded-lg p-6')}>
        <S className="mb-4 h-5 w-16" />
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex justify-between gap-4">
              <div className="flex-1 space-y-2">
                <S className="h-4 w-1/2" />
                <S className="h-3 w-12" />
              </div>
              <S className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonRegion>
  )
}

/** /track: order-number lookup card. */
export function TrackLookupSkeleton({ label = 'Loading order tracking…' }: { label?: string }) {
  return (
    <SkeletonRegion label={label} className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className={cn(card, 'space-y-4 p-6 sm:p-8')}>
        <S className="h-9 w-64" />
        <S className="h-4 w-full" />
        <S className="h-4 w-2/3" />
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <S className="h-12 flex-1 rounded-lg" />
          <S className="h-12 w-full rounded-lg sm:w-36" />
        </div>
      </div>
    </SkeletonRegion>
  )
}

// ─── Account / cart ───────────────────────────────────────────────────────────

/** /account: signed-in card + address book. */
export function AccountSkeleton({ label = 'Loading your account…' }: { label?: string }) {
  return (
    <SkeletonRegion label={label} className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <S className="h-9 w-48" />
      <div className={cn(card, 'p-6')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <S className="h-12 w-12 shrink-0 rounded-full" />
            <div className="space-y-2">
              <S className="h-3 w-20" />
              <S className="h-4 w-40" />
              <S className="h-4 w-56" />
            </div>
          </div>
          <div className="flex gap-2">
            <S className="h-10 w-32 rounded-lg" />
            <S className="h-10 w-24 rounded-lg" />
          </div>
        </div>
        <S className="mt-4 h-3 w-full" />
      </div>
      <div className={cn(card, 'p-6')}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <S className="h-6 w-48" />
            <S className="h-4 w-3/4" />
          </div>
          <S className="h-9 w-28 rounded-lg" />
        </div>
        <div className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-slate-800">
          <S className="h-5 w-32" />
          <S className="h-4 w-48" />
          <S className="h-4 w-2/3" />
        </div>
      </div>
    </SkeletonRegion>
  )
}

function SummaryCardSkeleton() {
  return (
    <div className={cn(card, 'space-y-4 rounded-lg p-6')}>
      <S className="h-6 w-36" />
      <div className="space-y-3">
        <div className="flex justify-between"><S className="h-4 w-20" /><S className="h-4 w-16" /></div>
        <div className="flex justify-between"><S className="h-4 w-16" /><S className="h-4 w-12" /></div>
      </div>
      <div className="flex justify-between border-t border-gray-200 pt-4 dark:border-slate-800">
        <S className="h-5 w-16" />
        <S className="h-5 w-24" />
      </div>
      <S className="h-11 w-full rounded-lg" />
    </div>
  )
}

/** /cart: item rows + order summary. */
export function CartSkeleton({ label = 'Loading your cart…' }: { label?: string }) {
  return (
    <SkeletonRegion label={label} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <S className="mb-8 h-9 w-56" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className={cn(card, 'rounded-lg')}>
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-4 border-b border-gray-200 p-6 last:border-b-0 dark:border-slate-800">
                <S className="h-20 w-20 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <S className="h-5 w-1/2" />
                  <S className="h-4 w-24" />
                  <S className="mt-4 h-8 w-28" />
                </div>
                <S className="h-5 w-20" />
              </div>
            ))}
          </div>
        </div>
        <SummaryCardSkeleton />
      </div>
    </SkeletonRegion>
  )
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

/** Six-step progress bar (Cart → Confirmation). */
function CheckoutProgressSkeleton() {
  return (
    <div className="mb-8 flex items-center">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex flex-1 items-center last:flex-none">
          <S className="h-8 w-8 shrink-0 rounded-full" />
          {i < 5 && <S className="mx-2 h-0.5 flex-1" />}
        </div>
      ))}
    </div>
  )
}

/** Auth card (sign in / OTP). Used by /checkout/account and /reset-password. */
export function AuthCardSkeleton({
  label = 'Loading account…',
  showProgress = true,
}: {
  label?: string
  showProgress?: boolean
}) {
  return (
    <SkeletonRegion label={label} className="mx-auto max-w-md px-4 py-12">
      {showProgress && <CheckoutProgressSkeleton />}
      <div className={cn(card, 'space-y-4 p-6 shadow-sm')}>
        <S className="h-7 w-3/4" />
        <S className="h-4 w-2/3" />
        <S className="mt-2 h-12 w-full rounded-lg" />
        <S className="h-12 w-full rounded-lg" />
        <S className="h-11 w-full rounded-lg" />
        <S className="mx-auto h-4 w-1/2" />
      </div>
    </SkeletonRegion>
  )
}

/** /checkout/delivery: address form + order summary sidebar. */
export function CheckoutDeliverySkeleton({ label = 'Loading checkout…' }: { label?: string }) {
  return (
    <SkeletonRegion label={label} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CheckoutProgressSkeleton />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <S className="h-12 w-full rounded-lg" />
          <div className={cn(card, 'space-y-4 rounded-lg p-6')}>
            <div className="flex items-center justify-between">
              <S className="h-6 w-32" />
              <S className="h-4 w-28" />
            </div>
            <div className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-slate-800">
              <S className="h-5 w-32" />
              <S className="h-4 w-48" />
              <S className="h-4 w-2/3" />
            </div>
          </div>
          <S className="h-12 w-full rounded-lg" />
        </div>
        <SummaryCardSkeleton />
      </div>
    </SkeletonRegion>
  )
}

/** /checkout/review and /checkout/payment: items list + totals / form card. */
export function CheckoutReviewSkeleton({ label = 'Loading checkout…' }: { label?: string }) {
  return (
    <SkeletonRegion label={label} className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <CheckoutProgressSkeleton />
      <S className="mb-2 h-8 w-64" />
      <S className="mb-8 h-4 w-3/4" />
      <div className={cn(card, 'mb-6 rounded-lg p-6')}>
        <S className="mb-4 h-6 w-16" />
        <ItemRowsSkeleton rows={2} />
        <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-slate-800">
          <div className="flex justify-between"><S className="h-4 w-20" /><S className="h-4 w-16" /></div>
          <div className="flex justify-between"><S className="h-5 w-16" /><S className="h-5 w-24" /></div>
        </div>
      </div>
      <div className={cn(card, 'space-y-3 rounded-lg p-6')}>
        <S className="h-6 w-40" />
        <S className="h-4 w-1/2" />
        <S className="h-4 w-1/3" />
      </div>
    </SkeletonRegion>
  )
}

/** /checkout/processing: countdown ring + message. */
export function CheckoutProcessingSkeleton({ label = 'Loading payment status…' }: { label?: string }) {
  return (
    <SkeletonRegion label={label} className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <CheckoutProgressSkeleton />
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-12">
        <S className="mb-4 h-32 w-32 rounded-full" />
        <S className="h-8 w-56" />
        <S className="h-4 w-full" />
        <S className="h-4 w-3/4" />
      </div>
    </SkeletonRegion>
  )
}
