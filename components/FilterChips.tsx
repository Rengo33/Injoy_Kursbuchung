'use client'

import { KATEGORIE_LABEL, type Kategorie } from '@/lib/kategorien'

const REIHENFOLGE: Kategorie[] = ['alle', 'kraft', 'cardio', 'mindbody', 'cycling', 'mobility']

interface Props {
  selected: Kategorie
  onSelect: (k: Kategorie) => void
}

export function FilterChips({ selected, onSelect }: Props) {
  return (
    <div className="filter-row">
      {REIHENFOLGE.map(k => (
        <button
          key={k}
          className={`chip-filter${selected === k ? ' on' : ''}`}
          onClick={() => onSelect(k)}
        >
          {KATEGORIE_LABEL[k]}
        </button>
      ))}
    </div>
  )
}
