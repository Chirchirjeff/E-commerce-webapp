# E-commerce Buyer Webapp - Setup Guide

## Overview

This is a Next.js 14 buyer-facing storefront application that allows customers to shop from seller stores via shareable links. The app provides direct access to seller storefronts without any landing page—buyers land directly on the shop and can browse products, add items to cart, and checkout.

## Architecture

### Pages & Routes

```
/                           → Redirect to shop (requires token/slug in URL)
/[token]                   → Seller storefront (main shopping page)
/[token]/products/[id]     → Product details page
/cart                      → Shopping cart page
/checkout                  → Checkout form (customer info & address)
/order/[orderId]          → Order confirmation page
```

### Key Features

- **Seller Shop Resolution**: Uses hybrid token/slug routing to resolve seller shops
- **Product Browsing**: Search, category filtering, pagination
- **Shopping Cart**: Persistent cart state using Zustand (localStorage)
- **Checkout**: Customer info & delivery address collection
- **Order Management**: Order creation and confirmation display

## Prerequisites

- Node.js 18+ (18.17 or later)
- npm or yarn
- Backend API running (see Backend Setup below)

## Installation

### 1. Clone and Install Dependencies

```bash
cd E-commerce-webapp
npm install
```

### 2. Environment Configuration

Create `.env.local` in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` to set your backend API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Note**: For production, update this to your deployed backend URL.

### 3. Backend API Setup

The webapp requires a running backend API. Ensure your backend is set up at the URL specified in `.env.local`.

**Required Backend Endpoints:**

- `GET /shop-links/resolve/:tokenOrSlug` - Resolve seller shop by token or slug
- `GET /products` - List all products
- `GET /products/:id` - Get product details
- `GET /marketplace-categories` - List categories
- `POST /orders` - Create order

See backend README for full setup instructions.

## Development

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3001` (or next available port).

### Access a Shop

You need a valid seller token or shop slug. Get this from:

1. Create a seller account in the admin dashboard
2. Create a shop and generate a share link
3. Copy the token/slug from the URL

Then visit: `http://localhost:3001/[token-or-slug]`

### Hot Reload

The development server supports hot reload. Edit any file and changes will automatically refresh in the browser.

## Production Build

### Build for Production

```bash
npm run build
```

This creates an optimized production build in `.next/`.

### Start Production Server

```bash
npm start
```

The app will be available at `http://localhost:3000` (default) or the next available port.

## Project Structure

```
src/
├── app/                          # Next.js app router pages
│   ├── [token]/                  # Seller storefront routes
│   │   ├── page.tsx             # Storefront main page
│   │   ├── products/
│   │   │   └── [productId]/
│   │   │       └── page.tsx     # Product details
│   │   └── layout.tsx           # Storefront layout
│   ├── cart/
│   │   └── page.tsx             # Shopping cart
│   ├── checkout/
│   │   └── page.tsx             # Checkout form
│   ├── order/
│   │   └── [orderId]/
│   │       └── page.tsx         # Order confirmation
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   ├── error.tsx                # Error boundary
│   ├── not-found.tsx            # 404 page
│   └── providers.tsx            # Client providers (React Query)
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx           # Top navigation
│   │   ├── Footer.tsx           # Footer
│   │   └── ShopHeader.tsx       # Shop banner & info
│   ├── products/
│   │   ├── ProductGrid.tsx      # Product listing grid
│   │   ├── ProductCard.tsx      # Individual product card
│   │   ├── ProductDetails.tsx   # Product detail view
│   │   ├── ImageGallery.tsx     # Product image gallery
│   │   ├── ProductSpecifications.tsx  # Specs display
│   │   ├── AddToCartForm.tsx    # Add to cart form
│   │   ├── SearchBar.tsx        # Product search
│   │   └── CategoryFilter.tsx   # Category filtering
│   └── ui/
│       ├── Button.tsx           # Reusable button component
│       └── Badge.tsx            # Status badge component
│
├── lib/
│   ├── api.ts                   # API client & endpoints
│   └── utils.ts                 # Utility functions
│
├── stores/
│   └── cartStore.ts             # Zustand cart state management
│
├── types/
│   └── index.ts                 # TypeScript type definitions
│
└── contexts/
    └── (future: auth context)
```

