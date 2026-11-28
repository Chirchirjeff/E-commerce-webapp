'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Store } from 'lucide-react'
import { useShopHref } from '@/hooks/useShopHref'
import { StorefrontSkeleton } from '@/components/skeletons/PageSkeletons'

/**
 * There is no marketplace homepage — buyers arrive through a shop's link.
 * Send them back to the shop they were last in; if there isn't one on this
 * device, explain how to get to a shop instead of showing a 404.
 */
export default function HomePage() {
  const router = useRouter()
  const shopHref = useShopHref()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => setHydrated(true), [])
  useEffect(() => {
    if (hydrated && shopHref !== '/') router.replace(shopHref)
  }, [hydrated, shopHref, router])

  if (!hydrated || shopHref !== '/') {
    return <StorefrontSkeleton label="Taking you back to the shop…" />
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
        <Store className="h-8 w-8 text-primary-600" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Open a shop to start shopping</h1>
      <p className="mt-2 text-gray-600">
        Shops on Quzaurban are reached through the link the seller shares with you. Open that link again to continue shopping.
      </p>
    </div>
  )
}
