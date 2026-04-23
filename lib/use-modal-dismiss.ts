'use client'

import { useEffect } from 'react'

export function useEscape(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])
}

export function onOverlayClick<T extends HTMLElement>(
  onClose: () => void
): React.MouseEventHandler<T> {
  return e => {
    if (e.target === e.currentTarget) onClose()
  }
}
