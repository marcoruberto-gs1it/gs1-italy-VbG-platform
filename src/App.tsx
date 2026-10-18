import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ShieldX } from 'lucide-react'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import { useDashboardData } from './hooks/useDashboardData'
import { supabase } from './lib/supabase'

const demo = new URLSearchParams(window.location.search).has('demo')

/** Accesso (Supabase Auth) e dati della dashboard; con ?demo si vedono dati generati nel browser. */
export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(demo)
  const [days, setDays] = useState(30)
  const [country, setCountry] = useState('')
  const state = useDashboardData({ days, country, demo, signedIn: Boolean(session) })

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
  if (!demo && !session) return <Login />
  if (state.forbidden) {
    return (
      <main className="center-screen">
        <div className="card-message">
          <span className="message-icon"><ShieldX size={30} /></span>
          <h1>Account non abilitato</h1>
          <p>L’indirizzo <b>{session?.user.email}</b> ha effettuato l’accesso, ma non è tra gli utenti autorizzati a vedere gli analytics. Chiedi l’abilitazione al referente GS1 Italy.</p>
          <button className="btn ghost" type="button" onClick={() => void signOut()}>Esci</button>
        </div>
      </main>
    )
  }
  return (
    <Dashboard
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
