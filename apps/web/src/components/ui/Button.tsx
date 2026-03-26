'use client'

import { useRef, useState, useCallback } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type ButtonState = 'idle' | 'loading' | 'success' | 'error'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  hasError?: boolean
  children: React.ReactNode
}

const BASE =
  'relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold select-none transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-taxly-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-taxly-700 text-white hover:bg-taxly-800 active:scale-[0.97] disabled:opacity-60',
  secondary:
    'border border-taxly-700 text-taxly-700 hover:bg-taxly-100 active:scale-[0.97] disabled:opacity-60',
  ghost:
    'text-[#5A6A8A] hover:text-taxly-700 active:scale-[0.97] disabled:opacity-60',
}

const STATE_OVERRIDE: Partial<Record<ButtonState, string>> = {
  success: '!bg-emerald-500 !border-emerald-500 !text-white',
  error: '!bg-[#FF5252] !border-[#FF5252] !text-white animate-shake',
}

export function Button({
  variant = 'primary',
  loading = false,
  hasError = false,
  disabled,
  onClick,
  children,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const [state, setState] = useState<ButtonState>('idle')
  const [shaking, setShaking] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const rippleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerShake = useCallback(() => {
    setShaking(true)
    setTimeout(() => setShaking(false), 450)
  }, [])

  const triggerRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    const ripple = document.createElement('span')
    ripple.style.cssText = `
      position:absolute;
      border-radius:50%;
      background:rgba(255,255,255,0.35);
      width:${size}px;
      height:${size}px;
      left:${x}px;
      top:${y}px;
      transform:scale(0);
      animation:txRipple 550ms ease-out forwards;
      pointer-events:none;
    `
    btn.appendChild(ripple)
    if (rippleRef.current) clearTimeout(rippleRef.current)
    rippleRef.current = setTimeout(() => ripple.remove(), 600)
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled || state === 'loading') return
      if (hasError) {
        triggerShake()
        onClick?.(e)
        return
      }
      triggerRipple(e)
      onClick?.(e)
    },
    [loading, disabled, state, hasError, triggerShake, triggerRipple, onClick],
  )

  const isLoading = loading || state === 'loading'
  const stateClass = STATE_OVERRIDE[state] ?? ''

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={isLoading || disabled}
      onClick={handleClick}
      className={`${BASE} ${VARIANTS[variant]} ${stateClass} ${shaking ? 'animate-shake' : ''} ${className}`}
      {...rest}
    >
      {/* Spinner */}
      {isLoading && (
        <svg
          className="animate-spin"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="31.4"
            strokeDashoffset="10"
          />
        </svg>
      )}

      {/* Success checkmark */}
      {state === 'success' && !isLoading && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" />
        </svg>
      )}

      {/* Error X */}
      {state === 'error' && !isLoading && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" />
        </svg>
      )}

      <span>{children}</span>
    </button>
  )
}

/**
 * Hook to wire up async actions to a Button's loading/success/error state.
 *
 * Usage:
 *   const { run, loading } = useButtonAction()
 *   <Button loading={loading} onClick={() => run(submitForm)}>Save</Button>
 */
export function useButtonAction() {
  const [loading, setLoading] = useState(false)

  const run = useCallback(async (action: () => Promise<void>) => {
    if (loading) return
    setLoading(true)
    try {
      await action()
    } finally {
      setLoading(false)
    }
  }, [loading])

  return { loading, run }
}
