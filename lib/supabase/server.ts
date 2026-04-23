import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { CONFIG } from '../config'

export function supabaseServer() {
  const cookieStore = cookies()
  return createServerClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set({ name, value, ...options })
            }
          } catch {
            // Aus Server Components dürfen Cookies nicht gesetzt werden —
            // das erledigt dann die Middleware beim nächsten Request.
          }
        },
      },
    }
  )
}
