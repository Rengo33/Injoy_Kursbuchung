'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabaseBrowser } from './supabase/client'
import { refreshCredits } from './use-credits'
import { useAuth } from '@/components/AuthProvider'

export interface Profile {
  vorname: string
  nachname: string
  email: string
  telefon?: string
}

export function getInitials(p: Profile | null): string {
  if (!p) return '?'
  const a = (p.vorname?.trim()?.[0] ?? '').toUpperCase()
  const b = (p.nachname?.trim()?.[0] ?? '').toUpperCase()
  return (a + b) || (p.email?.[0]?.toUpperCase() ?? '?')
}

export interface UseProfileResult {
  user: ReturnType<typeof useAuth>['user']
  profile: Profile | null
  loading: boolean
  setProfile: (p: Omit<Profile, 'email'>) => Promise<void>
  signOut: () => Promise<void>
  initials: string
  isAuthed: boolean
  hasProfile: boolean
}

export function useProfile(): UseProfileResult {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfileState] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setProfileState(null)
      setProfileLoading(false)
      return
    }

    let active = true
    const supabase = supabaseBrowser()

    supabase
      .from('profiles')
      .select('vorname, nachname, telefon')
      .eq('id', user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!active) return

        if (data) {
          setProfileState({
            vorname: data.vorname,
            nachname: data.nachname,
            email: user.email ?? '',
            telefon: data.telefon ?? undefined,
          })
          setProfileLoading(false)
          return
        }

        // Kein Profil vorhanden → aus user_metadata (vom Login) initialisieren
        const meta = (user.user_metadata ?? {}) as {
          vorname?: string
          nachname?: string
        }
        const vorname = meta.vorname?.trim() ?? ''
        const nachname = meta.nachname?.trim() ?? ''

        if (vorname || nachname) {
          await supabase.from('profiles').upsert({
            id: user.id,
            vorname,
            nachname,
            telefon: null,
          })
          setProfileState({
            vorname,
            nachname,
            email: user.email ?? '',
          })
        } else {
          setProfileState({
            vorname: '',
            nachname: '',
            email: user.email ?? '',
          })
        }
        setProfileLoading(false)
      })

    return () => { active = false }
  }, [user, authLoading])

  const setProfile = useCallback(async (p: Omit<Profile, 'email'>) => {
    if (!user) return
    const supabase = supabaseBrowser()
    await supabase.from('profiles').upsert({
      id: user.id,
      vorname: p.vorname,
      nachname: p.nachname,
      telefon: p.telefon ?? null,
    })
    setProfileState({
      vorname: p.vorname,
      nachname: p.nachname,
      email: user.email ?? '',
      telefon: p.telefon,
    })
  }, [user])

  const signOut = useCallback(async () => {
    const supabase = supabaseBrowser()
    await supabase.auth.signOut()
    setProfileState(null)
    refreshCredits()
  }, [])

  const hasProfile = !!profile && !!profile.vorname && !!profile.nachname

  return {
    user,
    profile,
    loading: authLoading || profileLoading,
    setProfile,
    signOut,
    initials: getInitials(profile),
    isAuthed: !!user,
    hasProfile,
  }
}
