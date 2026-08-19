# Complete User Flow Diagram

## 🔄 Happy Path - Complete Shopping Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BUYER'S COMPLETE JOURNEY                             │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: Access Shop
═══════════════════════════════════════════════════════════════════════════════

Social Media / Email / Advertisement
            │
            ▼
    Seller's Shareable Link
    ├─ Token: /abc123token456
    └─ Slug:  /seller-shop-name
            │
            ▼
   [/[token]/page.tsx]
   └─ API Call: GET /shop-links/resolve/:tokenOrSlug
            │
            ▼
    ✅ SELLER STOREFRONT PAGE LOADS
    ├─ Shop Cover Image
    ├─ Shop Profile Picture
    ├─ Shop Name & Description
    ├─ Verified Badge (if applicable)
    ├─ Categories Sidebar (left)
    ├─ Search Bar (top)
    └─ Product Grid (main area)


STEP 2: Browse Products
═══════════════════════════════════════════════════════════════════════════════

Options:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  📌 Option A: Browse All Products                                            │
│  └─ View all products in product grid                                        │
│     └─ API: GET /products?shopId={shopId}                                    │
│                                                                               │
│  🔍 Option B: Search Products                                                │
│  ├─ Type in search bar                                                       │
│  └─ API: GET /products?search={query}&shopId={shopId}                        │
│                                                                               │
│  🏷️  Option C: Filter by Category                                             │
│  ├─ Click category in sidebar                                                │
│  └─ API: GET /marketplace-categories/{id}/products?shopId={shopId}           │
│                                                                               │
│  📑 Option D: Paginate Results                                                │
│  ├─ Click page numbers                                                       │
│  └─ Fetch next/prev set of products                                          │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

Product Card Display:
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐                                                             │
│ │  [Image]     │  Product Name                                              │
│ │              │  $XX.XX                                                    │
│ │ [Badge]      │  ✓ In Stock / ✗ Out of Stock / ⚠️  Low Stock              │
│ └──────────────┘  {X} in stock                                              │
└─────────────────────────────────────────────────────────────────────────────┘


STEP 3: View Product Details
═══════════════════════════════════════════════════════════════════════════════

Click Product Card
            │
            ▼
   [/[token]/products/[productId]/page.tsx]
   └─ API: GET /products/{productId}
            │
            ▼
    ✅ PRODUCT DETAILS PAGE LOADS
    ├─ Image Gallery
    │  ├─ Large main image
    │  └─ Thumbnail thumbnails (clickable)
    ├─ Product Info
    │  ├─ Name
    │  ├─ Price
    │  ├─ Stock Status
    │  └─ Breadcrumb Navigation
    ├─ Product Description
    ├─ Specifications/Attributes
    └─ Add to Cart Section
       ├─ Quantity Selector (+/-)
       └─ Buttons
          ├─ "Add to Cart" (gray)
          └─ "Buy Now" (blue - adds to cart + redirects to checkout)


STEP 4: Add to Cart
═══════════════════════════════════════════════════════════════════════════════

User Actions:
1. Set Quantity (1-10)
2. Click "Add to Cart" OR "Buy Now"

Data Flow:
Zustand Store Updates
│
├─ cartStore.addItem(product, quantity)
│  ├─ Add item to items[]
│  ├─ Set shopId
│  └─ Persist to localStorage
│
└─ Success Notification appears
   └─ "✓ Added to cart!"

Cart Badge Updates:
Header Component
  │
  └─ Cart Icon
     └─ Badge Count = items.length
        (updates in real-time across tabs)


STEP 5: View Shopping Cart
═══════════════════════════════════════════════════════════════════════════════

User clicks: Cart Icon (top right)
            │
            ▼
   [/cart/page.tsx]
   └─ Fetch product details for cart items
   └─ API: GET /products/{productId} for each item
            │
            ▼
    ✅ CART PAGE LOADS
    ├─ Left Column (2/3 width)
    │  ├─ Cart Items List
    │  │  ├─ Product Image
    │  │  ├─ Product Name (linked)
    │  │  ├─ Price per unit
    │  │  ├─ Quantity Controls
    │  │  │  ├─ Minus button (−)
    │  │  │  ├─ Number input
    │  │  │  └─ Plus button (+)
    │  │  ├─ Subtotal (price × quantity)
    │  │  └─ Remove button
    │  │
    │  └─ "← Continue Shopping" Link
    │
    └─ Right Column (1/3 width) - Order Summary
       ├─ Subtotal: $XXX.XX
       ├─ Shipping: Calculated at checkout
       ├─ Total: $XXX.XX
       └─ "Proceed to Checkout" Button

