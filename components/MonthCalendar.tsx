'use client'

import { useMemo } from 'react'
import { formatDatum, sameDay, isPastDay, monatName } from '@/lib/datum'

interface GridDay {
  day: number
  month: number // 0-11
  year: number
  faded: boolean
  datumStr: string // dd.mm.yyyy
}

function buildGrid(viewYear: number, viewMonth: number): GridDay[] {
  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const jsDow = firstOfMonth.getDay() // 0=Sun
  const mondayOffset = (jsDow + 6) % 7 // Mo=0

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const grid: GridDay[] = []

  // previous month tail
  for (let i = mondayOffset - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const m = viewMonth === 0 ? 11 : viewMonth - 1
    const y = viewMonth === 0 ? viewYear - 1 : viewYear
    grid.push(makeDay(d, m, y, true))
  }
  // current month
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push(makeDay(d, viewMonth, viewYear, false))
  }
  // next month head (fill to multiple of 7, at least 6 rows)
  while (grid.length % 7 !== 0 || grid.length < 42) {
    const offset = grid.length - (mondayOffset + daysInMonth)
    const d = offset + 1
    const m = viewMonth === 11 ? 0 : viewMonth + 1
    const y = viewMonth === 11 ? viewYear + 1 : viewYear
    grid.push(makeDay(d, m, y, true))
    if (grid.length >= 42) break
  }
  return grid
}

function makeDay(d: number, m: number, y: number, faded: boolean): GridDay {
  return { day: d, month: m, year: y, faded, datumStr: formatDatum(new Date(y, m, d)) }
}

interface Props {
  viewYear: number
  viewMonth: number // 0-11
  selectedDatum: string | null // dd.mm.yyyy
  courseCountsByDatum: Map<string, number>
  onSelect: (datumStr: string) => void
  onPrev: () => void
  onNext: () => void
}

export function MonthCalendar({
  viewYear,
  viewMonth,
  selectedDatum,
  courseCountsByDatum,
  onSelect,
  onPrev,
  onNext,
}: Props) {
  const grid = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth])
  const today = useMemo(() => new Date(), [])

  return (
    <div>
      <div className="cal-head">
        <div className="cal-month">
          {monatName(viewMonth)} <em>{viewYear}</em>
        </div>
        <div className="cal-nav">
          <button onClick={onPrev} aria-label="Vorheriger Monat">‹</button>
          <button onClick={onNext} aria-label="Nächster Monat">›</button>
        </div>
      </div>

      <div className="cal-weekdays">
        <span>M</span><span>D</span><span>M</span>
        <span>D</span><span>F</span><span>S</span><span>S</span>
      </div>

      <div className="cal-grid">
        {grid.map((d, i) => {
          const dayDate = new Date(d.year, d.month, d.day)
          const cls = ['cal-day']
          const past = isPastDay(dayDate, today)
          if (d.faded) cls.push('faded')
          if (past) cls.push('past')
          if (sameDay(today, dayDate)) cls.push('today')
          if (selectedDatum === d.datumStr) cls.push('selected')
          if ((courseCountsByDatum.get(d.datumStr) || 0) > 0 && !past) cls.push('has-courses')

          return (
            <button
              key={i}
              className={cls.join(' ')}
              disabled={past}
              onClick={() => !past && onSelect(d.datumStr)}
            >
              {d.day}
            </button>
          )
        })}
      </div>

      <div className="cal-legend">
        <span><span className="swatch" /> mit Kursen</span>
        <span><span className="swatch hollow" /> heute</span>
        <span><span className="swatch filled" /> ausgewählt</span>
      </div>
    </div>
  )
}
