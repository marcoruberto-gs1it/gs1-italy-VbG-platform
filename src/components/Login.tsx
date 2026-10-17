import { useState } from 'react'
import { ArrowRight, MailCheck } from 'lucide-react'
import logo from '../assets/gs1-italy-logo.png'
import { configured, supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      // Solo gli utenti creati da un amministratore possono accedere: nessuna registrazione libera.
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin + window.location.pathname },
    })
    if (error) {
      setState('error')
      setMessage(/signups not allowed|not found|otp_disabled/i.test(error.message)
        ? 'Questo indirizzo non è abilitato alla piattaforma. Chiedi l’accesso al referente GS1 Italy.'
        : `Invio non riuscito: ${error.message}`)
      return
    }
    setState('sent')
  }

  return (
    <main className="login">
      <div className="login-card">
        <img src={logo} alt="GS1 Italy" width={84} height={58} />
        <h1>VbG Platform</h1>
        <p className="login-lead">Analytics delle scansioni dell’app Verified by GS1.</p>

        {!configured ? (
          <p className="notice">La piattaforma non è ancora collegata a Supabase: manca la chiave pubblica del progetto.</p>
        ) : state === 'sent' ? (
          <div className="sent">
            <MailCheck size={28} />
            <p>Ti abbiamo inviato un link di accesso a <b>{email}</b>. Aprilo da questo dispositivo.</p>
            <button className="ghost-btn" type="button" onClick={() => setState('idle')}>Usa un altro indirizzo</button>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)}>
            <label htmlFor="email">Email aziendale</label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome.cognome@gs1it.org" />
            <button className="primary-btn" type="submit" disabled={state === 'sending'}>
              {state === 'sending' ? 'Invio in corso…' : 'Invia link di accesso'} <ArrowRight size={18} />
            </button>
            {state === 'error' && <p className="form-error" role="alert">{message}</p>}
          </form>
        )}
        <a className="demo-link" href="?demo">Guarda la dashboard con dati dimostrativi</a>
      </div>
    </main>
  )
}
