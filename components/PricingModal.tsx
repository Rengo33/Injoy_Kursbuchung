'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { useProfile } from '@/lib/use-profile'
import { addDemoCredits, isDemoPaid, isServerPaidMode, refreshCredits } from '@/lib/use-credits'
import { getStripe } from '@/lib/stripe-browser'
import { useEscape, onOverlayClick } from '@/lib/use-modal-dismiss'
import { TIER_DISPLAY, type TierDisplay } from '@/lib/tiers'

type Tier = TierDisplay

interface Props {
  onClose: () => void
}

type View =
  | { kind: 'tiers' }
  | { kind: 'loading', tier: Tier }
  | { kind: 'checkout', tier: Tier, clientSecret: string }
  | { kind: 'success', tier: Tier }
  | { kind: 'error', message: string }

export function PricingModal({ onClose }: Props) {
  const { isAuthed } = useProfile()
  const [view, setView] = useState<View>({ kind: 'tiers' })
  const [demoSuccess, setDemoSuccess] = useState<Tier | null>(null)
  const [mounted, setMounted] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEscape(onClose)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  const demoMode = mounted && !isServerPaidMode() && isDemoPaid()

  const buy = useCallback(async (tier: Tier) => {
    if (demoMode) {
      setView({ kind: 'loading', tier })
      await new Promise(r => setTimeout(r, 600))
      addDemoCredits(tier.credits)
      setDemoSuccess(tier)
      closeTimer.current = setTimeout(onClose, 1300)
      return
    }

    if (!isAuthed) {
      setView({ kind: 'error', message: 'Bitte zuerst anmelden.' })
      return
    }

    setView({ kind: 'loading', tier })
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId: tier.id }),
      })
      const data = await res.json()
      if (!data.success || !data.clientSecret) {
        throw new Error(data.error ?? 'Checkout konnte nicht gestartet werden')
      }
      setView({ kind: 'checkout', tier, clientSecret: data.clientSecret })
    } catch (err) {
      setView({ kind: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }, [demoMode, isAuthed, onClose])

  const onComplete = useCallback(() => {
    if (view.kind !== 'checkout') return
    setView({ kind: 'success', tier: view.tier })
    closeTimer.current = setTimeout(() => {
      refreshCredits()
      onClose()
    }, 2400)
  }, [view, onClose])

  return (
    <div className="modal-overlay" onClick={onOverlayClick(onClose)}>
      <div className={`modal pricing-modal${view.kind === 'checkout' ? ' pricing-modal-wide' : ''}`}>

        {view.kind === 'tiers' && (
          <>
            <div className="modal-header">
              <h2>Credits <em>aufladen</em></h2>
              <p className="pricing-sub">
                Jeder Auto-Book kostet 1 Credit. {demoMode ? 'Im Demo-Modus ohne echte Zahlung.' : 'Sichere Zahlung via Stripe.'}
              </p>
            </div>

            {!isAuthed && !demoMode && (
              <div className="pricing-login-hint">
                Zum Kaufen bitte erst <Link href="/login">anmelden</Link>.
              </div>
            )}

            <div className="pricing-grid">
              {TIER_DISPLAY.map(tier => (
                <div key={tier.id} className={`pricing-tier${tier.featured ? ' featured' : ''}`}>
                  {tier.featured && <div className="pricing-badge">empfohlen</div>}
                  <div className="pricing-name">{tier.name}</div>
                  <div className="pricing-price">
                    <span className="pricing-price-big">{tier.priceLabel}</span>
                    {tier.priceNote && <span className="pricing-price-note">{tier.priceNote}</span>}
                  </div>
                  <div className="pricing-desc">{tier.desc}</div>
                  <button
                    className="btn book pricing-btn"
                    disabled={!isAuthed && !demoMode}
                    onClick={() => buy(tier)}
                  >
                    Kaufen
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {view.kind === 'loading' && (
          <div className="pricing-loading">
            <div className="spinner" />
            <p>Checkout wird vorbereitet…</p>
          </div>
        )}

        {view.kind === 'checkout' && (
          <>
            <div className="modal-header pricing-header-slim">
              <button type="button" className="pricing-back" onClick={() => setView({ kind: 'tiers' })}>
                ← zurück
              </button>
              <h2>{view.tier.name} <em>kaufen</em></h2>
            </div>
            <div className="pricing-embed">
              <EmbeddedCheckoutProvider
                stripe={getStripe()}
                options={{ clientSecret: view.clientSecret, onComplete }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </>
        )}

        {view.kind === 'success' && (
          <div className="pricing-success">
            <div className="pricing-success-mark">✓</div>
            <div>
              <b>Zahlung erfolgreich</b>
              <p>+{view.tier.credits} Credits werden gleich auf dein Konto gebucht.</p>
            </div>
          </div>
        )}

        {demoSuccess && (
          <div className="pricing-success">
            <div className="pricing-success-mark">✓</div>
            <div>
              <b>+{demoSuccess.credits} Credits</b>
              <p>Demo-Kauf gebucht.</p>
            </div>
          </div>
        )}

        {view.kind === 'error' && (
          <>
            <div className="pricing-error">
              <p>{view.message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={onClose}>Schließen</button>
              <button className="btn book" onClick={() => setView({ kind: 'tiers' })}>
                Erneut versuchen
              </button>
            </div>
          </>
        )}

        {(view.kind === 'tiers' || view.kind === 'loading') && (
          <div className="pricing-foot">
            <span>{demoMode ? 'Demo-Preview · keine echte Zahlung' : 'Sichere Zahlung via Stripe'}</span>
            <button className="btn secondary pricing-close" onClick={onClose}>Schließen</button>
          </div>
        )}
      </div>
    </div>
  )
}
