'use client'

import type { Kurs } from '@/lib/kurs-service'
import { kategorieFuerKurs, KATEGORIE_LABEL } from '@/lib/kategorien'

interface Props {
  kurs: Kurs
  onBook: (kurs: Kurs, autoBook: boolean) => void
}

export function CourseCard({ kurs, onBook }: Props) {
  const voll = kurs.verfuegbar <= 0
  const knapp = !voll && kurs.verfuegbar <= 3
  const pct = kurs.kapazitaet > 0
    ? Math.min(100, Math.round((kurs.gebucht / kurs.kapazitaet) * 100))
    : 0

  const seatsClass = voll ? 'full' : knapp ? 'tight' : ''
  const seatsLabel = voll
    ? 'Ausgebucht'
    : knapp
    ? `Nur ${kurs.verfuegbar} frei`
    : 'Belegung'
  const seatsValue = `${kurs.gebucht} / ${kurs.kapazitaet}`

  const kat = kategorieFuerKurs(kurs.name)

  return (
    <div className="course">
      <div className="c-time">
        <span className="c-time-big">{kurs.uhrzeit}</span>
      </div>

      <div className="c-body">
        <div className="c-title">
          {kurs.name}
          {kat && <span className="c-tag">{KATEGORIE_LABEL[kat]}</span>}
        </div>
        <div className="c-meta">
          {kurs.trainer && <span>{kurs.trainer}</span>}
          {kurs.trainer && kurs.raum && <span className="dot" />}
          {kurs.raum && <span>{kurs.raum}</span>}
        </div>
      </div>

      <div className={`c-seats ${seatsClass}`}>
        <div className={`c-seat-row ${seatsClass}`}>
          <span>{seatsLabel}</span>
          <b>{seatsValue}</b>
        </div>
        <div className="c-progress" style={{ ['--p' as string]: `${pct}%` }} />
      </div>

      <div className="c-actions">
        {voll ? (
          <button className="btn wait" onClick={() => onBook(kurs, false)}>
            Warteliste
          </button>
        ) : (
          <button className="btn book" onClick={() => onBook(kurs, false)}>
            Buchen
          </button>
        )}
        <button
          className="btn auto"
          onClick={() => onBook(kurs, true)}
          title="Wird automatisch 1 Tag vor Kursbeginn gebucht"
        >
          Auto
        </button>
      </div>
    </div>
  )
}
