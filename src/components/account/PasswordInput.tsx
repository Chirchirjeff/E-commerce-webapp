'use client'

import { forwardRef, InputHTMLAttributes, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  invalid?: boolean
}

/**
 * Password field with a show/hide (eye) toggle inside the field, like the
 * Google / Amazon sign-in forms. Use this for every password input.
 *
 * - The toggle is a `type="button"`, so it never submits the form.
 * - Clicking it doesn't steal focus from the field, and the caret/selection
 *   is kept where it was when the input switches between text and password.
 * - Keyboard users can Tab to it; it exposes aria-pressed and a label that
 *   says what the next press will do.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className, invalid, disabled, ...props },
  forwardedRef,
) {
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  // Caret / selection to restore after the type flips (some browsers reset it).
  const pendingSelection = useRef<{ start: number | null; end: number | null } | null>(null)

  const setRefs = useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node
    if (typeof forwardedRef === 'function') forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }, [forwardedRef])

  useLayoutEffect(() => {
    const input = inputRef.current
    const selection = pendingSelection.current
    pendingSelection.current = null
    if (!input || !selection || document.activeElement !== input) return
    try {
      input.setSelectionRange(selection.start, selection.end)
    } catch {
      // setSelectionRange can throw for some input types; nothing to restore.
    }
  }, [visible])

  const toggle = () => {
    const input = inputRef.current
    if (input && document.activeElement === input) {
      pendingSelection.current = { start: input.selectionStart, end: input.selectionEnd }
    }
    setVisible((v) => !v)
  }

  const label = visible ? 'Hide password' : 'Show password'

  return (
    <div className="relative">
      <input
        {...props}
        ref={setRefs}
        disabled={disabled}
        type={visible ? 'text' : 'password'}
        // Don't let the browser autocapitalise or spell-check a visible password.
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn(
          'w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent',
          invalid ? 'border-red-500' : 'border-gray-300',
          className,
        )}
      />
      <button
        type="button"
        // Keep focus (and the caret) in the field when the toggle is clicked.
        onMouseDown={(event) => event.preventDefault()}
        onClick={toggle}
        disabled={disabled}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50"
        aria-label={label}
        aria-pressed={visible}
        aria-controls={props.id}
        title={label}
      >
        {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
      </button>
    </div>
  )
})
