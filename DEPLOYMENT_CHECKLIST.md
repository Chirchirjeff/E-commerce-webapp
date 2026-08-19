# Deployment Checklist

## Pre-Deployment

- [ ] All code reviewed and tested locally
- [ ] Environment variables configured in `.env.local`
- [ ] Backend API is running and accessible
- [ ] All API endpoints tested and responding
- [ ] No console errors in development
- [ ] Build completes successfully: `npm run build`

## Configuration

- [ ] `NEXT_PUBLIC_API_URL` updated to production backend URL
- [ ] Domain/SSL certificates configured
- [ ] CORS configured on backend (if needed)
- [ ] Rate limiting configured
- [ ] Error monitoring set up (Sentry, etc.)

## Build Verification

```bash
# Run these before deploying
npm run build
npm run lint
npm start  # Test production build locally
```

- [ ] Production build completes without errors
- [ ] ESLint passes with no critical issues
- [ ] Production server starts successfully
- [ ] Load homepage: works
- [ ] Access shop: works
- [ ] Add to cart: works
- [ ] Checkout: works
- [ ] Order creation: works

## Deployment Methods

### Option 1: Vercel (Recommended)

- [ ] Push code to GitHub
- [ ] Connect repository to Vercel dashboard
- [ ] Add environment variables:
  - `NEXT_PUBLIC_API_URL` → Production API URL
- [ ] Click "Deploy"
- [ ] Verify deployment URL works

### Option 2: Docker

- [ ] Create `Dockerfile` in root
- [ ] Test Docker build: `docker build -t ecommerce-webapp .`
- [ ] Test Docker run: `docker run -p 3000:3000 ecommerce-webapp`
- [ ] Push to container registry (Docker Hub, ECR, etc.)
- [ ] Deploy container to hosting (AWS, DigitalOcean, etc.)

### Option 3: Traditional Server (VPS/EC2)

- [ ] SSH into server
- [ ] Install Node.js 18+
- [ ] Clone repository
- [ ] Install dependencies: `npm install`
- [ ] Build: `npm run build`
- [ ] Set environment variables
- [ ] Start with PM2: `pm2 start "npm start"`
- [ ] Configure nginx/Apache as reverse proxy
- [ ] Set up SSL certificate (Let's Encrypt)

## Post-Deployment Testing

### Functional Testing
- [ ] Landing page loads (redirect to shop)
- [ ] Shop page loads with products
- [ ] Search works
- [ ] Categories filter works
- [ ] Product details page loads
- [ ] Add to cart works
- [ ] Cart page displays items
- [ ] Checkout form loads
- [ ] Order creation succeeds
- [ ] Order confirmation displays

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] Images load properly
- [ ] No broken links
- [ ] Mobile responsive

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

### API Testing
- [ ] Shop resolution works
- [ ] Product fetching works
- [ ] Order creation succeeds
- [ ] Error handling works

## Monitoring & Maintenance

- [ ] Set up error tracking (Sentry, Bugsnag, etc.)
- [ ] Set up analytics (Google Analytics, etc.)
- [ ] Set up uptime monitoring (Pingdom, etc.)
- [ ] Set up log aggregation (CloudWatch, Datadog, etc.)
- [ ] Configure backup strategy
- [ ] Document deployment process

## Security

- [ ] HTTPS only (no HTTP)
- [ ] Security headers configured
  - Content-Security-Policy
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
- [ ] CORS properly configured
- [ ] API rate limiting enabled
- [ ] Environment secrets not in code
- [ ] Dependencies security scan: `npm audit`

## Performance Optimization

- [ ] Enable GZIP compression
- [ ] Configure CDN for static assets
- [ ] Set up caching headers
- [ ] Enable database query optimization
- [ ] Monitor and optimize database queries

## Rollback Plan

- [ ] Previous version tagged in git
- [ ] Deployment rollback process documented
- [ ] Database migration rollback plan (if applicable)
- [ ] Cache clear plan documented

## Documentation

- [ ] Deployment steps documented
- [ ] Environment variables documented
- [ ] Emergency contacts listed
- [ ] Support procedures documented
- [ ] Incident response plan drafted

## Go-Live Readiness

- [ ] All checklist items completed
- [ ] Team aware of deployment
- [ ] Support team ready
- [ ] Monitoring dashboards set up
- [ ] Communication channels active

---

**Status**: Ready to Deploy ✅
**Date**: August 19, 2024
