/**
 * Cloudinary URL helpers.
 *
 * Cloudinary delivery URLs look like
 *   https://res.cloudinary.com/<cloud>/image/upload/[<transformations>/…][v123/]<public-id>.<ext>
 * and a transformation segment (e.g. `w_1600,c_limit,q_auto,f_auto`) can be
 * inserted after `/upload/` to get a resized / re-encoded variant.
 */

const CLOUDINARY_HOST = 'res.cloudinary.com'
const UPLOAD_MARKER = '/upload/'
/** A path segment made of Cloudinary transformation parameters, e.g. `c_fill,w_300` or `e_blur:200`. */
const TRANSFORMATION_SEGMENT = /^[a-z]{1,3}_[^/]*$/
const VERSION_SEGMENT = /^v\d+$/

export function isCloudinaryUrl(url: string | null | undefined): url is string {
  if (!url) return false
  try {
    const { hostname } = new URL(url)
    return hostname === CLOUDINARY_HOST || hostname.endsWith(`.${CLOUDINARY_HOST}`)
  } catch {
    return false
  }
}

/**
 * Returns `url` with `transformation` applied, for res.cloudinary.com upload
 * URLs. Any other URL (or a Cloudinary URL without `/upload/`) is returned
 * unchanged. If the URL already carries transformations, the new one is
 * chained after them so it applies last (e.g. a seller's crop, then our resize).
 *
 * @example cloudinaryUrl(cover, 'w_1600,c_limit,q_auto,f_auto')
 */
export function cloudinaryUrl(url: string, transformation: string): string
export function cloudinaryUrl(url: string | null | undefined, transformation: string): string | undefined
export function cloudinaryUrl(url: string | null | undefined, transformation: string): string | undefined {
  if (!url) return url ?? undefined
  if (!isCloudinaryUrl(url) || !transformation) return url

  const markerIndex = url.indexOf(UPLOAD_MARKER)
  if (markerIndex === -1) return url

  const prefix = url.slice(0, markerIndex + UPLOAD_MARKER.length)
  const segments = url.slice(prefix.length).split('/')

  // If the URL already has transformations, they sit between `/upload/` and the
  // version segment (v123…). Chain ours after them. Without a version segment we
  // can't tell a transformation from a folder name, so ours goes first.
  const versionIndex = segments.findIndex((segment) => VERSION_SEGMENT.test(segment))
  const insertAt = versionIndex > 0 && segments.slice(0, versionIndex).every((segment) => TRANSFORMATION_SEGMENT.test(segment))
    ? versionIndex
    : 0
  if (segments.slice(0, insertAt).includes(transformation)) return url

  segments.splice(insertAt, 0, transformation)
  return prefix + segments.join('/')
}
