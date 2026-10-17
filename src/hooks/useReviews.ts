'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reviewsAPI } from '@/lib/api'
import { ReviewSummary } from '@/types'

/** Fetch all approved reviews + aggregate stats for a product */
export function useProductReviews(productId?: string) {
  return useQuery<ReviewSummary>({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const res = await reviewsAPI.getByProduct(productId!)
      return res.data
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 2,
  })
}

/** Check whether the current buyer can review a product */
export function useCanReview(productId?: string) {
  return useQuery<{ canReview: boolean; hasPurchased: boolean; hasReviewed: boolean }>({
    queryKey: ['can-review', productId],
    queryFn: async () => {
      const res = await reviewsAPI.canReview(productId!)
      return res.data
    },
    enabled: !!productId,
    staleTime: 1000 * 30,
  })
}

/** Submit a review */
export function useSubmitReview(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { rating: number; comment?: string }) =>
      reviewsAPI.create({ productId, ...data }),
    onSuccess: () => {
      // Refresh reviews and the can-review check
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] })
      queryClient.invalidateQueries({ queryKey: ['can-review', productId] })
    },
  })
}
