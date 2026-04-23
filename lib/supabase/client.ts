'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | undefined

/**
 * Singleton-Browser-Client. WICHTIG: nur eine Instanz pro Tab erzeugen,
 * sonst streiten sich mehrere GoTrueClient-Instanzen um den Auth-Lock
 * ("Lock was released because another request stole it").
 */
export function supabaseBrowser(): SupabaseClient {
  if (!cached) {
    cached = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return cached
}
