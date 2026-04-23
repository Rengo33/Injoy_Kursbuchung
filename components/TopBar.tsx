'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCredits } from '@/lib/use-credits'
import { useProfile } from '@/lib/use-profile'
import { ProfileModal } from './ProfileModal'

export function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { credits } = useCredits()
  const { isAuthed, initials, profile, hasProfile, loading } = useProfile()
  const [profileOpen, setProfileOpen] = useState(false)

  const empty = credits && !credits.freeMode && credits.credits === 0
  const showAnon = !loading && !isAuthed

  const handleClick = () => {
    if (isAuthed) {
      setProfileOpen(true)
    } else {
      router.push('/login')
    }
  }

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-dot" />
          injoy <em>· kursplan</em>
        </Link>
        <nav className="primary">
          <Link href="/" className={pathname === '/' ? 'active' : ''}>Kursplan</Link>
          <Link href="/meine-kurse" className={pathname === '/meine-kurse' ? 'active' : ''}>Meine Kurse</Link>
        </nav>
        <div className="top-actions">
          <button
            className={`user-pill${credits?.freeMode ? ' free' : ''}${empty ? ' empty' : ''}${showAnon ? ' anon' : ''}`}
            title={profile?.email ? `${profile.vorname} ${profile.nachname}`.trim() || profile.email : 'Anmelden'}
            aria-label="Konto & Credits"
            onClick={handleClick}
          >
            <span className="user-pill-dot" />
            <span className="user-pill-text">
              {credits === null ? (
                <>&nbsp;</>
              ) : credits.freeMode ? (
                <><b>Beta</b>&nbsp;· kostenlos</>
              ) : (
                <><b>{credits.credits}</b>&nbsp;{credits.credits === 1 ? 'Credit' : 'Credits'}</>
              )}
            </span>
            <span className="user-pill-initials">
              {showAnon ? '?' : hasProfile ? initials : (profile?.email?.[0]?.toUpperCase() ?? '?')}
            </span>
          </button>
        </div>
      </header>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  )
}
