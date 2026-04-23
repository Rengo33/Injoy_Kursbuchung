'use client'

import { useMemo } from 'react'

const DOW_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS_KURZ = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function mondayOf(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const jsDow = date.getDay()
  const offset = (jsDow + 6) % 7
  date.setDate(date.getDate() - offset)
  return date
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

function datumStr(d: Date): string {
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
}

function sameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

function kw(d: Date): number {
  const target = new Date(d.valueOf())
  const dayNr = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
}

interface Props {
  selectedDatum: string | null
  courseCountsByDatum: Map<string, number>
  onSelect: (datumStr: string) => void
}

export function WeekStrip({ selectedDatum, courseCountsByDatum, onSelect }: Props) {
  const today = useMemo(() => new Date(), [])

  const anchor = useMemo(() => {
    if (!selectedDatum) return today
    const [d, m, y] = selectedDatum.split('.').map(Number)
    return new Date(y, m - 1, d)
  }, [selectedDatum, today])

  const monday = useMemo(() => mondayOf(anchor), [anchor])
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
    [monday]
  )

  const prevWeek = () => {
    const next = addDays(monday, -7)
    onSelect(datumStr(next))
  }
  const nextWeek = () => {
    const next = addDays(monday, 7)
    onSelect(datumStr(next))
  }

  const rangeLabel = `${monday.getDate()}. – ${days[6].getDate()}. ${MONTHS_KURZ[days[6].getMonth()]}`

  return (
    <div>
      <div className="cal-head">
        <div className="cal-month">
          KW <em>{kw(anchor)}</em>
          <small style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ash)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4, fontWeight: 500 }}>
            {rangeLabel}
          </small>
        </div>
        <div className="cal-nav">
          <button onClick={prevWeek} aria-label="Vorherige Woche">‹</button>
          <button onClick={nextWeek} aria-label="Nächste Woche">›</button>
        </div>
      </div>

      <div className="week-list">
        {days.map((d, i) => {
          const ds = datumStr(d)
          const n = courseCountsByDatum.get(ds) || 0
          const past = d < new Date(today.getFullYear(), today.getMonth(), today.getDate())
          const isToday = sameDay(d, today)
          const selected = ds === selectedDatum
          const cls = ['week-row']
          if (past) cls.push('past')
          if (isToday) cls.push('today')
          if (selected) cls.push('selected')
          if (!past && n > 0) cls.push('has-courses')

          return (
            <button
              key={i}
              className={cls.join(' ')}
              disabled={past}
              onClick={() => !past && onSelect(ds)}
            >
              <span className="week-row-dow">{DOW_KURZ[i]}</span>
              <span className="week-row-day">{d.getDate()}</span>
              <span className="week-row-meta">
                {past ? '' : n === 0 ? '—' : `${n} Kurs${n > 1 ? 'e' : ''}`}
              </span>
              {isToday && !selected && <span className="week-row-today">heute</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
