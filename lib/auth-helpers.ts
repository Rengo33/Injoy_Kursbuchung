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
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Nicht eingeloggt' },
        { status: 401 }
      ),
    }
  }
  return { ok: true, user: data.user, supabase }
}
