'use client'

import { ReactNode, useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

interface AccountDialogProps {
  open: boolean
  title: string
  description?: ReactNode
  onClose: () => void
  /** Blocks Escape / backdrop / X while a request is in flight. */
  busy?: boolean
  children: ReactNode
}

/**
 * Modal used by the account page (photo, email, password). Bottom sheet on
 * phones, centred card from `sm` up — same shape as the Quick Pay sheet.
 */
export function AccountDialog({ open, title, description, onClose, busy = false, children }: AccountDialogProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const busyRef = useRef(busy)
  busyRef.current = busy

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    // Focus the first field (or the panel) so keyboard users land inside.
    requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('input, textarea, select, button[type="submit"]')
      ;(first ?? panelRef.current)?.focus()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) { event.stopPropagation(); onCloseRef.current() }
      // Keep Tab cycling within the dialog.
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ))
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 animate-fade-in" onClick={() => { if (!busy) onClose() }} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="pointer-events-auto bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] overflow-y-auto focus:outline-none"
        >
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-200">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-bold text-gray-900">{title}</h2>
              {description && <div className="text-sm text-gray-500 mt-0.5">{description}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <div className="px-5 py-5">{children}</div>
        </div>
      </div>
    </>
  )
}
