import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { refundCredit } from '@/lib/credits'
import { BookingStatus } from '@/lib/booking-status'
import { requireUser } from '@/lib/auth-helpers'
import { CONFIG } from '@/lib/config'

async function cancelQstashMessage(messageId: string): Promise<boolean> {
  if (!CONFIG.QSTASH_TOKEN) {
    console.warn('QSTASH_TOKEN nicht gesetzt — kann Message nicht canceln')
    return false
  }
  try {
    const res = await fetch(`https://qstash.upstash.io/v2/messages/${messageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${CONFIG.QSTASH_TOKEN}` },
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

  // Conditional update — nur wenn status='scheduled'. Vermeidet SELECT + UPDATE
  // Race (TOCTOU) und liefert in einem Roundtrip.
  const admin = supabaseAdmin()
  const { data: updated, error: updateErr } = await admin
    .from('bookings')
    .update({
      status: BookingStatus.Cancelled,
      external_message: 'Vom Nutzer storniert',
    })
    .eq('id', params.id)
    .eq('user_id', auth.user.id)
    .eq('status', BookingStatus.Scheduled)
    .select('qstash_message_id, auto_book, course_id')
    .maybeSingle()

  if (updateErr) {
    return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
  }
  if (!updated) {
    return NextResponse.json(
      { success: false, error: 'Buchung nicht gefunden oder nicht mehr stornierbar' },
      { status: 404 }
    )
  }

  const qstashCancelled = updated.qstash_message_id
    ? await cancelQstashMessage(updated.qstash_message_id)
    : false

  let refunded = false
  if (updated.auto_book) {
    try {
      await refundCredit(auth.user.id, `auto_book_cancelled:${updated.course_id}`)
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
