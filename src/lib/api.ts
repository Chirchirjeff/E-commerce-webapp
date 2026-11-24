import axios from 'axios'
import type { BuyerAddress, BuyerProfile } from '@/stores/authStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const saved = window.sessionStorage.getItem('buyer-auth-storage')
    const token = saved ? JSON.parse(saved)?.state?.token : null
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Global API error logger ───────────────────────────────────────────────────
// Logs every failed request to the terminal so errors are easy to spot and
// share. Successful responses pass through untouched.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The server replied with a non-2xx status
      console.error(
        `[API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        `→ ${error.response.status} ${error.response.statusText}`,
        '\nResponse:', error.response.data,
      )
    } else if (error.request) {
      // Request was made but no response received (network down, CORS, timeout)
      console.error(
        `[API NO RESPONSE] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        '\nRequest was sent but no response received. Check that the backend is running at:',
        API_URL,
      )
    } else {
      // Something went wrong setting up the request
      console.error('[API REQUEST SETUP ERROR]', error.message)
    }
    return Promise.reject(error)
  }
)

// ========================================
// SHOP ENDPOINTS
// ========================================

export const shopAPI = {
  resolveLinkByToken: (tokenOrSlug: string) =>
    apiClient.get(`/shop-links/resolve/${tokenOrSlug}`),

  getShopByToken: (tokenOrSlug: string) =>
    apiClient.get(`/shop-links/${tokenOrSlug}`),

  getShopDetails: (shopId: string) =>
    apiClient.get(`/shops/${shopId}`),

  getShopStats: (shopId: string) =>
    apiClient.get(`/shops/${shopId}/stats`),
}

// ========================================
// PRODUCTS ENDPOINTS
// ========================================

export const productsAPI = {
  getAll: () =>
    apiClient.get('/products'),

  getOne: (id: string) =>
    apiClient.get(`/products/${id}`),

  getByShop: (shopId: string, categoryId?: string) => {
    const params = new URLSearchParams({ shopId })
    if (categoryId) params.append('categoryId', categoryId)
    return apiClient.get(`/products?${params.toString()}`)
  },

  search: (query: string, shopId?: string) => {
    const params = new URLSearchParams()
    params.append('search', query)
    if (shopId) params.append('shopId', shopId)
    return apiClient.get(`/products?${params.toString()}`)
  },
}

// ========================================
// PRODUCT LINKS ENDPOINTS
// ========================================

export const productLinksAPI = {
  /**
   * Create a new product link (requires authentication)
   */
  create: (productId: string, data: any) =>
    apiClient.post(`/product-links/${productId}`, data),

  /**
   * Get all links for a product (requires authentication)
   */
  getByProduct: (productId: string) =>
    apiClient.get(`/product-links/product/${productId}`),

  /**
   * Get a specific link (requires authentication)
   */
  getOne: (linkId: string) =>
    apiClient.get(`/product-links/link/${linkId}`),

  /**
   * Update a product link (requires authentication)
   */
  update: (linkId: string, data: any) =>
    apiClient.patch(`/product-links/link/${linkId}`, data),

  /**
   * Toggle link active status (requires authentication)
   */
  toggle: (linkId: string) =>
    apiClient.patch(`/product-links/link/${linkId}/toggle`),

  /**
   * Delete a product link (requires authentication)
   */
  delete: (linkId: string) =>
    apiClient.delete(`/product-links/link/${linkId}`),

  /**
   * Get analytics for a specific link (requires authentication)
   */
  getAnalytics: (linkId: string) =>
    apiClient.get(`/product-links/link/${linkId}/analytics`),

  /**
   * Get all analytics for a product (requires authentication)
   */
  getProductAnalytics: (productId: string) =>
    apiClient.get(`/product-links/product/${productId}/analytics`),

  /**
   * Resolve a product link by token (public endpoint)
   * Records a visit and returns product data
   */
  resolve: (token: string) =>
    apiClient.get(`/product-links/resolve/${token}`),
}

// ========================================
// CATEGORIES ENDPOINTS
// ========================================

