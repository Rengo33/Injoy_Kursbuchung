import { CONFIG } from './config'

export interface Kurs {
  id: number
  name: string
  datum: string
  wochentag: string
  uhrzeit: string
  trainer: string
  raum: string
  kapazitaet: number
  gebucht: number
  verfuegbar: number
  warteliste: number
  course_id: number
  course_date: string
}

interface RawCourse {
  id: number
  name: string
  start_date_time: string
  trainer?: string
  instructor?: { name: string }
  room?: { name: string }
  capacity: number
  total_joiners: number
  total_waiting_lists: number
}

const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

function getWochentag(date: Date): string {
  return WOCHENTAGE[date.getDay()]
}

export async function holeKurse(tageVoraus: number = 7, startTag: number = 1): Promise<Kurs[]> {
  const heute = new Date()
  
  const fromDatum = new Date(heute)
  fromDatum.setDate(heute.getDate() + startTag)
  
  const toDatum = new Date(heute)
  toDatum.setDate(heute.getDate() + tageVoraus)
  
  const fromStr = fromDatum.toISOString().split('T')[0]
  const toStr = toDatum.toISOString().split('T')[0]
  // Use ISO string without Z + timezone offset for API
  const isoString = heute.toISOString().split('T')[0] + 'T12:00:00'
  const timezone = isoString + '+01:00'
  
  const url = `${CONFIG.API_BASE_URL}/centers/${CONFIG.CENTER_ID}/hybrid_courseplan?from=${fromStr}T00:01:00Z&to=${toStr}T22:59:59Z&timezone=${encodeURIComponent(timezone)}`
  
  const headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'de',
    'authorization': CONFIG.API_AUTH_TOKEN,
  }
  
  try {
    const response = await fetch(url, { headers, next: { revalidate: 60 } })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    
    const kurse: RawCourse[] = await response.json()
    return erstelleUebersicht(kurse)
  } catch (error) {
    console.error('Fehler beim Laden der Kurse:', error)
    return []
  }
}

function erstelleUebersicht(kurse: RawCourse[]): Kurs[] {
  const overview: Kurs[] = []
  
  for (const course of kurse) {
    const startTime = course.start_date_time
    if (!startTime) continue
    
    const name = course.name || 'Unbekannt'
    const trainer = course.trainer || course.instructor?.name || ''
    const raum = course.room?.name || ''
    const kapazitaet = course.capacity || 0
    const gebucht = course.total_joiners || 0
    const warteliste = course.total_waiting_lists || 0
    const verfuegbar = Math.max(0, kapazitaet - gebucht)
    
    const dateObj = new Date(startTime)
    // Use proper timezone conversion (handles DST automatically)
    const berlinDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))
    
    overview.push({
      id: course.id,
      name,
      datum: berlinDate.toLocaleDateString('de-DE'),
      wochentag: getWochentag(berlinDate),
      uhrzeit: berlinDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      trainer,
      raum,
      kapazitaet,
      gebucht,
      verfuegbar,
      warteliste,
      course_id: course.id,
      course_date: startTime,
    })
  }
  
  return overview.sort((a, b) => new Date(a.course_date).getTime() - new Date(b.course_date).getTime())
}

export interface BuchungsData {
  course_id: number
  course_date: string
  vorname: string
  nachname: string
  email: string
  telefon?: string
  notiz?: string
}

/**
 * Berechnet den Zielzeitpunkt für die Buchung:
 * - TEST_MODE: Nächste 2-Minuten-Marke (um mehrere gleichzeitige Anfragen zu testen)
 * - NORMAL: Kursbeginn - 1 Tag - 2 Sekunden
 */
export function berechneTargetZeitpunkt(courseDate: string): Date {
  const jetzt = new Date()
  
  // Im Testmodus: Nächste 2-Minuten-Marke berechnen
  if (CONFIG.TEST_MODE) {
    const minuten = jetzt.getMinutes()
    const sekunden = jetzt.getSeconds()
    const millisekunden = jetzt.getMilliseconds()
    
    // Berechne wie viele Minuten bis zur nächsten geraden 2er-Marke (0, 2, 4, 6, ...)
    const minutenBisNaechsteMark = (2 - (minuten % 2)) % 2
    let minutenBisZiel = minutenBisNaechsteMark === 0 ? 2 : minutenBisNaechsteMark
    
    // Wenn wir bereits auf einer 2er-Marke sind und keine Sekunden/Millisekunden mehr haben
    if (minutenBisNaechsteMark === 0 && (sekunden > 0 || millisekunden > 0)) {
      minutenBisZiel = 2
    }
    
    const targetMillis = jetzt.getTime() + (minutenBisZiel * 60 * 1000) - (sekunden * 1000) - millisekunden
    return new Date(targetMillis)
  }
  
  const kursStart = new Date(courseDate)
  // 1 Tag = 86400 Sekunden. + 2 Sekunden = 86402 Sekunden vor Beginn.
  const targetMillis = kursStart.getTime() - (86402 * 1000)
  return new Date(targetMillis)
}

export async function bucheKurs(data: BuchungsData): Promise<{ success: boolean; message: string }> {
  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'de',
    'Authorization': CONFIG.BOOKING_AUTH_TOKEN,
    'Content-Type': 'application/json;charset=UTF-8',
    'Priority': 'u=1, i',
  }
  
  // Convert course_date to UTC
  let courseDate = data.course_date
  if (courseDate.includes('+')) {
    const dt = new Date(courseDate)
    courseDate = dt.toISOString().replace('.000Z', 'Z')
  } else if (!courseDate.endsWith('Z')) {
    courseDate = courseDate + 'Z'
  }
  
  const body = {
    source: 'Website',
    first_name: data.vorname,
    last_name: data.nachname,
    email: data.email,
    phone: data.telefon || '',
    note: data.notiz || '',
    course_id: data.course_id,
    course_date: courseDate,
    domain: CONFIG.DOMAIN,
    center_id: CONFIG.CENTER_ID,
    is_paid: false,
    ip_address: '',
    is_agree_consent: true,
    is_agree_cancellation_policy: true,
    total_price: '0.00',
    payment_method: 'NONE',
    original_price: '0.00',
  }
  
  try {
    const response = await fetch(CONFIG.BOOKING_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    
    if (response.ok) {
      return { success: true, message: 'Kurs erfolgreich gebucht!' }
    }
    
    const errorData = await response.json().catch(() => ({}))
    
    if (response.status === 422) {
      const errorMsg = errorData.Error || errorData.message || 'Buchung fehlgeschlagen'
      return { success: false, message: errorMsg }
    }
    
    return { success: false, message: `Fehler: ${response.status}` }
  } catch (error) {
    return { success: false, message: `Netzwerkfehler: ${error}` }
  }
}
