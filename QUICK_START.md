# Quick Start Guide

## 1️⃣ Installation

```bash
cd E-commerce-webapp
npm install
```

## 2️⃣ Setup Environment

Create `.env.local`:

```bash
echo 'NEXT_PUBLIC_API_URL=http://localhost:3000' > .env.local
```

Update if your backend is on a different URL.

## 3️⃣ Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3001

## 4️⃣ Access a Shop

You need a seller token or shop slug from the backend. Format:

```
http://localhost:3001/[token-or-slug]
```

Example (with token):
```
http://localhost:3001/abc123def456
```

Example (with slug):
```
http://localhost:3001/john-store
```

## 5️⃣ Test the Flow

1. **Browse Products** - See all products on the storefront
2. **Search** - Use the search bar to find products
3. **Filter by Category** - Click categories in the sidebar
4. **View Details** - Click a product to see full details
5. **Add to Cart** - Click "Add to Cart" or "Buy Now"
6. **View Cart** - Click cart icon in header
7. **Checkout** - Fill in customer info and delivery address
8. **Confirm** - See order confirmation page

## 📁 Project Structure Quick Reference

```
Key Files:
├── src/lib/api.ts           ← All API endpoints
├── src/stores/cartStore.ts  ← Cart state (Zustand)
├── src/app/[token]/page.tsx ← Main storefront
└── tailwind.config.ts       ← Styling config
```

## 🔧 Common Tasks

### Change API URL

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=https://your-api.com
```

### Add a New Page

Create in `src/app/`:
```
src/app/new-page/page.tsx
```

### Modify Colors

Edit `tailwind.config.ts` - update `theme.extend.colors`

### Debug API Calls

Open browser DevTools → Network tab
Or add logging to `src/lib/api.ts`

## 🚀 Production Build

```bash
npm run build      # Create optimized build
npm start          # Start production server
```

## 📖 Full Documentation

- **SETUP.md** - Detailed setup and deployment guide
- **ARCHITECTURE.md** - System design and components
- **README.md** - Project overview

## ❓ Troubleshooting

**Shop not found?**
- Check token/slug is correct
- Verify backend is running

**Products not loading?**
- Check backend API is responding
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

**Cart not saving?**
- Clear browser cache and localStorage
- Check browser allows localStorage

**Build error?**
```bash
rm -rf .next node_modules
npm install
npm run build
```

## 📞 Need Help?

Check the documentation files for detailed information:
- Installation issues → SETUP.md
- Architecture questions → ARCHITECTURE.md
- General info → README.md

---

**Ready to ship!** 🎉
