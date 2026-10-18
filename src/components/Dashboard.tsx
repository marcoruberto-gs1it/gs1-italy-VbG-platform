import { useRef } from 'react'
import { TriangleAlert } from 'lucide-react'
import { useActiveSection, useKeepActiveVisible } from '../hooks/useActiveSection'
import { usePageMotion } from '../hooks/usePageMotion'
import { periodFor } from '../lib/config'
import type { DashboardData, Kpi } from '../lib/types'
import { ErrorBoundary } from './ErrorBoundary'
import { Sidebar } from './layout/Sidebar'
import { MobileNav } from './layout/MobileNav'
import { Topbar } from './layout/Topbar'
import { Adoption } from './sections/Adoption'
import { Brands } from './sections/Brands'
import { Categories } from './sections/Categories'
import { Overview } from './sections/Overview'
import { Protection } from './sections/Protection'
import { Quality } from './sections/Quality'
import { RawData } from './sections/raw/RawData'
import { Territory } from './sections/Territory'

type Props = {
  data: DashboardData | null
  previous: Kpi | null
  loading: boolean
  error: string | null
  days: number
  country: string
  demo: boolean
  email?: string
  onDays: (days: number) => void
  onCountry: (country: string) => void
  onReload: () => void
  onSignOut: () => void
}

/** Struttura della dashboard: barra laterale, filtri e sezioni, ognuna isolata dalle altre in caso di errore. */
export function Dashboard({ data, previous, loading, error, days, country, demo, email, onDays, onCountry, onReload, onSignOut }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const active = useActiveSection(Boolean(data))
  useKeepActiveVisible(active, '.mobile-nav')
  usePageMotion(root, Boolean(data))

  return (
    <div className="layout" ref={root}>
      <Sidebar active={active} demo={demo} email={email} onSignOut={onSignOut} />
      <div className="main">
        <Topbar days={days} country={country} loading={loading} demo={demo} onDays={onDays} onCountry={onCountry} onReload={onReload} onSignOut={onSignOut} />
        <MobileNav active={active} />
        <main className="content">
          {error && <p className="notice is-error" role="alert"><TriangleAlert size={18} /> {error}</p>}
          {!data && loading && <div className="skeleton-hero" aria-busy="true" aria-label="Caricamento dei dati" />}
          {data && (
            <>
              <ErrorBoundary><Overview data={data} previous={previous} period={periodFor(days)} country={country} /></ErrorBoundary>
              <ErrorBoundary><Adoption data={data} days={days} /></ErrorBoundary>
              <ErrorBoundary><Territory data={data} /></ErrorBoundary>
              <ErrorBoundary><Quality data={data} /></ErrorBoundary>
              <ErrorBoundary><Categories data={data} /></ErrorBoundary>
              <ErrorBoundary><Brands data={data} /></ErrorBoundary>
              <ErrorBoundary><Protection data={data} /></ErrorBoundary>
              <ErrorBoundary>
                <section className="section">
                  <header className="section-head reveal" id="dati">
                    <h2>Dati grezzi</h2>
                    <p className="section-text">Le singole scansioni del periodo, filtrabili. Aprire un dettaglio interroga Verified by GS1 senza registrare una nuova scansione.</p>
                  </header>
                  <RawData days={days} country={country} demo={demo} symbologies={data.simbologie.map((s) => s.simbologia)} />
                </section>
              </ErrorBoundary>
              <footer className="page-foot">
                <span>GS1 Italy · VbG Platform</span>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
