import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem('buyer-auth-storage')
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
// ORDERS ENDPOINTS
// ========================================

export const ordersAPI = {
  create: (orderData: any) =>
    apiClient.post('/orders', orderData),

  getOne: (id: string) =>
    apiClient.get(`/orders/${id}`),

  track: (token: string) =>
    apiClient.get(`/orders/track/${token}`),

  trackByOrderNumber: (orderNumber: string) =>
    apiClient.get(`/orders/mine/number/${encodeURIComponent(orderNumber)}`),
}

export const authAPI = {
  registerBuyer: (data: { name: string; email: string; password: string; phone?: string }) =>
    apiClient.post('/auth/buyer/register', data),
  beginBuyerLogin: (data: { email: string; password: string }) =>
    apiClient.post('/auth/buyer/login', data),
  verifyBuyerCode: (data: { email: string; code: string; purpose: 'LOGIN' | 'VERIFY_EMAIL' }) =>
    apiClient.post<{ access_token: string }>('/auth/buyer/verify', data),
  requestBuyerPasswordReset: (email: string) =>
    apiClient.post<{ message: string }>('/auth/buyer/password-reset/request', { email }),
  confirmBuyerPasswordReset: (data: { token: string; password: string }) =>
    apiClient.post<{ message: string }>('/auth/buyer/password-reset/confirm', data),
  getMe: (token?: string) => apiClient.get('/auth/me', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),
  saveAddress: (data: any) => apiClient.post('/auth/me/addresses', data),
}

// ========================================
// MPESA ENDPOINTS
// ========================================

export interface StkPushPayload {
  phoneNumber: string
  amount: number
  orderPayload: {
    customerName: string
    customerEmail: string
    customerPhone: string
    deliveryAddress: string
    deliveryCity: string
    deliveryState: string
    deliveryZip: string
    shopId: string
    items: Array<{ productId: string; quantity: number; price: number }>
    total: number
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
