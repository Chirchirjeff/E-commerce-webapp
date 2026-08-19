# E-commerce Buyer Webapp

A Next.js 14 storefront application for buyers to shop from seller stores.

## Features

- **Direct Shop Access**: Buyers land directly on seller storefronts via shareable links
- **Product Browsing**: Browse, search, and filter products by category
- **Product Details**: View detailed product information, images, and specifications
- **Shopping Cart**: Add/remove items, manage quantities
- **Checkout Flow**: Customer info, delivery address, order summary
- **Order Confirmation**: Track order details after purchase

## Tech Stack

- **Framework**: Next.js 14
- **UI**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand (cart), React Query (server state)
- **UI Components**: Radix UI
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Create a `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Update `NEXT_PUBLIC_API_URL` to point to your backend API.

### Development

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── [token]/        # Dynamic shop pages (e.g., /john-store)
│   ├── products/       # Product detail pages
│   ├── cart/           # Cart page
│   ├── checkout/       # Checkout flow
│   └── order/          # Order confirmation
├── components/         # Reusable React components
│   ├── ui/            # Generic UI components
│   ├── shop/          # Shop-related components
│   └── products/      # Product-related components
├── lib/               # Utilities and API client
├── stores/            # Zustand state stores
└── types/             # TypeScript types
```

## API Integration

The app communicates with the backend through:

- **Shop Resolution**: `/shop-links/resolve/:tokenOrSlug`
- **Products**: `/products`, `/products/:id`
- **Categories**: `/marketplace-categories`
- **Orders**: `/orders` (POST)

See `src/lib/api.ts` for all endpoints.

## License

Proprietary
