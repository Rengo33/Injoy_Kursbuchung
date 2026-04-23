'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { SimpleShell } from '@/components/SimpleShell'
import { BackToCoursesLink } from '@/components/BackToCoursesLink'
import { refreshCredits } from '@/lib/use-credits'
import { labelFor, BookingStatus } from '@/lib/booking-status'
import { formatBerlinDateTime, formatBerlinDate } from '@/lib/datum'

interface Booking {
  id: string
  course_id: number
  course_date: string
  course_name: string | null
  course_wochentag: string | null
  course_uhrzeit: string | null
  course_trainer: string | null
  course_raum: string | null
  auto_book: boolean
  scheduled_target: string | null
  status: string
  external_message: string | null
  created_at: string
}

export default function MeineKurse() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const ladeBookings = useCallback(() => {
    setLoading(true)
    fetch('/api/user/bookings')
      .then(r => r.json())
      .then(data => {
        setAuthenticated(!!data.authenticated)
        setBookings(data.bookings ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { ladeBookings() }, [ladeBookings])

  const handleCancel = async (id: string) => {
    if (!confirm('Buchung wirklich stornieren?\n\nFalls Auto-Book: Credit wird zurückerstattet.')) return
    setCancellingId(id)
    try {
      const res = await fetch(`/api/user/bookings/${id}/cancel`, { method: 'POST' })
      const data = await res.json()
      if (!data.success) {
        alert(`Fehler: ${data.error ?? 'Unbekannt'}`)
      } else {
        refreshCredits()
        ladeBookings()
      }
    } catch (e) {
      alert(`Netzwerkfehler: ${e}`)
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) {
    return (
      <SimpleShell title={<>Meine <em>Kurse</em></>}>
        <div className="info-card"><p>Lade Buchungen…</p></div>
      </SimpleShell>
    )
  }

  if (!authenticated) {
    return (
      <SimpleShell title={<>Meine <em>Kurse</em></>}>
        <div className="info-card">
          <h3>Anmelden, um deine Kurse zu sehen</h3>
          <p>
            Sobald du eingeloggt bist, findest du hier alle deine Buchungen und geplanten Auto-Bookings
            auf einen Blick.
          </p>
          <p className="info-card-cta">
            <Link href="/login" className="btn book back-link-inline">Anmelden</Link>
          </p>
        </div>
      </SimpleShell>
    )
  }

  if (bookings.length === 0) {
    return (
      <SimpleShell title={<>Meine <em>Kurse</em></>}>
        <div className="info-card">
          <h3>Noch nichts gebucht</h3>
          <p>Gleich am <Link href="/">Kursplan</Link> einen Kurs wählen — jede Buchung taucht anschließend hier auf.</p>
        </div>
      </SimpleShell>
    )
  }

  const geplant = bookings.filter(b => b.status === BookingStatus.Scheduled)
  const rest = bookings.filter(b => b.status !== BookingStatus.Scheduled)

  return (
    <SimpleShell title={<>Meine <em>Kurse</em></>}>
      {geplant.length > 0 && (
        <>
          <h2 className="section-h2">Geplant</h2>
          {geplant.map(b => (
            <BookingCard
              key={b.id}
              b={b}
              cancelling={cancellingId === b.id}
              onCancel={() => handleCancel(b.id)}
            />
          ))}
        </>
      )}

      {rest.length > 0 && (
        <>
          <h2 className="section-h2">Historie</h2>
          {rest.map(b => (
            <BookingCard key={b.id} b={b} cancelling={false} onCancel={null} />
          ))}
        </>
      )}

      <BackToCoursesLink />
    </SimpleShell>
  )
}

function BookingCard({
  b,
  cancelling,
  onCancel,
}: {
  b: Booking
  cancelling: boolean
  onCancel: (() => void) | null
}) {
  return (
    <div className="info-card">
      <div className="booking-card-head">
        <div className="booking-card-main">
          <h3>{b.course_name ?? `Kurs #${b.course_id}`}</h3>
          <p className="booking-meta">
            {b.course_wochentag && <>{b.course_wochentag}, </>}
            {formatBerlinDate(b.course_date)}
            {b.course_uhrzeit && <> · {b.course_uhrzeit}</>}
            {b.course_trainer && <> · {b.course_trainer}</>}
            {b.course_raum && <> · {b.course_raum}</>}
          </p>
          {b.auto_book && b.scheduled_target && b.status === BookingStatus.Scheduled && (
            <p className="booking-card-auto">
              Auto-Book am {formatBerlinDateTime(b.scheduled_target)}
            </p>
          )}
          {b.external_message && (
            <p className="booking-card-ext">{b.external_message}</p>
          )}
        </div>
        <div className="booking-card-right">
          <span className={`status-chip status-${b.status}`}>{labelFor(b.status)}</span>
          {onCancel && (
            <button className="btn danger booking-cancel-btn" onClick={onCancel} disabled={cancelling}>
              {cancelling ? 'Storniere…' : 'Stornieren'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