export const categoriesAPI = {
  getAll: (includeInactive = false, tree = false) =>
    apiClient.get(
      `/marketplace-categories?includeInactive=${includeInactive}&tree=${tree}`
    ),

  getBySlug: (slug: string) =>
    apiClient.get(`/marketplace-categories/slug/${slug}`),

  getOne: (id: string) =>
    apiClient.get(`/marketplace-categories/${id}`),

  getProducts: (id: string, includeChildren = true) =>
    apiClient.get(
      `/marketplace-categories/${id}/products?includeChildren=${includeChildren}`
    ),

  /**
   * Get categories that a shop has products in.
   * Hits the dedicated backend endpoint — single DB query, no client-side joining.
   */
  getShopCategories: (shopId: string) =>
    apiClient.get(`/shops/${shopId}/categories`),
}

// ========================================
// COLLECTIONS ENDPOINTS
// ========================================

export const collectionsAPI = {
  /**
   * Public — fetch active collections for a shop, each with up to 20 products.
   * No auth required. Used by the storefront to render collection carousels.
   */
  getByShop: (shopId: string) =>
    apiClient.get(`/shops/${shopId}/collections`),
}

// ========================================
// ORDERS ENDPOINTS
// ========================================

export const ordersAPI = {
  create: (orderData: any) =>
    apiClient.post('/orders', orderData),

  /**
   * Get an order by ID.
   * - Authenticated buyers: JWT is sent automatically; no extra params needed.
   * - Guest buyers: pass the trackingToken received at payment time so the
   *   backend can verify ownership without a buyer account.
   */
  getOne: (id: string, guestTrackingToken?: string) => {
    const params = guestTrackingToken ? `?trackingToken=${encodeURIComponent(guestTrackingToken)}` : ''
    return apiClient.get(`/orders/${id}${params}`)
  },

  /**
   * Get an order by its unguessable trackingToken — public, no auth required.
   * Used for guest order confirmation immediately after payment.
   */
  getByTrackingToken: (trackingToken: string) =>
    apiClient.get(`/orders/public/token/${encodeURIComponent(trackingToken)}`),

  track: (token: string) =>
    apiClient.get(`/orders/track/${token}`),

  trackByOrderNumber: (orderNumber: string) =>
    apiClient.get(`/orders/mine/number/${encodeURIComponent(orderNumber)}`),

  /**
   * Update delivery address on a paid order.
   * - Authenticated buyers: JWT is sent automatically.
   * - Guest buyers: include `trackingToken` in the data payload so the backend
   *   can verify ownership without a buyer account.
   */
  updateDelivery: (
    orderId: string,
    data: {
      deliveryAddress?: string
      deliveryCity?: string
      deliveryState?: string
      deliveryZip?: string
      deliveryName?: string
      deliveryPhone?: string
      deliveryEmail?: string
      /** Guest proof-of-purchase token — required when not authenticated. */
      trackingToken?: string
    },
  ) => apiClient.patch(`/orders/${orderId}/delivery`, data),
}

/**
 * Turns an API error into a message that can be shown to the buyer. Nest
 * validation errors can arrive as an array of messages; the first is used.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const raw = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  const message = Array.isArray(raw) ? raw[0] : raw
  return typeof message === 'string' && message.trim() ? message : fallback
}

export interface UsernameCheck {
  username: string
  available: boolean
  /** Why the username can't be used, or null when it is available. */
  reason: string | null
  /** Alternatives, only returned when the username is already taken. */
  suggestions: string[]
}

export interface PasswordResetRequest {
  message: string
  expiresInSeconds: number
}

export interface EmailChangeRequest {
  email: string
  expiresInSeconds: number
}

