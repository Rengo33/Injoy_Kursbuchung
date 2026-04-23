import Link from 'next/link'
import { SimpleShell } from '@/components/SimpleShell'

const HINTS: Record<string, string> = {
  'no-code': 'Supabase hat keinen Login-Code zurückgegeben. Das passiert meistens, wenn http://localhost:3000 nicht als Redirect URL in Supabase → Authentication → URL Configuration eingetragen ist.',
  'access_denied': 'Der Login-Link wurde abgelehnt. Wahrscheinlich ist er abgelaufen (1h Gültigkeit) oder wurde bereits verwendet.',
  'otp_expired': 'Der Magic Link ist abgelaufen. Bitte einen neuen anfordern.',
}

export default function AuthFehler({ searchParams }: { searchParams: { reason?: string } }) {
  const reason = searchParams.reason ?? 'unknown'
  const hint = HINTS[reason] ?? 'Bitte versuche dich erneut anzumelden.'

  return (
    <SimpleShell title={<>Login <em>fehlgeschlagen</em></>}>
      <div className="info-card">
        <h3>Das hat nicht geklappt</h3>
        <p><b>Grund:</b> {reason}</p>
        <p style={{ marginTop: 10 }}>{hint}</p>
        <p style={{ marginTop: 20 }}>
          <Link href="/login" className="btn book" style={{ display: 'inline-flex' }}>
            Nochmal versuchen
          </Link>
        </p>
      </div>

      <div className="info-card">
        <h3>Falls es weiter nicht klappt</h3>
        <p>Prüfe im Supabase-Dashboard:</p>
        <ul style={{ marginLeft: 20, marginTop: 8 }}>
          <li>Authentication → URL Configuration → <b>Site URL</b> ist gesetzt</li>
          <li>Authentication → URL Configuration → <b>Redirect URLs</b> enthält die aktuelle Domain</li>
          <li>Authentication → Providers → <b>Email</b> ist aktiviert</li>
        </ul>
      </div>
    </SimpleShell>
  )
}
