import { useCallback, useRef, useState, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { useActiveSection, useKeepActiveVisible } from '../hooks/useActiveSection'
import { AudienceContext, useAudienceState } from '../hooks/useAudience'
import { usePageMotion } from '../hooks/usePageMotion'
import { loadVersion, useUpdateAvailable } from '../hooks/useUpdate'
import { SECTION_ORDER } from '../lib/audiences'
import { periodFor, sectionById, type SectionId } from '../lib/config'
import type { DashboardData, Kpi } from '../lib/types'
import { ErrorBoundary } from './ErrorBoundary'
import { Footer } from './layout/Footer'
import { MobileNav } from './layout/MobileNav'
import { Sidebar } from './layout/Sidebar'
import { Topbar } from './layout/Topbar'
import { Adoption } from './sections/Adoption'
import { Brands } from './sections/Brands'
import { Categories } from './sections/Categories'
import { Overview } from './sections/Overview'
import { Protection } from './sections/Protection'
import { Quality } from './sections/Quality'
import { RawSection } from './sections/raw/RawSection'
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

/**
 * Struttura della dashboard: barra laterale, filtri e sezioni nell'ordine della vista scelta
 * (GS1 Italy, produttori, distributori, stampa); ogni sezione è isolata dalle altre in caso di errore.
 */
export function Dashboard({ data, previous, loading, error, days, country, demo, email, onDays, onCountry, onReload, onSignOut }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const [audience, setAudience] = useAudienceState()
  const [rawSearch, setRawSearch] = useState('')
  const order = SECTION_ORDER[audience]
  const sections = order.map(sectionById)
  const active = useActiveSection(Boolean(data), order)
  useKeepActiveVisible(active, '.mobile-nav')
  usePageMotion(root, `${Boolean(data)}|${audience}`)
  const period = periodFor(days)
  const update = useUpdateAvailable()

  const findPrefix = useCallback((prefix: string) => {
    setRawSearch(prefix)
    requestAnimationFrame(() => document.getElementById('dati')?.scrollIntoView({ behavior: 'smooth' }))
  }, [])

  const render = (id: SectionId, d: DashboardData): ReactNode => {
    switch (id) {
      case 'panoramica': return <Overview data={d} previous={previous} period={period} days={days} country={country} onFindPrefix={findPrefix} />
      case 'adozione': return <Adoption data={d} days={days} />
      case 'territorio': return <Territory data={d} country={country} onCountry={onCountry} />
      case 'qualita': return <Quality data={d} />
      case 'categorie': return <Categories data={d} />
      case 'brand': return <Brands data={d} />
      case 'protezione': return <Protection data={d} />
      case 'dati': return <RawSection days={days} country={country} demo={demo} search={rawSearch} symbologies={d.simbologie.map((s) => s.simbologia)} />
    }
  }

  return (
    <AudienceContext.Provider value={audience}>
      <div className="layout" ref={root}>
        <Sidebar sections={sections} active={active} demo={demo} email={email} onSignOut={onSignOut} />
        <div className="main">
          <Topbar active={active} countries={data?.paesi?.map((c) => c.country) ?? []} days={days} country={country} audience={audience} loading={loading} demo={demo} onDays={onDays} onCountry={onCountry} onAudience={setAudience} onReload={onReload} onSignOut={onSignOut} />
          <MobileNav sections={sections} active={active} />
          <main className="content">
            {error && <p className="notice is-error" role="alert"><TriangleAlert size={18} /> {error}</p>}
            {!data && loading && <div className="skeleton-hero" aria-busy="true" aria-label="Caricamento dei dati" />}
            {data && order.map((id) => <ErrorBoundary key={id}>{render(id, data)}</ErrorBoundary>)}
          </main>
          <Footer />
          {update && (
            <div className="update-toast" role="status">
              <span>È disponibile una nuova versione della dashboard</span>
              <button className="btn primary small" type="button" onClick={() => loadVersion(update)}>Aggiorna</button>
            </div>
          )}
        </div>
      </div>
    </AudienceContext.Provider>
  )
}