export const authAPI = {
  registerBuyer: (data: { name: string; email: string; password: string; phone?: string }) =>
    apiClient.post('/auth/buyer/register', data),
  beginBuyerLogin: (data: { email: string; password: string }) =>
    apiClient.post('/auth/buyer/login', data),
  verifyBuyerCode: (data: { email: string; code: string; purpose: 'LOGIN' | 'VERIFY_EMAIL' }) =>
    apiClient.post<{ access_token: string }>('/auth/buyer/verify', data),
  /**
   * Forgot password, step 1: emails a 6-digit reset code. The response is the
   * same whether or not the email has an account, and the server silently
   * ignores re-sends within 60 seconds.
   */
  requestPasswordReset: (email: string) =>
    apiClient.post<PasswordResetRequest>('/auth/password-reset/request', { email }),
  /**
   * Step 2: checks the code without using it up. Rejects with 400 when it is
   * wrong or expired; wrong attempts here count towards the 5-attempt limit.
   */
  verifyPasswordResetCode: (data: { email: string; code: string }) =>
    apiClient.post<{ valid: true }>('/auth/password-reset/verify', data),
  /**
   * Step 3: sets the new password and returns a normal buyer token. Accepts
   * either { email, code, password } or a legacy emailed link's { token, password }.
   */
  confirmPasswordReset: (data: { email: string; code: string; password: string } | { token: string; password: string }) =>
    apiClient.post<{ message: string; access_token: string }>('/auth/password-reset/confirm', data),
  getMe: (token?: string) => apiClient.get<{ user: BuyerProfile }>('/auth/me', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),

  /** PATCH /auth/me — only the fields that are sent are changed. */
  updateProfile: (data: { name?: string; phone?: string | null; username?: string }) =>
    apiClient.patch<{ user: BuyerProfile }>('/auth/me', data),

  /** Live username availability, with suggestions when it's taken. */
  checkUsername: (username: string, signal?: AbortSignal) =>
    apiClient.get<UsernameCheck>('/auth/me/username-check', { params: { username }, signal }),

  /**
   * Upload a new profile photo (field "file"). The multipart Content-Type
   * overrides the client's JSON default so axios sends the FormData as-is and
   * the browser fills in the boundary.
   */
  uploadAvatar: (file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<{ user: BuyerProfile }>('/auth/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (event) => { if (event.total) onProgress(Math.round((event.loaded / event.total) * 100)) }
        : undefined,
    })
  },
  removeAvatar: () =>
    apiClient.delete<{ user: BuyerProfile }>('/auth/me/avatar'),

  /** Step 1 of an email change: a 6-digit code is emailed to the new address. */
  requestEmailChange: (data: { newEmail: string; currentPassword: string }) =>
    apiClient.post<EmailChangeRequest>('/auth/me/email/request', data),
  /** Step 2: returns a new token (the JWT carries the email) and the updated account. */
  confirmEmailChange: (code: string) =>
    apiClient.post<{ access_token: string; user: BuyerProfile }>('/auth/me/email/confirm', { code }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post<{ message: string }>('/auth/me/password', data),

  saveAddress: (data: Partial<BuyerAddress> & { syncProfile?: boolean }) =>
    apiClient.post<{ address: BuyerAddress }>('/auth/me/addresses', data),
  setDefaultAddress: (id: string) =>
    apiClient.patch<{ addresses: BuyerAddress[] }>(`/auth/me/addresses/${id}/default`),
  deleteAddress: (id: string) =>
    apiClient.delete<{ addresses: BuyerAddress[] }>(`/auth/me/addresses/${id}`),
}

// ========================================
// MPESA ENDPOINTS
// ========================================

export interface StkPushPayload {
  phoneNumber: string
  amount: number
  orderPayload: {
    customerName: string
    customerEmail: string | null
    customerPhone: string
    deliveryAddress: string
    deliveryCity: string
    deliveryState: string
    deliveryZip: string
    shopId: string
    items: Array<{ productId: string; quantity: number; price: number }>
    total: number
    /** Optional: authenticated buyer's userId — links the order to their account. */
    buyerId?: string | null
  }
}

export interface StkPushResponse {
  checkoutRequestId: string
  merchantRequestId: string
  responseDescription: string
  orderNumber: string
}

export interface MpesaStatusResponse {
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'TIMEOUT'
  orderId: string | null
  orderNumber: string | null
  resultDescription: string | null
  mpesaReceiptNumber: string | null
  trackingToken: string | null
}

export const mpesaAPI = {
  /**
   * Initiate an STK push — buyer gets a prompt on their phone.
   * Requires a valid JWT in the Authorization header.
   */
  initiateStkPush: (payload: StkPushPayload) =>
    apiClient.post<StkPushResponse>('/mpesa/stk-push', payload),

  /**
   * Poll the status of an in-flight STK push by its CheckoutRequestID.
   */
  getStatus: (checkoutRequestId: string) =>
    apiClient.get<MpesaStatusResponse>(`/mpesa/status/${checkoutRequestId}`),
}

// ========================================
// REVIEWS ENDPOINTS
// ========================================

export const reviewsAPI = {
  /** GET /reviews/product/:productId — public, no auth */
  getByProduct: (productId: string) =>
    apiClient.get(`/reviews/product/${productId}`),

  /** POST /reviews — requires buyer JWT + successful payment */
  create: (data: { productId: string; rating: number; comment?: string }) =>
    apiClient.post('/reviews', data),

  /** GET /reviews/can-review/:productId — requires buyer JWT */
  canReview: (productId: string) =>
    apiClient.get(`/reviews/can-review/${productId}`),
}
