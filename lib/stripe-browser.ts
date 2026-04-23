'use client'

import { loadStripe, type Stripe } from '@stripe/stripe-js'

let cached: Promise<Stripe | null> | null = null

/**
 * Singleton — loadStripe darf pro App nur einmal aufgerufen werden.
 */
export function getStripe(): Promise<Stripe | null> {
  if (!cached) {
    cached = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')
  }
  return cached
}
