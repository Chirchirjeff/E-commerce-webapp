'use client'

import Image from 'next/image'
import { Shop } from '@/types'

interface ShopHeaderProps {
  shop: Shop
}

export function ShopHeader({ shop }: ShopHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      {/* Cover Image */}
      {shop.coverImageUrl && (
        <div className="relative w-full h-40 sm:h-56 md:h-64 bg-gray-100">
          <Image
            src={shop.coverImageUrl}
            alt={shop.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Shop Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 items-start">
          {/* Profile Image */}
          {shop.profileImageUrl && (
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={shop.profileImageUrl}
                alt={shop.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Shop Details */}
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {shop.name}
            </h1>
            {shop.description && (
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                {shop.description}
              </p>
            )}
            {shop.isVerified && (
              <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-sm text-green-700">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified Seller
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
