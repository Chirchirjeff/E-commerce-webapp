'use client'

import { ThemeProvider } from '@/context/ThemeContext'

interface ShopLayoutWrapperProps {
  children: React.ReactNode
}

export function ShopLayoutWrapper({ children }: ShopLayoutWrapperProps) {
  return <ThemeProvider>{children}</ThemeProvider>
}
