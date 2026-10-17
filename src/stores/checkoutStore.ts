import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DeliveryDetails {
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryAddress: string
  deliveryCity: string
  deliveryState: string
  deliveryZip: string
}

interface CheckoutState {
  delivery: DeliveryDetails | null
  /** Identifies the buyer who entered the persisted delivery details. */
  deliveryBuyerId: string | null
  mpesaPhone: string
  checkoutRequestId: string | null
  orderNumber: string | null        // reserved before payment, shown on statement
  /** Shop link token — persisted independently so it survives clearCheckout(),
   *  letting the order confirmation page send the buyer back to the right shop. */
  shopToken: string | null

  setDelivery: (details: DeliveryDetails, buyerId: string) => void
  setMpesaPhone: (phone: string) => void
  setCheckoutRequestId: (id: string) => void
  setOrderNumber: (num: string) => void
  setShopToken: (token: string) => void
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
      shopToken: null,

      setDelivery: (details, buyerId) => set({ delivery: details, deliveryBuyerId: buyerId }),
      setMpesaPhone: (phone) => set({ mpesaPhone: phone }),
      setCheckoutRequestId: (id) => set({ checkoutRequestId: id }),
      setOrderNumber: (num) => set({ orderNumber: num }),
      // shopToken is intentionally NOT reset by clearCheckout so the order
      // confirmation page can still send the buyer back to the correct shop.
      setShopToken: (token) => set({ shopToken: token }),
      clearCheckout: () =>
        set({ delivery: null, deliveryBuyerId: null, mpesaPhone: '', checkoutRequestId: null, orderNumber: null }),
      clearBuyerDetails: () =>
        set({ delivery: null, deliveryBuyerId: null, mpesaPhone: '', checkoutRequestId: null, orderNumber: null }),
    }),
    {
      name: 'checkout-storage',
      // Data saved by older versions was not associated with a buyer. Discard
      // it during hydration instead of ever showing it to a later account.
      onRehydrateStorage: () => (state) => {
        if (state?.delivery && !state.deliveryBuyerId) state.clearBuyerDetails()
      },
    }
  )
)
