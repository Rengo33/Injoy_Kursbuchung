'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MonthCalendar } from './MonthCalendar'
import { WeekStrip } from './WeekStrip'
import { MemberCard } from './MemberCard'
import type { CreditStatus } from '@/lib/credits'

interface Props {
  viewYear: number
  viewMonth: number
  selectedDatum: string | null
  courseCountsByDatum: Map<string, number>
  onSelect: (datumStr: string) => void
  onPrev: () => void
  onNext: () => void
  credits: CreditStatus | null
}

export function Sidebar(props: Props) {
  const [view, setView] = useState<'woche' | 'monat'>('monat')

  return (
    <aside className="sidebar">
      <div className="view-switch">
        <button
          className={view === 'woche' ? 'on' : ''}
          onClick={() => setView('woche')}
        >Woche</button>
        <button
          className={view === 'monat' ? 'on' : ''}
          onClick={() => setView('monat')}
        >Monat</button>
      </div>

      {view === 'monat' ? (
        <MonthCalendar
          viewYear={props.viewYear}
          viewMonth={props.viewMonth}
          selectedDatum={props.selectedDatum}
          courseCountsByDatum={props.courseCountsByDatum}
          onSelect={props.onSelect}
          onPrev={props.onPrev}
          onNext={props.onNext}
        />
      ) : (
        <WeekStrip
          selectedDatum={props.selectedDatum}
          courseCountsByDatum={props.courseCountsByDatum}
          onSelect={props.onSelect}
        />
      )}

      <MemberCard credits={props.credits} />

      <div className="sidebar-foot">
        <Link href="/hilfe">Hilfe &amp; FAQ</Link>
        <Link href="/impressum">Impressum</Link>
        <Link href="/datenschutz">Datenschutz</Link>
      </div>
    </aside>
  )
}
