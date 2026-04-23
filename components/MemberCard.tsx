'use client'

import { useState } from 'react'
import { useCredits } from '@/lib/use-credits'
import { PricingModal } from './PricingModal'

export function MemberCard() {
  const { credits } = useCredits()
  const [pricingOpen, setPricingOpen] = useState(false)

  if (!credits) {
    return (
      <div className="member-card">
        <div className="member-row"><span>Auto-Book</span></div>
      </div>
    )
  }

  if (credits.freeMode) {
    return (
      <div className="member-card">
        <div className="member-row">
          <span>Auto-Book</span>
          <b className="member-beta">Beta</b>
        </div>
        <div className="member-card-hint">
          Aktuell sind alle automatischen Buchungen kostenlos.
        </div>
      </div>
    )
  }

  const pct = credits.monthlyAllowance > 0
    ? Math.round((credits.credits / credits.monthlyAllowance) * 100)
    : 0
  const empty = credits.credits === 0

  return (
    <>
      <div className={`member-card${empty ? ' empty' : ''}`}>
        <div className="member-row">
          <span>Auto-Book Credits</span>
          <b>{credits.credits} / {credits.monthlyAllowance}</b>
        </div>
        <div className="member-progress">
          <div className="member-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="member-footer">
          <span>{credits.nextRefill ? `Nachschub · ${credits.nextRefill}` : ''}</span>
          <button className="member-cta" onClick={() => setPricingOpen(true)}>
            {empty ? 'Jetzt kaufen' : 'Nachfüllen'}
          </button>
        </div>
      </div>

      {pricingOpen && <PricingModal onClose={() => setPricingOpen(false)} />}
    </>
  )
}
