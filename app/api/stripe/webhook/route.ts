import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { addCredits } from '@/lib/credits'
import { CONFIG } from '@/lib/config'
import type Stripe from 'stripe'

// Force Node runtime (nicht Edge) wegen der Stripe-Lib Crypto-Calls
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const webhookSecret = CONFIG.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET nicht gesetzt — Webhook-Events werden ignoriert')
    return NextResponse.json({ received: true, skipped: true })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const body = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Webhook signature failed:', msg)
    return NextResponse.json({ error: `Signature failed: ${msg}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.payment_status !== 'paid') break

        const userId = session.metadata?.user_id ?? session.client_reference_id
        const creditsRaw = session.metadata?.credits
        const tier = session.metadata?.tier

        if (!userId || !creditsRaw) {
          console.warn('checkout.session.completed ohne user_id/credits Metadata', session.id)
          break
        }

        const credits = parseInt(creditsRaw, 10)
        if (isNaN(credits) || credits < 1) {
          console.warn('Invalid credits in metadata:', creditsRaw)
          break
        }

        await addCredits(userId, credits, `stripe_purchase:${tier ?? 'unknown'}`, session.id)
        break
      }

      default:
        // Andere Events ignorieren (charge.succeeded etc. sind redundant)
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Webhook handler failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
