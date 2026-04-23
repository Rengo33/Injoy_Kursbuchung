import Link from 'next/link'
import { SimpleShell } from '@/components/SimpleShell'

export default function Abbruch() {
  return (
    <SimpleShell title={<>Zahlung <em>abgebrochen</em></>}>
      <div className="info-card">
        <h3>Kein Problem</h3>
        <p>
          Es wurde nichts berechnet. Du kannst jederzeit zurückkommen und den Kauf abschließen.
        </p>
        <p style={{ marginTop: 16 }}>
          <Link href="/" className="back-link">← Zurück zum Kursplan</Link>
        </p>
      </div>
    </SimpleShell>
  )
}
