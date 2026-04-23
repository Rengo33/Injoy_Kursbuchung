'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabaseBrowser } from '@/lib/supabase/client'

interface AuthContextValue {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

/**
 * Zentraler Auth-State für die gesamte App.
 * Nur EINE Instanz darf `supabase.auth.getUser()` + `onAuthStateChange` betreiben,
 * sonst streiten sich die Supabase-Browser-Clients um den Navigator-Lock
 * ("Lock was released because another request stole it").
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = supabaseBrowser()

    // onAuthStateChange feuert INITIAL_SESSION direkt beim Subscribe mit dem
    // aktuellen Session-State — kein separater getUser() nötig.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
