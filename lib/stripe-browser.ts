'use client'

import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { CONFIG } from './config'

let cached: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> {
  if (!cached) cached = loadStripe(CONFIG.STRIPE_PUBLISHABLE_KEY)
  return cached
}
