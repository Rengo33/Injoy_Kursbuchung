import { SimpleShell } from '@/components/SimpleShell'
import { BackToCoursesLink } from '@/components/BackToCoursesLink'

export default function Impressum() {
  return (
    <SimpleShell title={<><em>Impressum</em></>}>
      <div className="info-card">
        <h3>Angaben gemäß § 5 TMG</h3>
        <p>
          INJOY Wolfsburg<br />
          Porschestraße 42<br />
          38440 Wolfsburg<br />
          Deutschland
        </p>
      </div>

      <div className="info-card">
        <h3>Kontakt</h3>
        <p>
          Telefon: 05361 — 123 45 67<br />
          E-Mail: <a href="mailto:info@injoy-wolfsburg.de">info@injoy-wolfsburg.de</a>
        </p>
      </div>

      <div className="info-card">
        <h3>Vertretungsberechtigt</h3>
        <p>Geschäftsführung: [Name]</p>
      </div>

      <div className="info-card">
        <h3>Haftung für Inhalte</h3>
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den
          allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch
          nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.
        </p>
      </div>

      <BackToCoursesLink />
    </SimpleShell>
  )
}
