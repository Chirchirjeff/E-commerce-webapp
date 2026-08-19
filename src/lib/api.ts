import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

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

  getByShop: (shopId: string) =>
    apiClient.get(`/products?shopId=${shopId}`),

  search: (query: string, shopId?: string) => {
    const params = new URLSearchParams()
    params.append('search', query)
    if (shopId) params.append('shopId', shopId)
    return apiClient.get(`/products?${params.toString()}`)
  },
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
}

// ========================================
// ORDERS ENDPOINTS
// ========================================

export const ordersAPI = {
  create: (orderData: any) =>
    apiClient.post('/orders', orderData),

  getOne: (id: string) =>
    apiClient.get(`/orders/${id}`),
}
