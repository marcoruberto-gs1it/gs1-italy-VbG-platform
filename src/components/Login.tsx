import { useRef, useState } from 'react'
import { ArrowRight, BadgeCheck, Eye, EyeOff, KeyRound, Map as MapIcon, QrCode, ShieldAlert, Sparkles, UserRound } from 'lucide-react'
import logo from '../assets/gs1-italy-logo.png'
import { gsap, motionOk, useGSAP } from '../lib/motion'
import { t } from '../i18n'
import { configured, supabase } from '../lib/supabase'
import { LangSwitch } from './ui'
import { RippleArt } from './illustrations'

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
  const root = useRef<HTMLElement>(null)
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
        ? t('Utente o password non corretti.')
        : /rate limit|too many/i.test(error.message)
          ? t('Troppi tentativi: riprova tra qualche minuto.')
          : t('Accesso non riuscito: {error}', { error: error.message }))
    }
  }

  // Ingresso animato e onde GS1 in loop, come nell'app di scansione.
  useGSAP(
    () => {
      if (!motionOk()) return
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.login-art', { opacity: 0, duration: 0.6 })
        .from('.login-art-copy > *', { y: 18, opacity: 0, duration: 0.55, stagger: 0.08 }, 0.15)
        .from('.ga-core', { scale: 0.5, opacity: 0, transformOrigin: '50% 50%', duration: 0.8, ease: 'back.out(1.8)' }, 0.2)
        .from('.ga-float-a, .ga-float-b, .ga-float-c', { scale: 0, opacity: 0, transformOrigin: '50% 50%', duration: 0.6, stagger: 0.1, ease: 'back.out(2)' }, 0.4)
        .from('.login-form-card > *', { y: 16, opacity: 0, duration: 0.5, stagger: 0.06 }, 0.3)
      gsap.to('.ga-wave', { attr: { r: 128 }, strokeOpacity: 0, duration: 3.2, ease: 'sine.out', stagger: { each: 0.8, repeat: -1 } })
      gsap.fromTo('.ga-scanline', { y: -16 }, { y: 16, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      gsap.to('.ga-float-a', { y: -8, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      gsap.to('.ga-float-b', { y: 7, duration: 3.1, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.4 })
      gsap.to('.ga-float-c', { y: -6, rotation: -4, transformOrigin: '50% 50%', duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1 })
    },
    { scope: root },
  )

  return (
    <main className="login" ref={root}>
      <section className="login-art">
        <div className="login-art-copy">
          <img src={logo} alt="GS1 Italy" width={84} height={58} className="login-logo" />
          <p className="eyebrow light">VbG Platform</p>
          <h1>{t('Gli analytics del Barometro 2D')}</h1>
          <ul className="login-points">
            <li><QrCode size={18} /> {t('Adozione dei codici 2D, giorno per giorno')}</li>
            <li><MapIcon size={18} /> {t('Diffusione nel mondo, per paese, regione e città')}</li>
            <li><BadgeCheck size={18} /> {t('Qualità dei codici e conformità GS1')}</li>
            <li><ShieldAlert size={18} /> {t('Allerte di brand protection')}</li>
          </ul>
        </div>
        <RippleArt />
      </section>

      <section className="login-form">
        <div className="login-form-card">
          <div className="login-form-head">
            <h2>{t('Accedi')}</h2>
            <LangSwitch />
          </div>
          <p className="login-lead">{t('Area riservata agli utenti abilitati da GS1 Italy.')}</p>
          {!configured ? (
            <p className="notice">{t('La piattaforma non è ancora collegata a Supabase: manca la chiave pubblica del progetto.')}</p>
          ) : (
            <form onSubmit={(e) => void submit(e)}>
              <label htmlFor="user">{t('Utente')}</label>
              <div className="field">
                <UserRound size={18} aria-hidden="true" />
                <input id="user" required autoComplete="username" autoCapitalize="none" spellCheck={false} value={user} onChange={(e) => setUser(e.target.value)} placeholder="demo" />
              </div>
              <label htmlFor="password">Password</label>
              <div className="field">
                <KeyRound size={18} aria-hidden="true" />
                <input id="password" type={visible ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="field-action" onClick={() => setVisible((v) => !v)} aria-label={visible ? t('Nascondi la password') : t('Mostra la password')}>
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="demo-hint"><Sparkles size={14} /> {t('Credenziali della demo già inserite: premi Accedi.')}</p>
              <button className="btn primary block" type="submit" disabled={busy}>
                {busy ? t('Accesso in corso…') : t('Accedi')} <ArrowRight size={18} />
              </button>
              {message && <p className="form-error" role="alert">{message}</p>}
            </form>
          )}
          <a className="link-muted" href="?demo">{t('Oppure guarda la dashboard con dati dimostrativi')}</a>
          <p className="login-version">VbG Platform · v. {__APP_RELEASE__}</p>
        </div>
      </section>
    </main>
  )
}
