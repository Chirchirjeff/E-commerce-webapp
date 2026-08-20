import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ShopLayoutWrapper } from '@/components/layout/ShopLayoutWrapper'

export default function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { token: string }
}) {
  return (
    <ShopLayoutWrapper>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ShopLayoutWrapper>
  )
}
