import { SimpleShell } from '@/components/SimpleShell'
import Link from 'next/link'

export default function Datenschutz() {
  return (
    <SimpleShell title={<><em>Datenschutz</em></>}>
      <div className="info-card">
        <h3>Verantwortlicher</h3>
        <p>
          INJOY Wolfsburg<br />
          Porschestraße 42, 38440 Wolfsburg<br />
          E-Mail: <a href="mailto:info@injoy-wolfsburg.de">info@injoy-wolfsburg.de</a>
        </p>
      </div>

      <div className="info-card">
        <h3>Welche Daten wir verarbeiten</h3>
        <p>
          Für die Buchung von Kursen verarbeiten wir deinen Namen, deine E-Mail-Adresse und (optional)
          deine Telefonnummer. Diese Daten werden ausschließlich zur Durchführung der Buchung
          an das INJOY Buchungssystem übermittelt.
        </p>
      </div>

      <div className="info-card">
        <h3>Auto-Book</h3>
        <p>
          Bei Auto-Book werden deine Buchungsdaten verschlüsselt bei unserem Scheduling-Dienst (Upstash QStash)
          zwischengespeichert, bis der geplante Buchungszeitpunkt erreicht ist. Danach werden sie gelöscht.
        </p>
      </div>

      <div className="info-card">
        <h3>Deine Rechte</h3>
        <p>
          Du hast jederzeit das Recht auf Auskunft, Berichtigung, Löschung und Widerspruch bezüglich
          deiner bei uns gespeicherten Daten. Kontaktiere uns dazu per E-Mail.
        </p>
      </div>

      <div className="info-card">
        <h3>Cookies</h3>
        <p>
          Wir setzen nur technisch notwendige Cookies ein — z.B. um deine ausgewählten Einstellungen
          zu speichern. Es gibt kein Tracking und keine Analyse-Cookies.
        </p>
      </div>

      <Link href="/" className="back-link">← Zurück zum Kursplan</Link>
    </SimpleShell>
  )
}