## Key Technologies

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: 
  - Cart: Zustand (with localStorage persistence)
  - Server: React Query (@tanstack/react-query)
- **UI Components**: Radix UI
- **HTTP Client**: Axios
- **Image Optimization**: Next.js Image

## State Management

### Cart State (Zustand)

The cart state is managed by Zustand with localStorage persistence. It automatically syncs across tabs and sessions.

**Store Location**: `src/stores/cartStore.ts`

**Usage**:

```typescript
import { useCartStore } from '@/stores/cartStore'

const items = useCartStore((state) => state.items)
const addItem = useCartStore((state) => state.addItem)
const removeItem = useCartStore((state) => state.removeItem)
const total = useCartStore((state) => state.getTotal())
```

### Server State (React Query)

Product data, categories, and shop information are fetched and cached using React Query.

**Stale Time**: 5 minutes
**Cache Time**: 10 minutes

## API Integration

All API endpoints are centralized in `src/lib/api.ts`:

```typescript
// Shop API
shopAPI.resolveLinkByToken(token)
shopAPI.getShopByToken(token)
shopAPI.getShopDetails(shopId)

// Products API
productsAPI.getAll()
productsAPI.getOne(id)
productsAPI.getByShop(shopId)
productsAPI.search(query, shopId)

// Categories API
categoriesAPI.getAll()
categoriesAPI.getBySlug(slug)
categoriesAPI.getOne(id)
categoriesAPI.getProducts(id)

// Orders API
ordersAPI.create(orderData)
ordersAPI.getOne(id)
```

## Styling & Theming

The app uses Tailwind CSS with custom color configuration.

**Primary Color**: Sky blue (customizable in `tailwind.config.ts`)

To customize colors, edit `theme.extend.colors` in `tailwind.config.ts`.

## Performance Optimizations

1. **Image Optimization**: Next.js Image component with optimization
2. **Code Splitting**: Automatic per-route code splitting
3. **Data Caching**: React Query caching strategy
4. **Persistent Cart**: localStorage reduces re-fetch overhead
5. **CSS Minification**: Tailwind CSS production optimizations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Shop Not Found

- Verify the token/slug is correct
- Check backend is running and accessible
- Confirm `NEXT_PUBLIC_API_URL` points to correct backend

### Products Not Loading

- Check backend API is responding: `curl http://localhost:3000/products`
- Verify React Query is configured correctly in `providers.tsx`
- Check browser console for API errors

### Cart Not Persisting

- Check browser allows localStorage
- Try clearing browser cache
- Verify Zustand store is correctly initialized

### Build Errors

- Clear `.next/` folder: `rm -rf .next`
- Clear `node_modules/`: `rm -rf node_modules`
- Reinstall: `npm install`
- Rebuild: `npm run build`

## Deployment

### Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL=https://your-backend-api.com`
4. Deploy automatically on push

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t ecommerce-webapp .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://api:3000 ecommerce-webapp
```

### Traditional Server

```bash
npm run build
npm start
```

Set environment variables before running:

```bash
export NEXT_PUBLIC_API_URL=https://api.example.com
npm start
```

## Development Tips

### Enable Debug Logging

Add to browser console:

```javascript
localStorage.debug = '*'
```

### React Query DevTools

React Query DevTools are enabled in development. Access via keyboard shortcut.

### TypeScript Checking

Run type checking:

```bash
npm run type-check  # Not yet set up, can add to package.json
```

## Testing (Future Enhancement)

Currently no tests are included. To add:

1. Install Jest & React Testing Library
2. Create test files alongside components
3. Run `npm test`

## Contributing

When adding features:

1. Keep components in appropriate folders
2. Use existing UI components from `components/ui/`
3. Follow the TypeScript type definitions in `src/types/`
4. Add API endpoints to `src/lib/api.ts`
5. Update this documentation

## License

Proprietary - E-commerce Platform

## Support

For issues or questions about the webapp, contact the development team.

---

**Last Updated**: August 2024
**App Version**: 0.1.0
**Next.js Version**: 14.2.3
