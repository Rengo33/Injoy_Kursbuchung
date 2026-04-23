import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
})

export type TierId = 'single' | 'bundle' | 'unlimited'

export interface TierDisplay {
  id: TierId
  name: string
  credits: number
  priceLabel: string
  priceNote?: string
  desc: string
  featured?: boolean
}

export interface TierConfig extends TierDisplay {
  priceId: string
}

// Einzige Source-of-Truth für Tier-Anzeige; in lib/stripe.ts damit Preise
// nicht zwischen Client und Server driften können.
export const TIER_DISPLAY: TierDisplay[] = [
  { id: 'single', name: 'Einzeln', credits: 1, priceLabel: '€ 1,99', desc: '1 Auto-Book' },
  { id: 'bundle', name: 'Bündel', credits: 10, priceLabel: '€ 14,90', priceNote: '· 25 % sparen', desc: '10 Auto-Bookings', featured: true },
  { id: 'unlimited', name: 'Unlimited', credits: 999, priceLabel: '€ 9,90', desc: '999 Credits · für Power-User' },
]

const PRICE_IDS: Record<TierId, string> = {
  single: process.env.STRIPE_PRICE_SINGLE ?? '',
  bundle: process.env.STRIPE_PRICE_BUNDLE ?? '',
  unlimited: process.env.STRIPE_PRICE_UNLIMITED ?? '',
}

export const TIERS: TierConfig[] = TIER_DISPLAY.map(t => ({ ...t, priceId: PRICE_IDS[t.id] }))

export function getTier(id: string): TierConfig | undefined {
  return TIERS.find(t => t.id === id)
}
