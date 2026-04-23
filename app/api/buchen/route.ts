import { NextResponse } from 'next/server'
import type { User, SupabaseClient } from '@supabase/supabase-js'
import { bucheKurs, BuchungsData, berechneTargetZeitpunkt } from '@/lib/kurs-service'
import { consumeCredit, refundCredit } from '@/lib/credits'
import { supabaseServer } from '@/lib/supabase/server'
import { BookingStatus, type BookingStatus as Status } from '@/lib/booking-status'
import { formatBerlinDateTime } from '@/lib/datum'
import { CONFIG } from '@/lib/config'

interface Payload extends BuchungsData {
  autoBook?: boolean
  course_name?: string
  course_wochentag?: string
  course_uhrzeit?: string
  course_trainer?: string
  course_raum?: string
}

interface RecordArgs {
  supabase: SupabaseClient
  data: Payload
  user: User | null
  status: Status
  scheduledTarget?: Date | null
  message?: string | null
  qstashMessageId?: string | null
}

async function recordBooking(args: RecordArgs) {
  if (!args.user) return
  try {
    await args.supabase.from('bookings').insert({
      user_id: args.user.id,
      course_id: args.data.course_id,
      course_date: args.data.course_date,
      course_name: args.data.course_name ?? null,
      course_wochentag: args.data.course_wochentag ?? null,
      course_uhrzeit: args.data.course_uhrzeit ?? null,
      course_trainer: args.data.course_trainer ?? null,
      course_raum: args.data.course_raum ?? null,
      auto_book: !!args.data.autoBook,
      scheduled_target: args.scheduledTarget?.toISOString() ?? null,
      status: args.status,
      external_message: args.message ?? null,
      qstash_message_id: args.qstashMessageId ?? null,
    })
  } catch (e) {
    console.error('Konnte Buchung nicht in DB speichern:', e)
  }
}

async function scheduleViaQstash(data: Payload, diffMs: number): Promise<string | null> {
  const qstashUrl = `https://qstash.upstash.io/v2/publish/${CONFIG.APP_URL}/api/buchen/execute`
  const response = await fetch(qstashUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.QSTASH_TOKEN}`,
      'Content-Type': 'application/json',
      'Upstash-Delay': `${Math.floor(diffMs / 1000)}s`,
      'Upstash-Forward-x-scheduler-secret': CONFIG.SCHEDULER_SECRET,
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`QStash Error: ${response.status} - ${errorText}`)
  }
  const json = await response.json().catch(() => ({})) as { messageId?: string }
  return json.messageId ?? null
}

function validate(data: Payload): string | null {
  const required: Array<keyof Payload> = ['course_id', 'course_date', 'vorname', 'nachname', 'email']
  for (const field of required) {
    if (!data[field]) return `Feld "${String(field)}" ist erforderlich`
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) return 'Ungültige E-Mail-Adresse'
  return null
}

export async function POST(request: Request) {
  try {
    const data: Payload = await request.json()

    const validationError = validate(data)
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 })
    }

    const targetZeit = berechneTargetZeitpunkt(data.course_date)
    const diffMs = targetZeit.getTime() - Date.now()
    const sollGeplantWerden = data.autoBook === true && diffMs > 5000

    const supabase = supabaseServer()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    const userId = user?.id ?? null

    if (sollGeplantWerden) {
      const check = await consumeCredit(userId, `auto_book:${data.course_id}`, data.course_id)
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

      try {
        const qstashMessageId = await scheduleViaQstash(data, diffMs)
        const message = `Auto-Book aktiv: Die Buchung erfolgt am ${formatBerlinDateTime(targetZeit)}.`
        await recordBooking({
          supabase, data, user,
          status: BookingStatus.Scheduled,
          scheduledTarget: targetZeit,
          message,
          qstashMessageId,
        })
        return NextResponse.json({
          success: true,
          message,
          scheduled: true,
          targetTime: targetZeit.toISOString(),
        })
      } catch (err) {
        await refundCredit(userId, `auto_book_failed:${data.course_id}`)
        throw err
      }
    }

    const result = await bucheKurs(data)
    await recordBooking({
      supabase, data, user,
      status: result.success ? BookingStatus.Confirmed : BookingStatus.Failed,
      message: result.message,
    })

    if (data.autoBook && result.success) {
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
