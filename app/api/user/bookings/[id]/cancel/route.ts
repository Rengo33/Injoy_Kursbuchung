import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { refundCredit } from '@/lib/credits'
import { BookingStatus } from '@/lib/booking-status'
import { requireUser } from '@/lib/auth-helpers'

async function cancelQstashMessage(messageId: string): Promise<boolean> {
  const token = process.env.QSTASH_TOKEN
  if (!token) {
    console.warn('QSTASH_TOKEN nicht gesetzt — kann Message nicht canceln')
    return false
  }
  try {
    const res = await fetch(`https://qstash.upstash.io/v2/messages/${messageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) return true
    if (res.status === 404) return false
    const text = await res.text().catch(() => '')
    console.error(`QStash cancel fehlgeschlagen: ${res.status} ${text}`)
    return false
  } catch (e) {
    console.error('QStash cancel error:', e)
    return false
  }
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { data: booking, error: fetchErr } = await auth.supabase
    .from('bookings')
    .select('id, user_id, qstash_message_id, auto_book, course_id, status')
    .eq('id', params.id)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (fetchErr || !booking) {
    return NextResponse.json({ success: false, error: 'Buchung nicht gefunden' }, { status: 404 })
  }

  if (booking.status !== BookingStatus.Scheduled) {
    return NextResponse.json(
      {
        success: false,
        error: `Nur geplante Buchungen können storniert werden (aktuell: ${booking.status})`,
      },
      { status: 400 }
    )
  }

  // RLS erlaubt User-Updates nicht wenn der DB-Trigger später Status-Transitions
  // erzwingt; wir nutzen daher admin. QStash-Cancel + DB-Update sind unabhängig.
  const admin = supabaseAdmin()
  const [qstashCancelled, { error: updateErr }] = await Promise.all([
    booking.qstash_message_id ? cancelQstashMessage(booking.qstash_message_id) : Promise.resolve(false),
    admin
      .from('bookings')
      .update({
        status: BookingStatus.Cancelled,
        external_message: 'Vom Nutzer storniert',
      })
      .eq('id', booking.id),
  ])

  if (updateErr) {
    return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
  }

  let refunded = false
  if (booking.auto_book) {
    try {
      await refundCredit(auth.user.id, `auto_book_cancelled:${booking.course_id}`)
      refunded = true
    } catch (e) {
      console.error('Refund fehlgeschlagen:', e)
    }
  }

  return NextResponse.json({
    success: true,
    qstashCancelled,
    refunded,
    message: refunded
      ? 'Buchung storniert. 1 Credit wurde zurückerstattet.'
      : 'Buchung storniert.',
  })
}
