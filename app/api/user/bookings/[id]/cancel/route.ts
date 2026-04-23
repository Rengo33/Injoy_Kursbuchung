import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { refundCredit } from '@/lib/credits'

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
    // QStash antwortet 202 bei Erfolg, 404 falls Message schon abgearbeitet
    if (res.ok) return true
    if (res.status === 404) {
      console.log(`QStash message ${messageId} nicht mehr da — vermutlich bereits ausgeführt`)
      return false
    }
    const text = await res.text().catch(() => '')
    console.error(`QStash cancel fehlgeschlagen: ${res.status} ${text}`)
    return false
  } catch (e) {
    console.error('QStash cancel error:', e)
    return false
  }
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseServer()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return NextResponse.json({ success: false, error: 'Nicht eingeloggt' }, { status: 401 })
  }

  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (fetchErr || !booking) {
    return NextResponse.json({ success: false, error: 'Buchung nicht gefunden' }, { status: 404 })
  }

  if (booking.status !== 'scheduled') {
    return NextResponse.json(
      {
        success: false,
        error: `Nur geplante Buchungen können storniert werden (aktuell: ${booking.status})`,
      },
      { status: 400 }
    )
  }

  // QStash-Message stornieren
  let qstashCancelled = false
  if (booking.qstash_message_id) {
    qstashCancelled = await cancelQstashMessage(booking.qstash_message_id)
  }

  // Status in DB setzen (service role weil RLS-update-Policy nur für User existiert)
  const admin = supabaseAdmin()
  const { error: updateErr } = await admin
    .from('bookings')
    .update({
      status: 'cancelled',
      external_message: qstashCancelled
        ? 'Vom Nutzer vor Ausführung storniert'
        : 'Storniert — QStash-Message war möglicherweise bereits in Ausführung',
    })
    .eq('id', booking.id)

  if (updateErr) {
    return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
  }

  // Credit zurückerstatten
  let refunded = false
  if (booking.auto_book) {
    try {
      await refundCredit(userData.user.id, `auto_book_cancelled:${booking.course_id}`)
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
