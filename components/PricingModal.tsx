'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { useProfile } from '@/lib/use-profile'
import { addDemoCredits, isDemoPaid, isServerPaidMode } from '@/lib/use-credits'
import { getStripe } from '@/lib/stripe-browser'

interface Tier {
  id: 'single' | 'bundle' | 'unlimited'
  name: string
  credits: number
  price: string
  priceNote?: string
  desc: string
  featured?: boolean
}

const TIERS: Tier[] = [
  { id: 'single', name: 'Einzeln', credits: 1, price: '€ 1,99', desc: '1 Auto-Book' },
  { id: 'bundle', name: 'Bündel', credits: 10, price: '€ 14,90', priceNote: '· 25 % sparen', desc: '10 Auto-Bookings', featured: true },
  { id: 'unlimited', name: 'Unlimited', credits: 999, price: '€ 9,90', desc: '999 Credits · Power-User' },
]

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

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onClose])

  const demoMode = typeof window !== 'undefined' && !isServerPaidMode() && isDemoPaid()

  const buy = useCallback(async (tier: Tier) => {
    // Demo: kein Stripe
    if (demoMode) {
      setView({ kind: 'loading', tier })
      await new Promise(r => setTimeout(r, 600))
      addDemoCredits(tier.credits)
      setDemoSuccess(tier)
      setTimeout(onClose, 1300)
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
    // Credits werden per Webhook serverseitig gutgeschrieben. Wir warten kurz,
    // dann Modal schließen — Hook refetched automatisch über Storage-Event
    // (oder der Nutzer lädt neu).
    setTimeout(() => {
      window.dispatchEvent(new Event('injoy:demo-change')) // triggert useCredits refetch
      onClose()
    }, 2400)
  }, [view, onClose])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
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
              {TIERS.map(tier => (
                <div key={tier.id} className={`pricing-tier${tier.featured ? ' featured' : ''}`}>
                  {tier.featured && <div className="pricing-badge">empfohlen</div>}
                  <div className="pricing-name">{tier.name}</div>
                  <div className="pricing-price">
                    <span className="pricing-price-big">{tier.price}</span>
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
