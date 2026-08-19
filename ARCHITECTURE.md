# E-commerce Buyer Webapp - Architecture

## User Flow

```
SOCIAL MEDIA
    ↓
    └─→ Seller's Link (e.g., myshop.com/john-store or with token)
            ↓
            └─→ SELLER STOREFRONT PAGE
                  ├── Shop Header (cover, profile, info, verified badge)
                  ├── Categories Sidebar (filter by category)
                  ├── Search Bar (search products)
                  └── Product Grid (browse all products)
                        ↓
                        └─→ Click Product
                              ↓
                              └─→ PRODUCT DETAILS PAGE
                                    ├── Image Gallery
                                    ├── Product Info (price, stock)
                                    ├── Specifications
                                    └── Add to Cart / Buy Now
                                          ↓
                                          └─→ SHOPPING CART PAGE
                                                ├── Review Cart Items
                                                ├── Adjust Quantities
                                                ├── Remove Items
                                                └── Proceed to Checkout
                                                      ↓
                                                      └─→ CHECKOUT PAGE
                                                            ├── Customer Info Form
                                                            │   ├── Name
                                                            │   ├── Email
                                                            │   └── Phone
                                                            ├── Delivery Address Form
                                                            │   ├── Street Address
                                                            │   ├── City
                                                            │   ├── State/Province
                                                            │   └── ZIP/Postal Code
                                                            └── Order Summary
                                                                  ↓
                                                                  └─→ Create Order (API)
                                                                        ↓
                                                                        └─→ ORDER CONFIRMATION PAGE
                                                                              ├── Success Message
                                                                              ├── Order Number & Date
                                                                              ├── Customer Info
                                                                              ├── Delivery Address
                                                                              ├── Order Items & Total
                                                                              └── Next Steps Info
```

## Component Architecture

### Page Components (Next.js Routes)

```
app/
├── [token]/page.tsx                    # Storefront homepage
│   └── products/
│       └── [productId]/page.tsx        # Product details
├── cart/page.tsx                       # Shopping cart
├── checkout/page.tsx                   # Checkout form
└── order/[orderId]/page.tsx           # Order confirmation
```

### Layout Components

```
components/layout/
├── Header.tsx                          # Navigation & cart badge
├── Footer.tsx                          # Footer links
└── ShopHeader.tsx                      # Shop info & banner
```

### Product Components

```
components/products/
├── ProductGrid.tsx                     # Product grid display
├── ProductSpecifications.tsx           # Product specs/attributes
├── AddToCartForm.tsx                   # Add to cart form
├── ImageGallery.tsx                    # Product image viewer
├── SearchBar.tsx                       # Search input
└── CategoryFilter.tsx                  # Category selector
```

### UI Components

```
components/ui/
├── Button.tsx                          # Reusable button (variants: primary, secondary, danger, ghost)
└── Badge.tsx                           # Status badges (variants: default, success, danger, warning)
```

## State Management

### Zustand Cart Store

```typescript
useCartStore {
  items[]              // Cart items with product data
  shopId               // Shop ID for order creation
  addItem()            // Add product to cart
  removeItem()         // Remove product from cart
  updateQuantity()     // Update item quantity
  clearCart()          // Clear entire cart
  getTotal()           // Get cart total
  getItemCount()       // Get item count
}
```

**Features**:
- Persists to localStorage
- Syncs across tabs
- Survives page reloads

### React Query Server Cache

```typescript
// Queries
useQuery('shop', token)           // Fetch shop details
useQuery('products', shopId)      // Fetch products
useQuery('categories')            // Fetch categories
useQuery('order', orderId)        // Fetch order details
```

**Configuration**:
- Stale time: 5 minutes
- Cache time: 10 minutes
- Auto refetch on focus

## Data Models

### Shop

```typescript
{
  id: string
  name: string
  slug: string
  description?: string
  coverImageUrl?: string
  profileImageUrl?: string
  isVerified: boolean
  verificationStatus: string
}
```

### Product

```typescript
{
  id: string
  name: string
  description?: string
  price: number
  stockQuantity: number
  thumbnailUrl?: string
  images?: string[]
  shopId: string
  marketplaceCategoryId: string
  attributeValues?: ProductAttributeValue[]
}
```

### CartItem

```typescript
{
  productId: string
  product?: Product
  quantity: number
  price: number
}
```

### Order

```typescript
{
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
}
```

## API Integration Layer

### API Client (`src/lib/api.ts`)

