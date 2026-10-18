import { useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import logo from '../assets/gs1-italy-logo.png'
import { configured, supabase } from '../lib/supabase'

/*
 * Accesso della demo: utente e password (Supabase Auth).
 * Un nome senza "@" (es. "demo") corrisponde a un indirizzo interno su un dominio riservato,
 * che non riceve posta. Gli utenti li crea solo un amministratore: la registrazione libera è chiusa.
 */
const INTERNAL_DOMAIN = 'vbg-platform.example'
// DEMO: credenziali precompilate per mostrare la piattaforma con un clic.
// Sono pubbliche (sito e repository): da togliere prima di qualsiasi uso in produzione.
const DEMO_USER = 'demo'
const DEMO_PASSWORD = 'gs1italy'
const toEmail = (user: string) => (user.includes('@') ? user : `${user}@${INTERNAL_DOMAIN}`).trim().toLowerCase()

export function Login() {
  const [user, setUser] = useState(DEMO_USER)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email: toEmail(user), password })
    setBusy(false)
    if (error) {
      setMessage(/invalid login credentials/i.test(error.message)
        ? 'Utente o password non corretti.'
        : /rate limit|too many/i.test(error.message)
          ? 'Troppi tentativi: riprova tra qualche minuto.'
          : `Accesso non riuscito: ${error.message}`)
    }
  }

  return (
    <main className="login">
      <div className="login-card">
        <img src={logo} alt="GS1 Italy" width={84} height={58} />
        <h1>VbG Platform</h1>
        <p className="login-lead">Analytics delle scansioni dell’app Verified by GS1.</p>

        {!configured ? (
          <p className="notice">La piattaforma non è ancora collegata a Supabase: manca la chiave pubblica del progetto.</p>
        ) : (
          <form onSubmit={(e) => void submit(e)}>
            <label htmlFor="user">Utente</label>
            <input id="user" required autoComplete="username" autoCapitalize="none" spellCheck={false} value={user} onChange={(e) => setUser(e.target.value)} placeholder="demo" />
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input id="password" type={visible ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Nascondi la password' : 'Mostra la password'}>
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="demo-hint">Credenziali della demo già inserite: premi Accedi.</p>
            <button className="primary-btn" type="submit" disabled={busy}>
              {busy ? 'Accesso in corso…' : 'Accedi'} <ArrowRight size={18} />
            </button>
            {message && <p className="form-error" role="alert">{message}</p>}
          </form>
        )}
        <a className="demo-link" href="?demo">Guarda la dashboard con dati dimostrativi</a>
      </div>
    </main>
  )
}
