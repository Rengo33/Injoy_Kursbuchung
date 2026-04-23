import { NextResponse } from 'next/server'
import { bucheKurs, BuchungsData, berechneTargetZeitpunkt } from '@/lib/kurs-service'
import { consumeCredit, refundCredit } from '@/lib/credits'
import { supabaseServer } from '@/lib/supabase/server'

interface Payload extends BuchungsData {
  autoBook?: boolean
  course_name?: string
  course_wochentag?: string
  course_uhrzeit?: string
  course_trainer?: string
  course_raum?: string
}

async function recordBooking(
  data: Payload,
  status: 'scheduled' | 'confirmed' | 'failed' | 'waitlist',
  scheduledTarget: Date | null,
  message: string | null,
  qstashMessageId: string | null = null
) {
  try {
    const supabase = supabaseServer()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return
    await supabase.from('bookings').insert({
      user_id: userData.user.id,
      course_id: data.course_id,
      course_date: data.course_date,
      course_name: data.course_name ?? null,
      course_wochentag: data.course_wochentag ?? null,
      course_uhrzeit: data.course_uhrzeit ?? null,
      course_trainer: data.course_trainer ?? null,
      course_raum: data.course_raum ?? null,
      auto_book: !!data.autoBook,
      scheduled_target: scheduledTarget?.toISOString() ?? null,
      status,
      external_message: message,
      qstash_message_id: qstashMessageId,
    })
  } catch (e) {
    console.error('Konnte Buchung nicht in DB speichern:', e)
  }
}

export async function POST(request: Request) {
  try {
    const data: Payload = await request.json()

    const required = ['course_id', 'course_date', 'vorname', 'nachname', 'email']
    for (const field of required) {
      if (!data[field as keyof Payload]) {
        return NextResponse.json(
          { success: false, error: `Feld "${field}" ist erforderlich` },
          { status: 400 }
        )
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { success: false, error: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      )
    }

    const targetZeit = berechneTargetZeitpunkt(data.course_date)
    const jetzt = new Date()
    const diffMs = targetZeit.getTime() - jetzt.getTime()
    const soll_geplant_werden = data.autoBook === true && diffMs > 5000

    console.log('[api/buchen]', {
      course_id: data.course_id,
      autoBook: data.autoBook,
      diffMs,
      soll_geplant_werden,
    })

    let creditConsumed = false
    let creditUserId: string | null = null
    if (soll_geplant_werden) {
      const supabase = supabaseServer()
      const { data: userData } = await supabase.auth.getUser()
      creditUserId = userData.user?.id ?? null
      console.log('[api/buchen] consuming credit for user:', creditUserId)
      const check = await consumeCredit(creditUserId, `auto_book:${data.course_id}`, data.course_id)
      console.log('[api/buchen] credit check result:', check)
      if (!check.ok) {
        if (check.reason === 'auth_required') {
          return NextResponse.json(
            { success: false, message: 'Für Auto-Book bitte anmelden.' },
            { status: 401 }
          )
        }
        return NextResponse.json(
          { success: false, message: 'Nicht genügend Credits für Auto-Book.' },
          { status: 402 }
        )
      }
      creditConsumed = true
    }

    if (soll_geplant_werden) {
      try {
        const qstashUrl = `https://qstash.upstash.io/v2/publish/${process.env.APP_URL}/api/buchen/execute`

        const response = await fetch(qstashUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
            'Content-Type': 'application/json',
            'Upstash-Delay': `${Math.floor(diffMs / 1000)}s`,
            'Upstash-Forward-x-scheduler-secret': process.env.SCHEDULER_SECRET || '',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`QStash Error: ${response.status} - ${errorText}`)
        }

        const qstashResult = await response.json().catch(() => ({} as { messageId?: string }))
        const qstashMessageId = (qstashResult as { messageId?: string }).messageId ?? null

        const formattedTime = targetZeit.toLocaleString('de-DE', {
          timeZone: 'Europe/Berlin',
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        })

        const message = `Auto-Book aktiv: Die Buchung erfolgt am ${formattedTime}.`
        await recordBooking(data, 'scheduled', targetZeit, message, qstashMessageId)

        return NextResponse.json({
          success: true,
          message,
          scheduled: true,
          targetTime: targetZeit.toISOString(),
        })
      } catch (err) {
        if (creditConsumed) {
          await refundCredit(creditUserId, `auto_book_failed:${data.course_id}`)
        }
        throw err
      }
    }

    const result = await bucheKurs(data)
    await recordBooking(
      data,
      result.success ? 'confirmed' : 'failed',
      null,
      result.message
    )

    // Falls Auto-Book geklickt wurde aber der Kurs bereits freigegeben ist,
    // machen wir's transparent: direkte Buchung, kein Credit verbraucht.
    if (data.autoBook && !soll_geplant_werden && result.success) {
      return NextResponse.json({
        ...result,
        message: `${result.message} Kein Credit verbraucht — der Kurs ist bereits freigegeben.`,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
