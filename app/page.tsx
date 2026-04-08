'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Kurs, berechneTargetZeitpunkt } from '@/lib/kurs-service'

interface BuchungsModal {
  isOpen: boolean
  kurs: Kurs | null
  istWarteliste: boolean
}

interface DatumEintrag {
  datumStr: string
  wochentagKurz: string
  tagMonat: string
  istHeute: boolean
}

const WOCHENTAGE_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function erzeugeDatumLeiste(anzahlTage: number = 14): DatumEintrag[] {
  const heute = new Date()
  const eintraege: DatumEintrag[] = []

  for (let i = 0; i < anzahlTage; i++) {
    const d = new Date(heute)
    d.setDate(heute.getDate() + i)

    eintraege.push({
      datumStr: d.toLocaleDateString('de-DE'),
      wochentagKurz: WOCHENTAGE_KURZ[d.getDay()],
      tagMonat: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      istHeute: i === 0,
    })
  }

  return eintraege
}

export default function Home() {
  const [kurse, setKurse] = useState<Kurs[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const morgen = new Date()
    morgen.setDate(morgen.getDate() + 1)
    return morgen.toLocaleDateString('de-DE')
  })
  const [modal, setModal] = useState<BuchungsModal>({ isOpen: false, kurs: null, istWarteliste: false })
  const [formData, setFormData] = useState({
    vorname: '',
    nachname: '',
    email: '',
    telefon: '',
    notiz: '',
  })
  const [buchungStatus, setBuchungStatus] = useState<{ type: 'erfolg' | 'fehler'; message: string } | null>(null)
  const [buchungLoading, setBuchungLoading] = useState(false)

  const datumLeiste = useMemo(() => erzeugeDatumLeiste(), [])

  const kursAnzahlProDatum = useMemo(() => {
    const map = new Map<string, number>()
    kurse.forEach(k => {
      map.set(k.datum, (map.get(k.datum) || 0) + 1)
    })
    return map
  }, [kurse])

  const gefilterteKurse = useMemo(
    () => selectedDate === null ? kurse : kurse.filter(k => k.datum === selectedDate),
    [kurse, selectedDate]
  )

  const ladeKurse = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/kurse?tage=14&start=0')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Fehler beim Laden')
      }

      setKurse(data.kurse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    ladeKurse()
  }, [ladeKurse])

  const gruppiereKurse = () => {
    const gruppiert: Record<string, Kurs[]> = {}

    gefilterteKurse.forEach(kurs => {
      const key = `${kurs.wochentag}, ${kurs.datum}`
      if (!gruppiert[key]) {
        gruppiert[key] = []
      }
      gruppiert[key].push(kurs)
    })

    return gruppiert
  }

  const oeffneBuchung = (kurs: Kurs) => {
    setModal({
      isOpen: true,
      kurs,
      istWarteliste: kurs.verfuegbar <= 0,
    })
    setBuchungStatus(null)
  }

  const schliesseBuchung = () => {
    setModal({ isOpen: false, kurs: null, istWarteliste: false })
    setFormData({ vorname: '', nachname: '', email: '', telefon: '', notiz: '' })
    setBuchungStatus(null)
  }

  const handleBuchung = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modal.kurs) return
    
    setBuchungLoading(true)
    setBuchungStatus(null)
    
    try {
      const response = await fetch('/api/buchen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: modal.kurs.course_id,
          course_date: modal.kurs.course_date,
          ...formData,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setBuchungStatus({ type: 'erfolg', message: data.message })
        // Wenn geplant, lassen wir das Modal 5 Sekunden offen, damit man die Zeit lesen kann
        const delay = data.scheduled ? 5000 : 2000
        setTimeout(() => {
          schliesseBuchung()
          ladeKurse()
        }, delay)
      } else {
        setBuchungStatus({ type: 'fehler', message: data.message || data.error })
      }
    } catch (err) {
      setBuchungStatus({ type: 'fehler', message: 'Netzwerkfehler' })
    } finally {
      setBuchungLoading(false)
    }
  }

  const gruppierteKurse = gruppiereKurse()

  return (
    <div className="container">
      <header>
        <h1>INJOY Kursplan</h1>
        <p>Finde und buche deinen nächsten Kurs</p>
      </header>

      <div className="datum-leiste-container">
        <div className="datum-leiste">
          <button
            className={`datum-pill ${selectedDate === null ? 'aktiv' : ''}`}
            onClick={() => setSelectedDate(null)}
          >
            <span className="datum-pill-tag">Alle</span>
            <span className="datum-pill-datum">{kurse.length}</span>
          </button>

          {datumLeiste.map(eintrag => {
            const anzahl = kursAnzahlProDatum.get(eintrag.datumStr) || 0
            const hatKurse = anzahl > 0
            const istAktiv = selectedDate === eintrag.datumStr

            return (
              <button
                key={eintrag.datumStr}
                className={[
                  'datum-pill',
                  istAktiv ? 'aktiv' : '',
                  !hatKurse ? 'leer' : '',
                  eintrag.istHeute ? 'heute' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setSelectedDate(eintrag.datumStr)}
              >
                <span className="datum-pill-tag">{eintrag.wochentagKurz}</span>
                <span className="datum-pill-datum">{eintrag.tagMonat}</span>
                {hatKurse && <span className="datum-pill-anzahl">{anzahl}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="kurse-section">
        <div className="kurse-header">
          <h2>Verfügbare Kurse</h2>
          <span className="badge">{gefilterteKurse.length}</span>
        </div>
        
        <div className="kurse-liste">
          {loading ? (
            <div className="status loading">
              <div className="spinner"></div>
              <p>Kurse werden geladen...</p>
            </div>
          ) : error ? (
            <div className="status error">
              <p>Fehler: {error}</p>
            </div>
          ) : kurse.length === 0 ? (
            <div className="status">
              <p>Keine Kurse im gewählten Zeitraum gefunden</p>
            </div>
          ) : gefilterteKurse.length === 0 ? (
            <div className="status">
              <p>Keine Kurse an diesem Tag</p>
            </div>
          ) : (
            Object.entries(gruppierteKurse).map(([tag, kurseListe]) => (
              <div key={tag} className="tag-gruppe">
                <div className="tag-header">{tag}</div>
                {kurseListe.map(kurs => (
                  <div key={`${kurs.course_id}-${kurs.course_date}`} className="kurs-karte">
                    <div className="kurs-zeit">{kurs.uhrzeit}</div>
                    <div className="kurs-info">
                      <div className="kurs-name">{kurs.name}</div>
                      <div className="kurs-details">
                        {kurs.trainer && <span>Trainer: {kurs.trainer}</span>}
                        {kurs.raum && <span>Raum: {kurs.raum}</span>}
                      </div>
                    </div>
                    <div className="kurs-stats">
                      {kurs.kapazitaet > 0 && (
                        <div className={`kurs-plaetze ${kurs.verfuegbar <= 0 ? 'voll' : kurs.verfuegbar <= 3 ? 'wenig' : ''}`}>
                          {kurs.gebucht}/{kurs.kapazitaet} 
                          {kurs.verfuegbar <= 0 ? ' (voll)' : ` (${kurs.verfuegbar} frei)`}
                        </div>
                      )}
                      {kurs.warteliste > 0 && (
                        <div className="kurs-warteliste">{kurs.warteliste} auf Warteliste</div>
                      )}
                    </div>
                    <button 
                      className={`btn btn-buchen ${kurs.verfuegbar <= 0 ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => oeffneBuchung(kurs)}
                    >
                      {kurs.verfuegbar <= 0 ? 'Warteliste' : 'Buchen'}
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      <footer>
        <p>Mit Liebe erstellt</p>
      </footer>

      {/* Buchungs Modal */}
      {modal.isOpen && modal.kurs && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && schliesseBuchung()}>
          <div className="modal">
            <div className="modal-header">
              <h2>Kurs buchen</h2>
            </div>
            
            <div className="modal-kurs-info">
              <strong>{modal.kurs.name}</strong>
              <p>{modal.kurs.wochentag}, {modal.kurs.datum} um {modal.kurs.uhrzeit}</p>
              
              {(() => {
                const target = berechneTargetZeitpunkt(modal.kurs.course_date)
                const jetzt = new Date()
                if (target > jetzt) {
                  return (
                    <p className="info-geplant">
                      Automatisierte Buchung am: <strong>{target.toLocaleString('de-DE')}</strong>
                    </p>
                  )
                }
                return null
              })()}

              {modal.istWarteliste && (
                <p className="warnung">Dieser Kurs ist voll – du wirst auf die Warteliste gesetzt</p>
              )}
            </div>
            
            <form onSubmit={handleBuchung}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="vorname">Vorname *</label>
                    <input
                      type="text"
                      id="vorname"
                      required
                      placeholder="Dein Vorname"
                      value={formData.vorname}
                      onChange={e => setFormData(f => ({ ...f, vorname: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="nachname">Nachname *</label>
                    <input
                      type="text"
                      id="nachname"
                      required
                      placeholder="Dein Nachname"
                      value={formData.nachname}
                      onChange={e => setFormData(f => ({ ...f, nachname: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">E-Mail *</label>
                  <input
                    type="email"
                    id="email"
                    required
                    placeholder="deine@email.de"
                    value={formData.email}
                    onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="telefon">Telefon</label>
                  <input
                    type="tel"
                    id="telefon"
                    placeholder="Optional"
                    value={formData.telefon}
                    onChange={e => setFormData(f => ({ ...f, telefon: e.target.value }))}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="notiz">Notiz</label>
                  <input
                    type="text"
                    id="notiz"
                    placeholder="Optional"
                    value={formData.notiz}
                    onChange={e => setFormData(f => ({ ...f, notiz: e.target.value }))}
                  />
                </div>
                
                {buchungStatus && (
                  <div className={`nachricht ${buchungStatus.type}`}>
                    {buchungStatus.message}
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={schliesseBuchung}>
                  Abbrechen
                </button>
                <button 
                  type="submit" 
                  className={`btn ${modal.istWarteliste ? 'btn-warning' : 'btn-success'}`}
                  disabled={buchungLoading}
                >
                  {buchungLoading ? 'Wird gebucht...' : modal.istWarteliste ? 'Auf Warteliste' : 'Jetzt buchen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
