export interface Shop {
  id: string
  name: string
  slug: string
  description?: string
  coverImageUrl?: string
  profileImageUrl?: string
  ownerId: string
  isVerified: boolean
  verificationStatus: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  stockQuantity: number
  thumbnailUrl?: string
  images?: string[]
  shopId: string
  marketplaceCategoryId: string
  categoryId?: string
  createdAt: string
  updatedAt: string
}

export interface ProductDetail extends Product {
  shop?: Shop
  category?: any
  marketplaceCategory?: MarketplaceCategory
  attributeValues?: ProductAttributeValue[]
  reviews?: Review[]
}

export interface MarketplaceCategory {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string
  level: number
  sortOrder: number
  isActive: boolean
  children?: MarketplaceCategory[]
  createdAt: string
  updatedAt: string
}

export interface ProductAttributeValue {
  id: string
  productId: string
  attributeId: string
  attribute?: Attribute
  value: string
}

export interface Attribute {
  id: string
  name: string
  slug: string
  type: string
  description?: string
}

export interface Review {
  id: string
  productId: string
  rating: number
  comment?: string
  createdAt: string
}

export interface CartItem {
  productId: string
  product?: Product
  quantity: number
  price: number
}

export interface Cart {
  items: CartItem[]
  total: number
  itemCount: number
}

export interface OrderItem {
  productId: string
  product?: Product
  quantity: number
  price: number
  subtotal: number
}

export interface Order {
  id: string
  shopId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryAddress: string
  deliveryCity: string
  deliveryState: string
  deliveryZip: string
  items: OrderItem[]
  total: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface ShopLink {
  id: string
  shopId: string
  token: string
  title?: string
  description?: string
  source?: string
  clickCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ShopLinkResolution {
  success: boolean
  data: {
    shop: Shop
    linkId: string
    resolvedVia: 'token' | 'slug'
  }
}
