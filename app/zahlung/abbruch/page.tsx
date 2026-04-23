import { SimpleShell } from '@/components/SimpleShell'
import { BackToCoursesLink } from '@/components/BackToCoursesLink'

export default function Abbruch() {
  return (
    <SimpleShell title={<>Zahlung <em>abgebrochen</em></>}>
      <div className="info-card">
        <h3>Kein Problem</h3>
        <p>
          Es wurde nichts berechnet. Du kannst jederzeit zurückkommen und den Kauf abschließen.
        </p>
        <p style={{ marginTop: 16 }}>
          <BackToCoursesLink />
        </p>
      </div>
    </SimpleShell>
  )
}
