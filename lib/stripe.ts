// Server-only — NICHT aus Client-Components importieren.
// Tier-Display-Daten liegen in lib/tiers.ts, damit die vom Client
// importierbar sind ohne den Stripe-SDK (und dessen Server-Secret) mitzuziehen.
import Stripe from 'stripe'
import { CONFIG } from './config'

export const stripe = new Stripe(CONFIG.STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
})

export { TIERS, TIER_DISPLAY, getTier } from './tiers'
export type { TierId, TierDisplay, TierConfig } from './tiers'
