'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg(null)

    const supabase = supabaseBrowser()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('sent')
    }
  }

  return (
    <main className="simple-main">
      <div className="simple-inner" style={{ maxWidth: 440 }}>
        <h1 className="simple-title">Anmelden<em>.</em></h1>

        <div className="info-card">
          {status === 'sent' ? (
            <>
              <h3>Check deine Mails</h3>
              <p>
                Wir haben dir einen Link an <b>{email}</b> geschickt.
                Klicke drauf, dann bist du eingeloggt.
              </p>
              <p style={{ marginTop: 10, fontSize: 13, color: 'var(--ash)' }}>
                Nichts in deinem Posteingang? Schau im Spam-Ordner nach.
              </p>
            </>
          ) : (
            <>
              <h3>Magic <em>Link</em></h3>
              <p style={{ marginBottom: 16 }}>
                Gib deine E-Mail ein — wir schicken dir einen Link zum Einloggen.
                Kein Passwort nötig.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">E-Mail</label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="deine@email.de"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={status === 'sending'}
                    autoFocus
                  />
                </div>

                {errorMsg && (
                  <div className="nachricht fehler">{errorMsg}</div>
                )}

                <button
                  type="submit"
                  className="btn book"
                  disabled={status === 'sending' || !email}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                >
                  {status === 'sending' ? 'Wird gesendet…' : 'Magic Link schicken'}
                </button>
              </form>
            </>
          )}
        </div>

        <Link href="/" className="back-link">← Zurück zum Kursplan</Link>
      </div>
    </main>
  )
}
