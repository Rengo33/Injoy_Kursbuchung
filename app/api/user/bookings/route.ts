import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET() {
  const supabase = supabaseServer()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return NextResponse.json({ bookings: [], authenticated: false })
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('course_date', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ bookings: [], authenticated: true, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bookings: data ?? [], authenticated: true })
}
