'use client'

import { useMemo } from 'react'
import { formatDatum, parseDatum, sameDay, isPastDay, mondayOf, addDays, kwNummer, monatKurz } from '@/lib/datum'

const DOW_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

interface Props {
  selectedDatum: string | null
  courseCountsByDatum: Map<string, number>
  onSelect: (datumStr: string) => void
}

export function WeekStrip({ selectedDatum, courseCountsByDatum, onSelect }: Props) {
  const today = useMemo(() => new Date(), [])

  const anchor = useMemo(() => {
    if (!selectedDatum) return today
    return parseDatum(selectedDatum) ?? today
  }, [selectedDatum, today])

  const monday = useMemo(() => mondayOf(anchor), [anchor])
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
    [monday]
  )

  const prevWeek = () => onSelect(formatDatum(addDays(monday, -7)))
  const nextWeek = () => onSelect(formatDatum(addDays(monday, 7)))

  const rangeLabel = `${monday.getDate()}. – ${days[6].getDate()}. ${monatKurz(days[6].getMonth())}`

  return (
    <div>
      <div className="cal-head">
        <div className="cal-month">
          KW <em>{kwNummer(anchor)}</em>
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
          const ds = formatDatum(d)
          const n = courseCountsByDatum.get(ds) || 0
          const past = isPastDay(d, today)
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
