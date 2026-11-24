import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES',
  }).format(price)
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function generateOrderNumber(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

/** Validates a Kenyan mobile number (07…, 01…, +2547…, 2541…). Returns an error message or null. */
export function validateKenyanPhone(value: string, required = true): string | null {
  const cleaned = value.replace(/\s+/g, '')
  if (!cleaned) return required ? 'Phone number is required' : null
  if (!/^(\+?254|0)[17]\d{8}$/.test(cleaned)) {
    return 'Enter a valid Kenyan number (e.g. 0712 345 678)'
  }
  return null
}

/** Up to two initials for an avatar fallback, e.g. "Jane Wanjiru Doe" → "JW". */
export function getInitials(name?: string | null, fallback = '?'): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return fallback.charAt(0).toUpperCase()
  return parts.slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase()
}
