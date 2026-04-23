'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useProfile } from '@/lib/use-profile'

interface Props {
  onClose: () => void
}

export function ProfileModal({ onClose }: Props) {
  const { profile, setProfile, signOut, isAuthed, hasProfile, loading } = useProfile()
  const [form, setForm] = useState({
    vorname: profile?.vorname ?? '',
    nachname: profile?.nachname ?? '',
    telefon: profile?.telefon ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        vorname: profile.vorname,
        nachname: profile.nachname,
        telefon: profile.telefon ?? '',
      })
    }
  }, [profile])

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onClose])

  // Nicht eingeloggt → zum Login senden
  if (!loading && !isAuthed) {
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <div className="modal-header">
            <h2>Willkommen 👋</h2>
            <p className="pricing-sub">
              Mit einem Login hast du dein Profil und deine Buchungen auf jedem Gerät dabei.
              Keine Passwörter — nur ein Link per Mail.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>Später</button>
            <Link href="/login" className="btn book" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
              Jetzt anmelden
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await setProfile(form)
    setSaving(false)
    setSaved(true)
    setTimeout(onClose, 900)
  }

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{hasProfile ? <>Dein <em>Profil</em></> : <>Letzte <em>Schritte</em></>}</h2>
          {!hasProfile && (
            <p className="pricing-sub">
              Trag einmal Vor- und Nachnamen ein — dann sind alle Buchungsformulare ab jetzt vorausgefüllt.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ paddingTop: 8 }}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="p-vorname">Vorname *</label>
                <input
                  id="p-vorname" type="text" required autoFocus
                  placeholder="Dein Vorname"
                  value={form.vorname}
                  onChange={e => setForm(f => ({ ...f, vorname: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="p-nachname">Nachname *</label>
                <input
                  id="p-nachname" type="text" required
                  placeholder="Dein Nachname"
                  value={form.nachname}
                  onChange={e => setForm(f => ({ ...f, nachname: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>E-Mail</label>
              <input type="email" value={profile?.email ?? ''} disabled readOnly />
            </div>

            <div className="form-group">
              <label htmlFor="p-telefon">Telefon</label>
              <input
                id="p-telefon" type="tel" placeholder="Optional"
                value={form.telefon}
                onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
              />
            </div>

            {saved && <div className="nachricht erfolg">Gespeichert.</div>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn danger" onClick={handleSignOut}>
              Abmelden
            </button>
            <button type="submit" className="btn book" disabled={saving}>
              {saving ? 'Speichert…' : hasProfile ? 'Speichern' : 'Los geht\'s'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
