import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
})

export interface TierConfig {
  id: 'single' | 'bundle' | 'unlimited'
  name: string
  credits: number
  priceId: string
  priceLabel: string
  priceNote?: string
  desc: string
  featured?: boolean
}

export const TIERS: TierConfig[] = [
  {
    id: 'single',
    name: 'Einzeln',
    credits: 1,
    priceId: process.env.STRIPE_PRICE_SINGLE ?? '',
    priceLabel: '€ 1,99',
    desc: '1 Auto-Book',
  },
  {
    id: 'bundle',
    name: 'Bündel',
    credits: 10,
    priceId: process.env.STRIPE_PRICE_BUNDLE ?? '',
    priceLabel: '€ 14,90',
    priceNote: '· 25 % sparen',
    desc: '10 Auto-Bookings',
    featured: true,
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    credits: 999,
    priceId: process.env.STRIPE_PRICE_UNLIMITED ?? '',
    priceLabel: '€ 9,90',
    desc: '999 Credits · für Power-User',
  },
]

export function getTier(id: string): TierConfig | undefined {
  return TIERS.find(t => t.id === id)
}
