import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return NextResponse.json({
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
