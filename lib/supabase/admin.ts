import { createClient } from '@supabase/supabase-js'

/**
 * Admin-Client mit Service-Role-Key — nur in Server-Routes (Webhooks,
 * geschützte API-Handlers) verwenden. NIE im Browser oder in Client-Components.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase admin credentials missing')
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
