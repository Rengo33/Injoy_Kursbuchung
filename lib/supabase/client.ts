'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CONFIG } from '../config'

let cached: SupabaseClient | undefined

/**
 * Nur eine Instanz pro Tab — sonst streiten sich mehrere GoTrueClients
 * um den Auth-Lock ("lock was released because another request stole it").
 */
export function supabaseBrowser(): SupabaseClient {
  if (!cached) {
    cached = createBrowserClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)
  }
  return cached
}
