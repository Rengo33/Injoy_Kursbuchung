export type Kategorie = 'alle' | 'kraft' | 'cardio' | 'mindbody' | 'cycling' | 'mobility'

const PATTERNS: Record<Exclude<Kategorie, 'alle'>, string[]> = {
  kraft: ['strength', 'kraft', 'bodypump', 'bbp', 'power', 'hiit', 'circuit', 'functional'],
  cardio: ['cardio', 'step', 'dance', 'zumba', 'tanz', 'aerobic', 'jumping'],
  mindbody: ['yoga', 'pilates', 'meditation', 'mindful', 'mind & body', 'faszien'],
  cycling: ['spin', 'cycling', 'indoor cycling', 'rpm'],
  mobility: ['stretch', 'mobility', 'faszien', 'beweglich', 'rücken'],
}

export function kategorieFuerKurs(name: string): Exclude<Kategorie, 'alle'> | null {
  const lower = name.toLowerCase()
  for (const [kat, keywords] of Object.entries(PATTERNS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return kat as Exclude<Kategorie, 'alle'>
    }
  }
  return null
}

export const KATEGORIE_LABEL: Record<Kategorie, string> = {
  alle: 'Alle',
  kraft: 'Kraft',
  cardio: 'Cardio',
  mindbody: 'Mind & Body',
  cycling: 'Cycling',
  mobility: 'Mobility',
}
