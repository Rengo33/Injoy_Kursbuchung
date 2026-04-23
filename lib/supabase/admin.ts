import { createClient } from '@supabase/supabase-js'
import { CONFIG } from '../config'

/**
 * Service-Role-Client — umgeht RLS. NIE im Browser oder in Client-Components.
 */
export function supabaseAdmin() {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase admin credentials missing')
  }
  return createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
