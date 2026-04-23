import { NextResponse } from 'next/server'
import { CONFIG } from '@/lib/config'
import { stripe, getTier } from '@/lib/stripe'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (CONFIG.FREE_MODE) {
    return NextResponse.json(
      { success: false, error: 'FREE_MODE aktiv — Checkout nicht verfügbar.' },
      { status: 503 }
    )
  }

  if (!CONFIG.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { success: false, error: 'Stripe nicht konfiguriert.' },
      { status: 500 }
    )
  }

  const supabase = supabaseServer()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return NextResponse.json(
      { success: false, error: 'Anmeldung erforderlich.' },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const tierId = body.tierId as string | undefined
  const tier = tierId ? getTier(tierId) : undefined
  if (!tier) {
    return NextResponse.json(
      { success: false, error: 'Ungültiges Paket.' },
      { status: 400 }
    )
  }
  if (!tier.priceId) {
    return NextResponse.json(
      { success: false, error: `Stripe Price-ID für "${tier.id}" fehlt. Setup-Script laufen lassen.` },
      { status: 500 }
    )
  }

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      mode: 'payment',
      line_items: [{ price: tier.priceId, quantity: 1 }],
      customer_email: userData.user.email ?? undefined,
      client_reference_id: userData.user.id,
      metadata: {
        app: 'injoy',
        tier: tier.id,
        credits: String(tier.credits),
        user_id: userData.user.id,
      },
      payment_intent_data: {
        metadata: {
          app: 'injoy',
          tier: tier.id,
          user_id: userData.user.id,
        },
      },
      redirect_on_completion: 'never',
      locale: 'de',
      allow_promotion_codes: true,
    })

    return NextResponse.json({
      success: true,
      clientSecret: session.client_secret,
      sessionId: session.id,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('stripe checkout create failed:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
