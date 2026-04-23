import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const errorParam = url.searchParams.get('error')
  const errorDescription = url.searchParams.get('error_description')
  const next = url.searchParams.get('next') ?? '/'

  if (errorParam) {
    const reason = errorDescription ?? errorParam
    console.error('[auth/callback] Supabase returned error:', reason)
    return NextResponse.redirect(
      new URL(`/auth/fehler?reason=${encodeURIComponent(reason)}`, url.origin)
    )
  }

  if (!code) {
    console.warn('[auth/callback] Kein code im Query — evtl. Redirect-URL nicht whitelisted in Supabase')
    return NextResponse.redirect(
      new URL('/auth/fehler?reason=no-code', url.origin)
    )
  }

  const supabase = supabaseServer()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession failed:', error.message)
    return NextResponse.redirect(
      new URL(`/auth/fehler?reason=${encodeURIComponent(error.message)}`, url.origin)
    )
  }

  console.log('[auth/callback] ✓ exchange ok, user:', data.user?.email, 'session:', !!data.session)
  return NextResponse.redirect(new URL(next, url.origin))
}