User Options:
├─ Adjust Quantities
├─ Remove Items
├─ Continue Shopping (return to /[token])
└─ Proceed to Checkout


STEP 6: Checkout
═══════════════════════════════════════════════════════════════════════════════

Click "Proceed to Checkout"
            │
            ▼
   [/checkout/page.tsx]
            │
            ▼
    ✅ CHECKOUT PAGE LOADS
    ├─ Left Column (2/3 width) - Form
    │  │
    │  ├─ 📋 CUSTOMER INFORMATION
    │  │  ├─ Full Name * (text input)
    │  │  ├─ Email Address * (email input)
    │  │  └─ Phone Number * (tel input)
    │  │
    │  ├─ 🏠 DELIVERY ADDRESS
    │  │  ├─ Street Address * (textarea)
    │  │  ├─ City * (text input)
    │  │  ├─ State/Province * (text input)
    │  │  └─ ZIP/Postal Code * (text input)
    │  │
    │  └─ Action Buttons
    │     ├─ "← Back to Cart" (secondary)
    │     └─ "Place Order" (primary, loading state)
    │
    └─ Right Column (1/3 width) - Order Summary
       ├─ Items List (scrollable)
       │  └─ Product Name × Quantity → $XX.XX
       │
       └─ Totals
          ├─ Subtotal: $XXX.XX
          ├─ Shipping: To be calculated
          └─ Total: $XXX.XX

Form Validation:
On Change: Real-time validation, error cleared when user types
On Submit:
├─ Validate all required fields
├─ Show error messages if invalid
└─ If valid:
   ├─ Disable form (loading state)
   ├─ Show spinner on button
   └─ Submit order data to API


STEP 7: Create Order
═══════════════════════════════════════════════════════════════════════════════

Submit Order Data
    │
    ▼
API Call: POST /orders
{
  "shopId": "shop-123",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1 555-0000",
  "deliveryAddress": "123 Main St",
  "deliveryCity": "New York",
  "deliveryState": "NY",
  "deliveryZip": "10001",
  "items": [
    {
      "productId": "prod-123",
      "quantity": 2,
      "price": 49.99
    }
  ],
  "total": 99.98
}
    │
    ▼
Order Created Successfully
├─ Order ID: {orderId}
├─ Clear cart (Zustand store)
└─ Redirect to confirmation page


STEP 8: Order Confirmation
═══════════════════════════════════════════════════════════════════════════════

Redirect to: [/order/{orderId}/page.tsx]
    │
    ▼
API Call: GET /orders/{orderId}
    │
    ▼
✅ ORDER CONFIRMATION PAGE LOADS

Success Section:
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ✅ Order Confirmed!                                 │
│         Thank you for your purchase. Your order has been received.           │
└─────────────────────────────────────────────────────────────────────────────┘

Content Sections:
│
├─ 📋 Order Details Card
│  ├─ Order Number: ORD-123456789
│  ├─ Order Date: August 19, 2024
│  └─ Status: pending [blue badge]
│
├─ 👤 Customer Information Card
│  ├─ Name: John Doe
│  ├─ Email: john@example.com
│  └─ Phone: +1 555-0000
│
├─ 🏠 Delivery Address
│  ├─ Name: John Doe
│  ├─ Street: 123 Main St
│  └─ City, State ZIP: New York, NY 10001
│
├─ 📦 Order Items
│  ├─ Item 1: Product Name × 2 → $99.98
│  │  └─ $49.99 each
│  ├─ Item 2: Another Product × 1 → $25.00
│  │  └─ $25.00 each
│  └─ Total: $124.98 [bold, large]
│
├─ ℹ️ What's Next?
│  ├─ ✓ Confirmation email sent to john@example.com
│  ├─ ✓ Order being processed by seller
│  └─ ✓ Shipping notification coming soon
│
└─ Buttons
   ├─ "Print Receipt"
   └─ "Continue Shopping"

User Can:
├─ Print receipt (browser print dialog)
├─ Return to shop ("Continue Shopping" → /)
└─ Share order number with seller/support


═══════════════════════════════════════════════════════════════════════════════
FLOW ENDS: Order complete! ✅
═══════════════════════════════════════════════════════════════════════════════
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA ARCHITECTURE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

