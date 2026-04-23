// Reine Daten — KEIN Stripe-SDK. Darf von Client-Components importiert werden.
import { CONFIG } from './config'

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

export const TIER_DISPLAY: TierDisplay[] = [
  { id: 'single', name: 'Einzeln', credits: 1, priceLabel: '€ 1,99', desc: '1 Auto-Book' },
  { id: 'bundle', name: 'Bündel', credits: 10, priceLabel: '€ 14,90', priceNote: '· 25 % sparen', desc: '10 Auto-Bookings', featured: true },
  { id: 'unlimited', name: 'Unlimited', credits: 999, priceLabel: '€ 9,90', desc: '999 Credits · für Power-User' },
]

const PRICE_IDS: Record<TierId, string> = {
  single: CONFIG.STRIPE_PRICE_SINGLE,
  bundle: CONFIG.STRIPE_PRICE_BUNDLE,
  unlimited: CONFIG.STRIPE_PRICE_UNLIMITED,
}

export const TIERS: TierConfig[] = TIER_DISPLAY.map(t => ({ ...t, priceId: PRICE_IDS[t.id] }))

export function getTier(id: string): TierConfig | undefined {
  return TIERS.find(t => t.id === id)
}
