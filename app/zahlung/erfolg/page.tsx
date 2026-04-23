import Link from 'next/link'
import { SimpleShell } from '@/components/SimpleShell'

export default function Erfolg() {
  return (
    <SimpleShell title={<>Danke!</>}>
      <div className="info-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{
          width: 64, height: 64, margin: '0 auto 16px',
          background: 'var(--sage)', color: 'var(--bg)',
          borderRadius: '50%', display: 'grid', placeItems: 'center',
          fontSize: 32, fontWeight: 600,
        }}>✓</div>
        <h3 style={{ marginBottom: 10 }}>Zahlung erfolgreich</h3>
        <p>
          Deine Credits sind in wenigen Sekunden auf deinem Konto.
          Die Gutschrift erfolgt sobald Stripe die Zahlung an uns bestätigt.
        </p>
        <p style={{ marginTop: 16 }}>
          <Link href="/" className="btn book" style={{ display: 'inline-flex' }}>
            Zum Kursplan
          </Link>
        </p>
      </div>
    </SimpleShell>
  )
}
