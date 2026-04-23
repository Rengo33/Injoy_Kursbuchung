import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth-helpers'

const BOOKING_COLUMNS = [
  'id', 'course_id', 'course_date',
  'course_name', 'course_wochentag', 'course_uhrzeit', 'course_trainer', 'course_raum',
  'auto_book', 'scheduled_target', 'qstash_message_id',
  'status', 'external_message', 'created_at',
].join(',')

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return NextResponse.json({ bookings: [], authenticated: false })

  const { data, error } = await auth.supabase
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .order('course_date', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ bookings: [], authenticated: true, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bookings: data ?? [], authenticated: true })
}
