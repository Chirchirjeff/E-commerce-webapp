export interface Shop {
  id: string
  name: string
  slug: string
  businessDescription?: string
  businessLogo?: string
  coverPhoto?: string
  ownerId: string
  verificationStatus: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  description?: string
  /** Rich description blocks: array of { type, content } objects authored in the seller dashboard */
  descriptionBlocks?: DescriptionBlock[]
  price: number
  /** When set, price is the crossed-out original; salePrice is the discounted price shown prominently */
  salePrice?: number
  stockQuantity: number
  thumbnailUrl?: string
  images?: string[]
  shopId: string
  marketplaceCategoryId: string
  categoryId?: string
  createdAt: string
  updatedAt: string
  /** Average rating out of 5 across all approved reviews (injected by backend) */
  averageRating?: number
  /** Total number of approved reviews (injected by backend) */
  reviewCount?: number
  /** Per-shop sales rank 1-5 (1 = best seller); null if outside top 5 */
  shopRank?: number | null
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
  user?: { id: string; name?: string }
}

/** One block in a product's rich description */
export interface DescriptionBlock {
  type: 'text' | 'table' | 'image'
  /** text: plain string | table: { headers: string[], rows: string[][] } | image: URL string */
  content: string | { headers: string[]; rows: string[][] }
  /** Optional caption shown below an image block */
  caption?: string
}

export interface ReviewSummary {
  reviews: Review[]
  averageRating: number
  reviewCount: number
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
  orderNumber: string
  trackingToken?: string
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
  shop?: { id: string; name: string }
  mpesaReceiptNumber?: string | null
  trackingNumber?: string | null
  shippingCarrier?: string | null
  estimatedDelivery?: string | null
  dispatchedAt?: string | null
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

// ── Seller Collections (public storefront) ────────────────────────────────────

/** A product as it appears inside a collection carousel card. */
export interface CollectionProduct {
  id: string
  name: string
  price: number
  salePrice?: number
  thumbnailUrl?: string
  images?: string[]
  stockQuantity: number
}

/**
 * A seller collection returned by GET /shops/:shopId/collections.
 * slug drives the visual theme of the carousel.
 */
export interface ShopCollection {
  id: string
  name: string
  slug: string
  description?: string
  sortOrder: number
  productCount: number
  products: CollectionProduct[]
}
