import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { supabaseServer } from './supabase/server'

export type RequireUserResult =
  | { ok: true; user: User; supabase: ReturnType<typeof supabaseServer> }
  | { ok: false; response: NextResponse }

export async function requireUser(): Promise<RequireUserResult> {
  const supabase = supabaseServer()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    return { ok: false, response: errorResponse('Nicht eingeloggt', 401) }
  }
  return { ok: true, user: data.user, supabase }
}

export function errorResponse(message: string, status = 500): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status })
}