FRONTEND (E-commerce-webapp)          BACKEND API              DATABASE
═══════════════════════════════════════════════════════════════════════════════

React Components                     Express/NestJS           PostgreSQL/MySQL
├─ Storefront                        Controllers              └─ Shops
├─ Product Details                   ├─ /shops                └─ Products
├─ Cart                              ├─ /products             └─ Orders
├─ Checkout                          ├─ /categories           └─ Categories
└─ Order Confirmation                ├─ /orders
                                     └─ /shop-links
           │                              │
           ▼                              ▼
    Zustand Cart Store          API Endpoints (Axios)
    (localStorage)              └─ Axios HTTP Client
           │                              │
    cartStore {                          ▼
      items[]                     Backend Validation
      shopId                       └─ Form validation
      addItem()                    └─ Business logic
      removeItem()                 └─ Order creation
      updateQuantity()
      getTotal()
    }
           │
           ▼
    React Query Cache
    ├─ Shop data
    ├─ Products
    ├─ Categories
    └─ Orders
       (5min stale, 10min cache)
```

---

## 🎯 Page Hierarchy

```
Root Layout
│
├─ Root Error Boundary
│  └─ Root 404 Page
│
└─ App Routes
   │
   ├─ /[token]                    [Public]
   │  └─ /[token]/products/[id]   [Public]
   │
   ├─ /cart                       [Public]
   │
   ├─ /checkout                   [Public]
   │
   └─ /order/[orderId]           [Public]
```

---

## 🔄 Component Composition

```
App (Root)
  │
  ├─ Providers (React Query)
  │  └─ Router
  │     │
  │     ├─ StorefrontLayout
  │     │  ├─ Header
  │     │  │  └─ Cart Badge
  │     │  ├─ Main
  │     │  │  ├─ ShopHeader
  │     │  │  ├─ ProductGrid
  │     │  │  │  └─ ProductCard
  │     │  │  ├─ CategoryFilter
  │     │  │  └─ SearchBar
  │     │  └─ Footer
  │     │
  │     ├─ ProductDetailsLayout
  │     │  ├─ Header
  │     │  ├─ Main
  │     │  │  ├─ ImageGallery
  │     │  │  ├─ ProductInfo
  │     │  │  ├─ ProductSpecifications
  │     │  │  └─ AddToCartForm
  │     │  └─ Footer
  │     │
  │     ├─ CartLayout
  │     │  ├─ Header
  │     │  ├─ Main
  │     │  │  ├─ CartItems
  │     │  │  └─ OrderSummary
  │     │  └─ Footer
  │     │
  │     ├─ CheckoutLayout
  │     │  ├─ Header
  │     │  ├─ Main
  │     │  │  ├─ CheckoutForm
  │     │  │  └─ OrderSummary
  │     │  └─ Footer
  │     │
  │     └─ OrderConfirmationLayout
  │        ├─ Header
  │        ├─ Main
  │        │  ├─ SuccessMessage
  │        │  ├─ OrderDetails
  │        │  ├─ CustomerInfo
  │        │  ├─ DeliveryAddress
  │        │  ├─ OrderItems
  │        │  └─ NextSteps
  │        └─ Footer
  │
  └─ Error Boundary
     └─ ErrorPage
```

---

## 🔐 API Request/Response Examples

### 1. Resolve Shop
```
REQUEST:
GET /shop-links/resolve/john-store

RESPONSE:
{
  "success": true,
  "data": {
    "shop": { ... Shop Object ... },
    "linkId": "link-123",
    "resolvedVia": "slug"
  }
}
```

### 2. Get Products
```
REQUEST:
GET /products?shopId=shop-123

RESPONSE:
[
  {
    "id": "prod-1",
    "name": "Product 1",
    "price": 49.99,
    "stockQuantity": 10,
    "images": ["url1", "url2"],
    ...
  },
  ...
]
```

### 3. Create Order
```
REQUEST:
POST /orders
{
  "shopId": "shop-123",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1 555-0000",
  "deliveryAddress": "123 Main St",
  "deliveryCity": "New York",
  "deliveryState": "NY",
  "deliveryZip": "10001",
  "items": [...],
  "total": 99.98
}

RESPONSE:
{
  "id": "order-123",
  "shopId": "shop-123",
  "customerName": "John Doe",
  "status": "pending",
  "total": 99.98,
  ...
}
```

---

**Last Updated**: August 19, 2024
**Version**: 1.0.0
