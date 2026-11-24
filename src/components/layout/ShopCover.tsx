import Image from 'next/image'
import { cloudinaryUrl, isCloudinaryUrl } from '@/lib/cloudinary'
import { cn } from '@/lib/utils'

/** Sharp, size-capped variant for the foreground (Cloudinary only). */
const FOREGROUND_TRANSFORMATION = 'w_1600,c_limit,q_auto,f_auto'
/** Tiny variant for the blurred backdrop — it's blurred anyway (Cloudinary only). */
const BACKDROP_TRANSFORMATION = 'w_64,q_auto,f_auto'

interface ShopCoverProps {
  src: string
  alt: string
  /** Load eagerly (above-the-fold banners). */
  priority?: boolean
  /** `sizes` for the foreground image. */
  sizes?: string
  /**
   * Where the sharp image sits inside the banner. Defaults to the whole
   * banner; pass a smaller inset (e.g. `inset-x-0 top-0 bottom-20`) to keep
   * the full cover clear of something that overlaps the banner's bottom.
   */
  foregroundClassName?: string
}

/**
 * Shop cover photo for a banner of any shape, like Spotify / YouTube banners.
 *
 * Sellers upload covers in arbitrary aspect ratios (often square), so a plain
 * object-cover crop cuts off heads and products. Instead this renders two
 * layers: a blurred, slightly scaled object-cover copy of the image as a
 * backdrop, and the image itself with object-contain so the whole cover is
 * always visible. Must be placed inside a `relative overflow-hidden` box that
 * has a height.
 */
export function ShopCover({ src, alt, priority = false, sizes = '100vw', foregroundClassName = 'inset-0' }: ShopCoverProps) {
  const cloudinary = isCloudinaryUrl(src)
  const foregroundSrc = cloudinaryUrl(src, FOREGROUND_TRANSFORMATION)
  const backdropSrc = cloudinaryUrl(src, BACKDROP_TRANSFORMATION)

  return (
    <>
      {/* Backdrop: fills the banner, blurred so its crop doesn't matter. */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src={backdropSrc}
          alt=""
          fill
          // Cloudinary already serves a 64px variant; elsewhere ask Next for its smallest size.
          sizes="64px"
          unoptimized={cloudinary}
          priority={priority}
          className="scale-110 object-cover object-center blur-2xl"
        />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      {/* Foreground: the whole cover, never cropped. */}
      <div className={cn('absolute', foregroundClassName)}>
        <Image
          src={foregroundSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain object-center"
        />
      </div>
    </>
  )
}
