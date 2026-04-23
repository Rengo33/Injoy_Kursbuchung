'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Kurs } from '@/lib/kurs-service'
import { kategorieFuerKurs, type Kategorie } from '@/lib/kategorien'
import { useCredits } from '@/lib/use-credits'
import { formatDatum, parseDatum, kwNummer, monatName } from '@/lib/datum'
import { Sidebar } from '@/components/Sidebar'
import { FilterChips } from '@/components/FilterChips'
import { CourseCard } from '@/components/CourseCard'
import { BookingModal } from '@/components/BookingModal'

const WOCHENTAGE_LANG = [
  'Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
  'Donnerstag', 'Freitag', 'Samstag',
]

interface ModalState {
  kurs: Kurs
  autoBook: boolean
  istWarteliste: boolean
}

export default function Home() {
  const [kurse, setKurse] = useState<Kurs[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { credits } = useCredits()
  const [kategorie, setKategorie] = useState<Kategorie>('alle')

  const heute = useMemo(() => new Date(), [])
  const morgen = useMemo(() => {
    const m = new Date()
    m.setDate(m.getDate() + 1)
    return m
  }, [])

  const [selectedDatum, setSelectedDatum] = useState<string>(() => formatDatum(morgen))
  const [viewYear, setViewYear] = useState<number>(heute.getFullYear())
  const [viewMonth, setViewMonth] = useState<number>(heute.getMonth())
  const [modal, setModal] = useState<ModalState | null>(null)

  const ladeKurse = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/kurse?tage=14&start=0')
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Fehler beim Laden')
      setKurse(data.kurse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { ladeKurse() }, [ladeKurse])

  const kursAnzahlProDatum = useMemo(() => {
    const map = new Map<string, number>()
    kurse.forEach(k => map.set(k.datum, (map.get(k.datum) || 0) + 1))
    return map
  }, [kurse])

  const tagesKurse = useMemo(() => {
    const nachDatum = kurse.filter(k => k.datum === selectedDatum)
    if (kategorie === 'alle') return nachDatum
    return nachDatum.filter(k => kategorieFuerKurs(k.name) === kategorie)
  }, [kurse, selectedDatum, kategorie])

  const tightCount = useMemo(
    () => tagesKurse.filter(k => k.verfuegbar > 0 && k.verfuegbar <= 3).length,
    [tagesKurse]
  )

  const selectedDate = useMemo(() => parseDatum(selectedDatum), [selectedDatum])
  const wochentag = selectedDate ? WOCHENTAGE_LANG[selectedDate.getDay()] : ''
  const tagTitel = selectedDate
    ? `${selectedDate.getDate()}. ${monatName(selectedDate.getMonth())}`
    : ''
  const kw = selectedDate ? kwNummer(selectedDate) : null

  const prevMonat = () => {
    const d = new Date(viewYear, viewMonth - 1, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }
  const nextMonat = () => {
    const d = new Date(viewYear, viewMonth + 1, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  const handleBook = (kurs: Kurs, autoBook: boolean) => {
    setModal({ kurs, autoBook, istWarteliste: kurs.verfuegbar <= 0 })
  }

  const closeModal = () => setModal(null)
  const onSuccess = () => { setModal(null); ladeKurse() }

  return (
    <div className="app">
      <Sidebar
        viewYear={viewYear}
        viewMonth={viewMonth}
        selectedDatum={selectedDatum}
        courseCountsByDatum={kursAnzahlProDatum}
        onSelect={setSelectedDatum}
        onPrev={prevMonat}
        onNext={nextMonat}
      />

      <main className="main">
        <div className="main-head">
          <div className="day-header">
            <div className="day-header-title">
              {wochentag}, <em>{tagTitel}</em>
              <small>{kw ? `Kalenderwoche ${kw}` : ''}</small>
            </div>
            <div className="day-summary">
              <span className="chip">
                <span className="swatch" /> <b>{tagesKurse.length}</b>&nbsp;Kurse
              </span>
              {tightCount > 0 && (
                <span className="chip warn">
                  <span className="swatch" /> <b>{tightCount}</b>&nbsp;fast voll
                </span>
              )}
              {credits && !credits.freeMode && (
                <span className="chip"><b>{credits.credits}</b>&nbsp;Credits verfügbar</span>
              )}
            </div>
          </div>

          <FilterChips selected={kategorie} onSelect={setKategorie} />
        </div>

        <div className="main-scroll">
          {loading ? (
            <div className="status">
              <div className="spinner" />
              <p>Kurse werden geladen...</p>
            </div>
          ) : error ? (
            <div className="status error"><p>Fehler: {error}</p></div>
          ) : tagesKurse.length === 0 ? (
            <div className="status">
              <p>Keine Kurse an diesem Tag{kategorie !== 'alle' ? ' in dieser Kategorie' : ''}.</p>
            </div>
          ) : (
            <div className="courses">
              {tagesKurse.map(kurs => (
                <CourseCard
                  key={`${kurs.course_id}-${kurs.course_date}`}
                  kurs={kurs}
                  onBook={handleBook}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {modal && (
        <BookingModal
          kurs={modal.kurs}
          autoBook={modal.autoBook}
          istWarteliste={modal.istWarteliste}
          onClose={closeModal}
          onSuccess={onSuccess}
        />
      )}
    </div>
  )
}
