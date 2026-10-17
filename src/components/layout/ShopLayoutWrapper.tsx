'use client'

interface ShopLayoutWrapperProps {
  children: React.ReactNode
}

// ThemeProvider is already provided by the root layout's <Providers>.
// We intentionally do NOT wrap children in a second ThemeProvider here —
// doing so creates an isolated context instance that won't react to the
// header's theme toggle.
export function ShopLayoutWrapper({ children }: ShopLayoutWrapperProps) {
  return <>{children}</>
}
