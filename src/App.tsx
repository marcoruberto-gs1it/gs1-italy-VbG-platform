import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ShieldX } from 'lucide-react'
import './App.css'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import { demoData } from './lib/demo'
import { supabase } from './lib/supabase'
import type { DashboardData, Kpi } from './lib/types'

const demo = new URLSearchParams(window.location.search).has('demo')

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(demo)
  const [days, setDays] = useState(30)
  const [country, setCountry] = useState('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [previous, setPrevious] = useState<Kpi | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    if (demo) return
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const load = useCallback(async () => {
    if (demo) {
      const current = demoData(Math.min(days, 90))
      setData(current)
      // Periodo precedente dimostrativo: un po' meno scansioni e meno 2D.
      const k = current.kpi
      setPrevious({ ...k, letture: Math.round(k.letture * 0.84), letture_simbolo: Math.round(k.letture_simbolo * 0.84), letture_2d: Math.round(k.letture_2d * 0.7), conformi: Math.round(k.conformi * 0.83), schede_complete: Math.round(k.schede_complete * 0.8), allerte_link: k.allerte_link + 6 })
      return
    }
    if (!session) return
    setLoading(true)
    setError(null)
    const to = new Date()
    const from = new Date(to.getTime() - days * 86_400_000)
    const before = new Date(from.getTime() - days * 86_400_000)
    // Periodo corrente e periodo precedente di pari durata (per i confronti), in parallelo.
    const [{ data: result, error: rpcError }, prev] = await Promise.all([
      supabase.rpc('dashboard_data', { p_from: from.toISOString(), p_to: to.toISOString(), p_country: country || null }),
      supabase.rpc('dashboard_data', { p_from: before.toISOString(), p_to: from.toISOString(), p_country: country || null }),
    ])
    setLoading(false)
    if (rpcError) {
      if (rpcError.code === '42501') setForbidden(true)
      else setError(`Impossibile caricare i dati: ${rpcError.message}`)
      return
    }
    setForbidden(false)
    setData(result as DashboardData)
    setPrevious(prev.error ? null : (prev.data as DashboardData).kpi)
  }, [session, days, country])

  useEffect(() => {
    void load()
  }, [load])

  async function signOut() {
    await supabase.auth.signOut()
    setData(null)
    setForbidden(false)
  }

  if (!ready) return null
  if (!demo && !session) return <Login />
  if (forbidden) {
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
      data={data}
      previous={previous}
      loading={loading}
      error={error}
      days={days}
      country={country}
      demo={demo}
      email={session?.user.email}
      onDays={setDays}
      onCountry={setCountry}
      onReload={() => void load()}
      onSignOut={() => void signOut()}
    />
  )
}
