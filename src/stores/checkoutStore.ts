import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/types'

export interface DeliveryDetails {
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryAddress: string
  deliveryCity: string
  deliveryState: string
  deliveryZip: string
}

/**
 * Where an in-flight payment came from.
 * - 'cart':   paying for the cart → the cart is cleared once payment succeeds.
 * - 'buyNow': express single-item purchase that never touched the cart → the
 *             cart is left exactly as the buyer had it.
 */
export type CheckoutSource = 'buyNow' | 'cart'

export interface PendingPaymentItem {
  product: Product
  quantity: number
  price: number
}

/** Snapshot of the order an STK push was sent for, read by /checkout/processing. */
export interface PendingPayment {
  source: CheckoutSource
  amount: number
  shopId: string
  shopToken: string | null
  shopName?: string
  items: PendingPaymentItem[]
}

interface CheckoutState {
  delivery: DeliveryDetails | null
  /** Identifies the buyer who entered the persisted delivery details. */
  deliveryBuyerId: string | null
  mpesaPhone: string
  checkoutRequestId: string | null
  orderNumber: string | null        // reserved before payment, shown on statement
  /** Order id returned on payment success — held until delivery-after page submits. */
  pendingOrderId: string | null
  /**
   * Tracking token for the pending order.
   * Used by guest buyers (no account) to view their order confirmation and to
   * authorise the delivery-address PATCH without a JWT.
   */
  pendingOrderTrackingToken: string | null
  /** Shop link token — persisted independently so it survives clearCheckout(),
   *  letting the order confirmation page send the buyer back to the right shop. */
  shopToken: string | null
  /** Shop link token the buyer actually checked out from, keyed by order id. */
  orderShopTokens: Record<string, string>
  /** The order the current STK push was sent for (source, amount, items). */
  pendingPayment: PendingPayment | null

  setDelivery: (details: DeliveryDetails, buyerId: string | null) => void
  setMpesaPhone: (phone: string) => void
  setCheckoutRequestId: (id: string) => void
  setOrderNumber: (num: string) => void
  setPendingOrderId: (id: string | null) => void
  setPendingOrderTrackingToken: (token: string | null) => void
  setShopToken: (token: string) => void
  setOrderShopToken: (orderId: string, token: string) => void
  setPendingPayment: (payment: PendingPayment | null) => void
  clearCheckout: () => void
  clearBuyerDetails: () => void
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      delivery: null,
      deliveryBuyerId: null,
      mpesaPhone: '',
      checkoutRequestId: null,
      orderNumber: null,
      pendingOrderId: null,
      pendingOrderTrackingToken: null,
      shopToken: null,
      orderShopTokens: {},
      pendingPayment: null,

      // When the buyer edits their phone (e.g. after a failed payment), drop the
      // M-Pesa number remembered from the previous attempt so the payment page
      // pre-fills the updated number instead of re-prompting the old one.
      setDelivery: (details, buyerId) =>
        set((state) => ({
          delivery: details,
          deliveryBuyerId: buyerId,
          mpesaPhone: state.delivery?.customerPhone === details.customerPhone ? state.mpesaPhone : '',
        })),
      setMpesaPhone: (phone) => set({ mpesaPhone: phone }),
      setCheckoutRequestId: (id) => set({ checkoutRequestId: id }),
      setOrderNumber: (num) => set({ orderNumber: num }),
      setPendingOrderId: (id) => set({ pendingOrderId: id }),
      setPendingOrderTrackingToken: (token) => set({ pendingOrderTrackingToken: token }),
      // shopToken is intentionally NOT reset by clearCheckout so the order
      // confirmation page can still send the buyer back to the correct shop.
      setShopToken: (token) => set({ shopToken: token }),
      setOrderShopToken: (orderId, token) =>
        set((state) => ({ orderShopTokens: { ...state.orderShopTokens, [orderId]: token } })),
      setPendingPayment: (payment) => set({ pendingPayment: payment }),
      clearCheckout: () =>
        set({
          delivery: null,
          deliveryBuyerId: null,
          mpesaPhone: '',
          checkoutRequestId: null,
          orderNumber: null,
          pendingOrderId: null,
          pendingOrderTrackingToken: null,
          pendingPayment: null,
        }),
      clearBuyerDetails: () =>
        set({
          delivery: null,
          deliveryBuyerId: null,
          mpesaPhone: '',
          checkoutRequestId: null,
          orderNumber: null,
          pendingOrderId: null,
          pendingOrderTrackingToken: null,
          pendingPayment: null,
        }),
    }),
    {
      name: 'checkout-storage',
      // Data saved by older versions was not associated with a buyer. Discard
      // it during hydration instead of ever showing it to a later account.
      onRehydrateStorage: () => (state) => {
        if (state?.delivery && state.deliveryBuyerId === undefined) state.clearBuyerDetails()
      },
    }
  )
)
