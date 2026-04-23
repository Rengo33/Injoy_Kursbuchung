import { SimpleShell } from '@/components/SimpleShell'
import Link from 'next/link'

export default function Hilfe() {
  return (
    <SimpleShell title={<>Hilfe &amp; <em>FAQ</em></>}>
      <div className="info-card">
        <h3>Wie buche ich einen Kurs?</h3>
        <p>
          Wähle im Kursplan einen Tag, klicke auf „Buchen" neben dem gewünschten Kurs und fülle das Formular aus.
          Du bekommst anschließend eine Bestätigungs-E-Mail.
        </p>
      </div>

      <div className="info-card">
        <h3>Was ist Auto-Book?</h3>
        <p>
          Auto-Book reserviert deinen Platz automatisch in der Sekunde, in der der Kurs freigegeben wird —
          ideal für stark nachgefragte Kurse. Die Buchung erfolgt ca. 1 Tag vor Kursbeginn.
        </p>
      </div>

      <div className="info-card">
        <h3>Kann ich eine Buchung stornieren?</h3>
        <p>
          Buchungen kannst du bis <b>2 Stunden vor Kursbeginn</b> kostenlos stornieren — direkt im INJOY Kundenbereich
          oder per Mail an die Rezeption.
        </p>
      </div>

      <div className="info-card">
        <h3>Komme ich auf die Warteliste?</h3>
        <p>
          Wenn ein Kurs voll ist, siehst du automatisch den „Warteliste"-Button. Sobald ein Platz frei wird,
          rücken Wartende der Reihe nach nach — du bekommst eine E-Mail-Benachrichtigung.
        </p>
      </div>

      <div className="info-card">
        <h3>Ich habe eine andere Frage</h3>
        <p>
          Schreib uns an <a href="mailto:info@injoy-wolfsburg.de">info@injoy-wolfsburg.de</a> oder ruf
          unter <a href="tel:+4953611234567">05361 — 123 45 67</a> an.
        </p>
      </div>

      <Link href="/" className="back-link">← Zurück zum Kursplan</Link>
    </SimpleShell>
  )
}
