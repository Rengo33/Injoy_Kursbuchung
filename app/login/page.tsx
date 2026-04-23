'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [vorname, setVorname] = useState('')
  const [nachname, setNachname] = useState('')
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
        // Wird bei neuen Accounts in user_metadata gespeichert,
        // useProfile legt daraus automatisch einen Profile-Eintrag an.
        data: (vorname || nachname)
          ? { vorname: vorname.trim(), nachname: nachname.trim() }
          : undefined,
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
      <div className="simple-inner" style={{ maxWidth: 460 }}>
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
                Nichts im Posteingang? Schau im Spam-Ordner nach.
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
                  <label htmlFor="email">E-Mail *</label>
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

                <details style={{ margin: '4px 0 14px' }}>
                  <summary style={{ fontSize: 13, color: 'var(--sage-deep)', cursor: 'pointer', userSelect: 'none' }}>
                    Neu hier? Namen direkt mitgeben
                  </summary>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '10px 0 12px' }}>
                    Damit dein Profil gleich fertig ist — du sparst dir den Schritt später.
                  </p>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="vorname">Vorname</label>
                      <input
                        id="vorname"
                        type="text"
                        placeholder="z.B. Leon"
                        value={vorname}
                        onChange={e => setVorname(e.target.value)}
                        disabled={status === 'sending'}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="nachname">Nachname</label>
                      <input
                        id="nachname"
                        type="text"
                        placeholder="z.B. Schmidt"
                        value={nachname}
                        onChange={e => setNachname(e.target.value)}
                        disabled={status === 'sending'}
                      />
                    </div>
                  </div>
                </details>

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
