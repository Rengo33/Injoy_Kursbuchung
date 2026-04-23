import { cookies } from 'next/headers'
import { CONFIG } from './config'

const ANON_COOKIE = 'injoy_anon_id'

export interface SessionUser {
  id: string
  email?: string
  name?: string
  anonymous: boolean
}

/**
 * Gibt den aktuellen User zurück.
 * FREE_MODE: jeder ist anonym — nur eine cookie-basierte ID für spätere Auswertung.
 * Produktiv (Phase 2): liest Supabase-Session aus.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = cookies()
  const anonId = store.get(ANON_COOKIE)?.value

  if (CONFIG.FREE_MODE) {
    return {
      id: anonId || 'anon',
      anonymous: true,
    }
  }

  // TODO Phase 2: Supabase-Session laden
  return null
}

/**
 * Server-side helper: setzt einen Anon-Cookie, wenn noch keiner existiert.
 * Wird von Layout/Server-Component beim ersten Besuch aufgerufen.
 */
export function ensureAnonCookie(): string {
  const store = cookies()
  const existing = store.get(ANON_COOKIE)?.value
  if (existing) return existing
  const fresh = crypto.randomUUID()
  store.set(ANON_COOKIE, fresh, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365 * 2,
  })
  return fresh
}
