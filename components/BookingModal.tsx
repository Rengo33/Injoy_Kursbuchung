'use client'

import { useEffect, useState } from 'react'
import type { Kurs } from '@/lib/kurs-service'
import { berechneTargetZeitpunkt } from '@/lib/kurs-service'
import { useCredits, consumeDemoCredit, refreshCredits } from '@/lib/use-credits'
import { useProfile } from '@/lib/use-profile'
import { useEscape, onOverlayClick } from '@/lib/use-modal-dismiss'
import { formatBerlinDateTime } from '@/lib/datum'
import { PricingModal } from './PricingModal'

interface Props {
  kurs: Kurs
  autoBook: boolean
  istWarteliste: boolean
  onClose: () => void
  onSuccess: () => void
}

export function BookingModal({ kurs, autoBook, istWarteliste, onClose, onSuccess }: Props) {
  const { credits, isPaidPreview } = useCredits()
  const { profile, setProfile } = useProfile()
  const [formData, setFormData] = useState({
    vorname: profile?.vorname ?? '',
    nachname: profile?.nachname ?? '',
    email: profile?.email ?? '',
    telefon: profile?.telefon ?? '',
    notiz: '',
  })
  const [userEdited, setUserEdited] = useState(false)
  const [status, setStatus] = useState<{ type: 'erfolg' | 'fehler'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)

  useEffect(() => {
    if (userEdited || !profile) return
    setFormData(f => ({
      vorname: f.vorname || profile.vorname,
      nachname: f.nachname || profile.nachname,
      email: f.email || profile.email,
      telefon: f.telefon || (profile.telefon ?? ''),
      notiz: f.notiz,
    }))
  }, [profile, userEdited])

  useEscape(onClose)

  const target = autoBook ? berechneTargetZeitpunkt(kurs.course_date) : null
  const targetInZukunft = target && target > new Date()

  const kostet = autoBook && credits && !credits.freeMode
  const keineGutschrift = kostet && credits && credits.credits <= 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (keineGutschrift) {
      setPricingOpen(true)
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const response = await fetch('/api/buchen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: kurs.course_id,
          course_date: kurs.course_date,
          course_name: kurs.name,
          course_wochentag: kurs.wochentag,
          course_uhrzeit: kurs.uhrzeit,
          course_trainer: kurs.trainer,
          course_raum: kurs.raum,
          autoBook,
          ...formData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (autoBook && isPaidPreview) {
          consumeDemoCredit()
        }
        // Profil merken für nächste Buchung (falls eingeloggt)
        if (profile) {
          try {
            await setProfile({
              vorname: formData.vorname,
              nachname: formData.nachname,
              telefon: formData.telefon,
            })
          } catch {}
        }
        // Credits im UI neu laden (nach Auto-Book wurde ggf. ein Credit abgezogen)
        refreshCredits()
        setStatus({ type: 'erfolg', message: data.message })
        const delay = data.scheduled ? 4000 : 1500
        setTimeout(() => { onSuccess() }, delay)
      } else {
        setStatus({ type: 'fehler', message: data.message || data.error || 'Buchung fehlgeschlagen' })
      }
    } catch (err) {
      setStatus({ type: 'fehler', message: 'Netzwerkfehler' })
    } finally {
      setLoading(false)
    }
  }

  const titel = autoBook ? <>Auto-<em>Book</em></> : <>Kurs <em>buchen</em></>
  const submitLabel = loading
    ? 'Wird gebucht...'
    : keineGutschrift ? 'Credits kaufen'
    : istWarteliste ? 'Auf Warteliste setzen'
    : autoBook ? 'Auto-Book aktivieren'
    : 'Jetzt buchen'

  return (
    <>
      <div className="modal-overlay" onClick={onOverlayClick(onClose)}>
        <div className="modal">
          <div className="modal-header">
            <h2>{titel}</h2>
          </div>

          <div className="modal-kurs-info">
            <strong>{kurs.name}</strong>
            <p>{kurs.wochentag}, {kurs.datum} um {kurs.uhrzeit}</p>
            {autoBook && targetInZukunft && target && (
              <p className="info-geplant">
                Wird automatisch gebucht am <b>{target.toLocaleString('de-DE')}</b>
              </p>
            )}
            {kostet && !keineGutschrift && (
              <p className="info-credit">
                <span>Kostet <b>1 Credit</b></span>
                <span className="info-credit-rest">verbleibend: {credits?.credits ?? 0}</span>
              </p>
            )}
            {keineGutschrift && (
              <p className="warnung">
                Keine Credits mehr. Lade welche nach, um Auto-Book zu nutzen.
              </p>
            )}
            {istWarteliste && !keineGutschrift && (
              <p className="warnung">Der Kurs ist voll — du kommst auf die Warteliste.</p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="vorname">Vorname *</label>
                  <input
                    id="vorname" type="text" required
                    placeholder="Dein Vorname"
                    value={formData.vorname}
                    disabled={!!keineGutschrift}
                    onChange={e => { setUserEdited(true); setFormData(f => ({ ...f, vorname: e.target.value })) }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="nachname">Nachname *</label>
                  <input
                    id="nachname" type="text" required
                    placeholder="Dein Nachname"
                    value={formData.nachname}
                    disabled={!!keineGutschrift}
                    onChange={e => { setUserEdited(true); setFormData(f => ({ ...f, nachname: e.target.value })) }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">E-Mail *</label>
                <input
                  id="email" type="email" required
                  placeholder="deine@email.de"
                  value={formData.email}
                  disabled={!!keineGutschrift}
                  onChange={e => { setUserEdited(true); setFormData(f => ({ ...f, email: e.target.value })) }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefon">Telefon</label>
                <input
                  id="telefon" type="tel" placeholder="Optional"
                  value={formData.telefon}
                  disabled={!!keineGutschrift}
                  onChange={e => { setUserEdited(true); setFormData(f => ({ ...f, telefon: e.target.value })) }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="notiz">Notiz</label>
                <input
                  id="notiz" type="text" placeholder="Optional"
                  value={formData.notiz}
                  disabled={!!keineGutschrift}
                  onChange={e => { setUserEdited(true); setFormData(f => ({ ...f, notiz: e.target.value })) }}
                />
              </div>

              {status && (
                <div className={`nachricht ${status.type}`}>
                  {status.message}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn secondary" onClick={onClose}>
                Abbrechen
              </button>
              <button type="submit" className="btn book" disabled={loading}>
                {submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>

      {pricingOpen && <PricingModal onClose={() => setPricingOpen(false)} />}
    </>
  )
}
