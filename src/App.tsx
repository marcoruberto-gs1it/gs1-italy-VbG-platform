import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ShieldX } from 'lucide-react'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import { useDashboardData } from './hooks/useDashboardData'
import { t, useLang } from './i18n'
import { supabase } from './lib/supabase'

const demo = new URLSearchParams(window.location.search).has('demo')

/** Accesso (Supabase Auth) e dati della dashboard; con ?demo si vedono dati generati nel browser. */
export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(demo)
  const [days, setDays] = useState(30)
  const [country, setCountry] = useState('')
  const lang = useLang()
  const state = useDashboardData({ days, country, demo, signedIn: Boolean(session) })

  useEffect(() => {
    document.title = t('VbG Platform · GS1 Italy')
  }, [lang])

  useEffect(() => {
    if (demo) return
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (!ready) return null
  // key={lang}: al cambio di lingua si ricostruisce l'interfaccia (testi, numeri e animazioni).
  if (!demo && !session) return <Login key={lang} />
  if (state.forbidden) {
    return (
      <main className="center-screen">
        <div className="card-message">
          <span className="message-icon"><ShieldX size={30} /></span>
          <h1>{t('Account non abilitato')}</h1>
          <p>{t('L’indirizzo {email} ha effettuato l’accesso, ma non è tra gli utenti autorizzati a vedere gli analytics. Chiedi l’abilitazione al referente GS1 Italy.', { email: session?.user.email ?? '' })}</p>
          <button className="btn ghost" type="button" onClick={() => void signOut()}>{t('Esci')}</button>
        </div>
      </main>
    )
  }
  return (
    <Dashboard
      key={lang}
      data={state.data}
      previous={state.previous}
      loading={state.loading}
      error={state.error}
      days={days}
      country={country}
      demo={demo}
      email={session?.user.email}
      onDays={setDays}
      onCountry={setCountry}
      onReload={state.reload}
      onSignOut={() => void signOut()}
    />
  )
}
