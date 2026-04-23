import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase/server'

/**
 * Debug-Endpoint — zeigt was der Server gerade über die Session weiß.
 * Nur lokal nutzen, für Produktion entfernen.
 */
export async function GET() {
  const supabase = supabaseServer()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  const { data: sessData } = await supabase.auth.getSession()

  const cookieNames = cookies().getAll().map(c => c.name)
  const sbCookies = cookieNames.filter(n => n.startsWith('sb-'))

  return NextResponse.json({
    serverThinks: {
      user: userData.user
        ? { id: userData.user.id, email: userData.user.email }
        : null,
      hasSession: !!sessData.session,
      expiresAt: sessData.session?.expires_at,
      userError: userErr?.message ?? null,
    },
    cookies: {
      all: cookieNames,
      supabaseRelated: sbCookies,
    },
  })
}
