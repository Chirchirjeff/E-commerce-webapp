/**
 * Image utilities for normalizing and validating product images
 */

/**
 * Normalize image data to a consistent string[] format
 * - Filters out empty, null, or invalid URLs
 * - Removes duplicates
 * - Includes thumbnail as first image if provided
 * - Returns empty array if no valid images
 */
export function normalizeProductImages(
  thumbnail?: string | null,
  images?: (string | { imageUrl?: string } | null)[]
): string[] {
  const normalizedImages: string[] = []

  // Add thumbnail first if valid
  if (thumbnail && typeof thumbnail === 'string' && thumbnail.trim()) {
    normalizedImages.push(thumbnail)
  }

  // Add images if provided
  if (Array.isArray(images)) {
    for (const img of images) {
      if (!img) continue

      let url: string | null = null

      // Handle string URLs
      if (typeof img === 'string') {
        url = img.trim()
      }
      // Handle objects with imageUrl property
      else if (typeof img === 'object' && img.imageUrl) {
        url = (img.imageUrl as string).trim()
      }

      // Only add valid, non-empty, non-duplicate URLs
      if (url && !normalizedImages.includes(url)) {
        normalizedImages.push(url)
      }
    }
  }

  return normalizedImages
}

/**
 * Check if a URL is a valid image URL
 * - Must be non-empty string
 * - Must start with http://, https://, or /
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed) return false
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  )
}

/**
 * Check if product images are available
 */
export function hasImages(
  thumbnail?: string | null,
  images?: (string | { imageUrl?: string } | null)[]
): boolean {
  if (isValidImageUrl(thumbnail)) return true
  if (Array.isArray(images)) {
    for (const img of images) {
      if (!img) continue
      if (typeof img === 'string' && isValidImageUrl(img)) return true
      if (typeof img === 'object' && isValidImageUrl(img.imageUrl)) return true
    }
  }
  return false
}

/**
 * Check if product has multiple distinct images
 */
export function hasMultipleImages(
  thumbnail?: string | null,
  images?: (string | { imageUrl?: string } | null)[]
): boolean {
  const normalized = normalizeProductImages(thumbnail, images)
  return normalized.length > 1
}
