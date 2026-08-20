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
   * Get categories that a shop has products in
   * Filters all marketplace categories to only include those with products from the shop
   */
  getShopCategories: async (shopId: string) => {
    try {
      // Fetch all categories
      const allCategoriesResponse = await categoriesAPI.getAll(false, false)
      const allCategories = allCategoriesResponse.data as any[]

      // Fetch shop products
      const shopProductsResponse = await productsAPI.getByShop(shopId)
      const shopProducts = shopProductsResponse.data as any[]

      // Get unique category IDs from shop products
      const shopCategoryIds = new Set(
        shopProducts.map((p) => p.marketplaceCategoryId)
      )

      // Filter categories to only those the shop has products in
      const shopCategories = allCategories.filter((cat) =>
        shopCategoryIds.has(cat.id)
      )

      return { data: shopCategories }
    } catch (error) {
      console.error('Error fetching shop categories:', error)
      throw error
    }
  },
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