```typescript
// Shop APIs
shopAPI.resolveLinkByToken(token)
shopAPI.getShopByToken(token)
shopAPI.getShopDetails(shopId)

// Product APIs
productsAPI.getAll()
productsAPI.getOne(id)
productsAPI.getByShop(shopId)
productsAPI.search(query, shopId)

// Category APIs
categoriesAPI.getAll()
categoriesAPI.getBySlug(slug)
categoriesAPI.getOne(id)
categoriesAPI.getProducts(id)

// Order APIs
ordersAPI.create(orderData)
ordersAPI.getOne(id)
```

### Backend Endpoints Required

```
GET  /shop-links/resolve/:tokenOrSlug    # Resolve shop (public)
GET  /shop-links/:tokenOrSlug            # Get shop by token (public)
GET  /shops/:shopId                      # Get shop details (public)

GET  /products                           # List all products (public)
GET  /products/:id                       # Get product details (public)

GET  /marketplace-categories             # List categories (public)
GET  /marketplace-categories/:id         # Get category (public)
GET  /marketplace-categories/:id/products # Get category products (public)

POST /orders                             # Create order (public)
GET  /orders/:id                         # Get order details (public)
```

## Authentication & Security

**Current State**: No authentication required (public shop access)

**Future Enhancements**:
- Add user authentication (optional login)
- Add order history per user
- Secure payment processing
- Rate limiting on API calls

## Performance Optimizations

1. **Image Optimization**
   - Next.js Image component with optimization
   - Automatic srcset generation
   - WebP support with fallback

2. **Code Splitting**
   - Per-route code splitting
   - Lazy-loaded components
   - Dynamic imports where needed

3. **Data Caching**
   - React Query: Server state caching (5min stale, 10min cache)
   - Zustand: Client state in localStorage
   - HTTP headers: ETag support for backend

4. **Network Optimization**
   - Minimal API calls
   - Batch data fetching where possible
   - Compression enabled

## Styling System

### Tailwind CSS Configuration

```
Primary Colors: Sky blue variants
  50  - Lightest
  600 - Primary (buttons, links)
  700 - Hover state
  800 - Active state
  900 - Darkest

Secondary: Gray scale for text, backgrounds
Warning:   Yellow/Orange
Success:   Green
Danger:    Red
```

### Typography

```
Headings:   font-bold (h1: 3xl, h2: 2xl, h3: lg)
Body:       font-medium (default)
Secondary: text-gray-600
Accents:    text-primary-600
```

### Responsive Design

```
Mobile-first approach:
  sm: 640px   (tablets)
  md: 768px   (small desktops)
  lg: 1024px  (desktops)
  xl: 1280px  (large desktops)
```

## Error Handling

### Error Boundaries

```
app/error.tsx        # Global error boundary
app/not-found.tsx    # 404 page
```

### Form Validation

- Real-time field validation
- Error messages per field
- Form-level validation before submit
- Server-side validation on API

### Network Errors

- Graceful fallbacks for failed requests
- Error messages to users
- Retry logic for critical operations
- Loading states during operations

## Build & Deployment

### Build Output

```bash
npm run build
# Creates optimized bundle in .next/
# Outputs: standalone, static, server pages
```

### Environment Variables

```
NEXT_PUBLIC_API_URL    # Backend API base URL (client-side)
```

### Deployment Targets

- **Vercel**: Zero-config, automatic
- **Docker**: Containerized deployment
- **Traditional Server**: Node.js/pm2

## Development Workflow

### Local Development

```bash
npm run dev           # Start dev server on :3001
npm run build        # Production build
npm start            # Run production server
npm run lint         # Run ESLint
```

### Code Organization

```
Single Responsibility:
  - Components: UI logic only
  - Pages: Route logic + data fetching
  - Stores: State management only
  - Utils: Pure functions
  - Types: Type definitions

Naming Conventions:
  - Components: PascalCase (ProductGrid.tsx)
  - Utilities: camelCase (formatPrice.ts)
  - Types: PascalCase interfaces (Product, Order)
  - Files: kebab-case imports
```

## Security Considerations

1. **Input Validation**
   - Client-side form validation
   - Server-side validation required (backend)

2. **XSS Prevention**
   - React automatic escaping
   - No innerHTML usage
   - CSP headers (when deployed)

3. **CSRF Protection**
   - Rely on backend CSRF tokens
   - SameSite cookie policy

4. **Data Protection**
   - No sensitive data in localStorage
   - HTTPS required in production
   - Secure cookie flags

## Monitoring & Analytics (Future)

- Error tracking (Sentry, etc.)
- Analytics (Google Analytics, Mixpanel)
- Performance monitoring
- User behavior tracking

---

**Last Updated**: August 2024
**Version**: 1.0.0
