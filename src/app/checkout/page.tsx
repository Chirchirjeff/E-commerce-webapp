import { redirect } from 'next/navigation'

/**
 * /checkout is now just an entry guard.
 * All checkout logic lives in the sub-routes:
 *   /checkout/delivery  → step 1: customer + delivery details
 *   /checkout/review    → step 2: order review
 *   /checkout/payment   → step 3: M-Pesa payment
 *   /checkout/processing → step 4: polling + confirmation
 */
export default function CheckoutPage() {
  redirect('/checkout/delivery')
}
