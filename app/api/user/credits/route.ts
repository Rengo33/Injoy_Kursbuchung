import { NextResponse } from 'next/server'
import { getCreditStatus } from '@/lib/credits'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET() {
  const supabase = supabaseServer()
  const { data } = await supabase.auth.getUser()
  const userId = data.user?.id ?? null
  const status = await getCreditStatus(userId)
  return NextResponse.json(status)
}
