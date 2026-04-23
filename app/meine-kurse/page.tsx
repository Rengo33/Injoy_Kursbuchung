'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { SimpleShell } from '@/components/SimpleShell'
import { refreshCredits } from '@/lib/use-credits'

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

const STATUS_LABEL: Record<string, string> = {
  pending: 'offen',
  scheduled: 'geplant',
  confirmed: 'bestätigt',
  failed: 'fehlgeschlagen',
  cancelled: 'storniert',
  waitlist: 'Warteliste',
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
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
          <p style={{ marginTop: 14 }}>
            <Link href="/login" className="btn book" style={{ display: 'inline-flex' }}>Anmelden</Link>
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

  const geplant = bookings.filter(b => b.status === 'scheduled')
  const rest = bookings.filter(b => b.status !== 'scheduled')

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

      <Link href="/" className="back-link">← Zurück zum Kursplan</Link>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ marginBottom: 4 }}>{b.course_name ?? `Kurs #${b.course_id}`}</h3>
          <p style={{ fontSize: 14 }}>
            {b.course_wochentag && <>{b.course_wochentag}, </>}
            {formatDate(b.course_date)}
            {b.course_uhrzeit && <> · {b.course_uhrzeit}</>}
            {b.course_trainer && <> · {b.course_trainer}</>}
            {b.course_raum && <> · {b.course_raum}</>}
          </p>
          {b.auto_book && b.scheduled_target && b.status === 'scheduled' && (
            <p style={{ fontSize: 13, color: 'var(--sage-deep)', marginTop: 8 }}>
              Auto-Book am {new Date(b.scheduled_target).toLocaleString('de-DE')}
            </p>
          )}
          {b.external_message && (
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 8 }}>
              {b.external_message}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <span className={`status-chip status-${b.status}`}>
            {STATUS_LABEL[b.status] ?? b.status}
          </span>
          {onCancel && (
            <button
              className="btn danger"
              onClick={onCancel}
              disabled={cancelling}
              style={{ fontSize: 12, padding: '6px 14px' }}
            >
              {cancelling ? 'Storniere…' : 'Stornieren'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
