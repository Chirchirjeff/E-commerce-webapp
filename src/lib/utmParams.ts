/**
 * UTM parameter capture utility
 *
 * Flow:
 *  1. On any page load, call captureUtmParams(searchParams, shopId).
 *  2. If utm_source is present in the URL the params are written to
 *     sessionStorage under 'utm_params' and fired to the backend once.
 *  3. When the buyer reaches checkout, call getStoredUtmParams() to read
 *     back the params (ready to attach to the order payload if needed).
 *
 * Data is stored in sessionStorage — it lives only for the browser tab
 * lifetime and is never written to localStorage.
 */

export interface UtmParams {
  utm_source: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
}

const STORAGE_KEY = 'utm_params'

/** Read the five utm_* values from a URLSearchParams instance. */
export function extractUtmParams(searchParams: URLSearchParams): UtmParams | null {
  const source = searchParams.get('utm_source')
  if (!source) return null
  return {
    utm_source: source,
    utm_medium: searchParams.get('utm_medium') ?? undefined,
    utm_campaign: searchParams.get('utm_campaign') ?? undefined,
    utm_term: searchParams.get('utm_term') ?? undefined,
    utm_content: searchParams.get('utm_content') ?? undefined,
  }
}

/** Persist params to sessionStorage so they survive client-side navigation. */
function storeUtmParams(params: UtmParams) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params))
  } catch {
    // sessionStorage unavailable (e.g. private-mode restrictions) — no-op
  }
}

/** Return the most recently captured UTM params, or null if none recorded. */
export function getStoredUtmParams(): UtmParams | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UtmParams) : null
  } catch {
    return null
  }
}

/**
 * Main entry-point called from page components.
 *
 * - Extracts utm_* from the provided search-params string.
 * - Saves them to sessionStorage.
 * - Fires a fire-and-forget POST to the backend visit endpoint.
 *
 * Safe to call on every render; the POST is only sent when utm_source is
 * present AND the params differ from what is already stored (prevents
 * duplicate rows on React re-renders / Strict Mode double-invocations).
 */
export function captureUtmParams(
  searchParamsString: string,
  options?: { shopId?: string; referer?: string },
) {
  if (typeof window === 'undefined') return // SSR guard

  const params = extractUtmParams(new URLSearchParams(searchParamsString))
  if (!params) return

  // Avoid duplicate POSTs: skip if the same params are already stored
  const existing = getStoredUtmParams()
  if (
    existing &&
    existing.utm_source === params.utm_source &&
    existing.utm_medium === params.utm_medium &&
    existing.utm_campaign === params.utm_campaign
  ) {
    return
  }

  storeUtmParams(params)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  const body = {
    ...params,
    shopId: options?.shopId,
    referer: (options?.referer ?? document.referrer) || undefined,
    userAgent: navigator.userAgent,
  }

  // Fire-and-forget — we never block the page render on this call
  fetch(`${apiUrl}/analytics/utm/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    // keepalive lets the request complete even if the page navigates away
    keepalive: true,
  }).catch(() => {
    // Silently swallow network errors — UTM tracking must never break UX
  })
}
