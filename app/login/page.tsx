'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { BackToCoursesLink } from '@/components/BackToCoursesLink'

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
      <div className="simple-inner login-inner">
        <h1 className="simple-title">Anmelden<em>.</em></h1>

        <div className="info-card">
          {status === 'sent' ? (
            <>
              <h3>Check deine Mails</h3>
              <p>
                Wir haben dir einen Link an <b>{email}</b> geschickt.
                Klicke drauf, dann bist du eingeloggt.
              </p>
              <p className="login-sent-spam">
                Nichts im Posteingang? Schau im Spam-Ordner nach.
              </p>
            </>
          ) : (
            <>
              <h3>Magic <em>Link</em></h3>
              <p className="login-intro">
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

                <details className="login-details">
                  <summary className="login-details-summary">
                    Neu hier? Namen direkt mitgeben
                  </summary>
                  <p className="login-details-hint">
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
                  className="btn book login-submit"
                  disabled={status === 'sending' || !email}
                >
                  {status === 'sending' ? 'Wird gesendet…' : 'Magic Link schicken'}
                </button>
              </form>
            </>
          )}
        </div>

        <BackToCoursesLink />
      </div>
    </main>
  )
}
