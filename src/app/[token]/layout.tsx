import { ShopLayoutWrapper } from '@/components/layout/ShopLayoutWrapper'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
  params: { token: string }
}) {
  // Header and Footer are provided by the root layout.
  // ShopLayoutWrapper re-provides ThemeProvider for the shop's dark/light theme.
  return (
    <ShopLayoutWrapper>
      {children}
    </ShopLayoutWrapper>
  )
}
