'use client'

import { useEffect, useState } from 'react'
import { isDemoPaid, togglePaidPreview, isServerPaidMode } from '@/lib/use-credits'

export function DemoToggle() {
  const [on, setOn] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setOn(isDemoPaid())
    const h = () => setOn(isDemoPaid())
    window.addEventListener('injoy:demo-change', h)
    window.addEventListener('storage', h)
    return () => {
      window.removeEventListener('injoy:demo-change', h)
      window.removeEventListener('storage', h)
    }
  }, [])

  if (!mounted) return null
  // Im echten Paid-Modus obsolet — ausblenden.
  if (isServerPaidMode()) return null

  return (
    <button
      className={`demo-toggle${on ? ' on' : ''}`}
      onClick={togglePaidPreview}
      title={on ? 'Zurück zur Beta-Ansicht' : 'Paid-Tier Vorschau aktivieren'}
    >
      <span className="demo-dot" />
      <span className="demo-label">
        {on ? 'Paid-Tier Vorschau' : 'Beta-Ansicht'}
      </span>
      <span className="demo-sub">{on ? 'AN' : 'AUS'}</span>
    </button>
  )
}
