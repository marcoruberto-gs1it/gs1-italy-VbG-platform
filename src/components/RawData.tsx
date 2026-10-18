import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, ImageOff, Search, X } from 'lucide-react'
import { fetchEvents } from '../lib/events'
import { dateTime, gtinDisplay, num, regionName } from '../lib/format'
import { gsap, motionOk, useGSAP } from '../lib/motion'
import type { EventFilters, EventsPage, ScanEvent } from '../lib/types'
import { canLookup, lookup, type VbgRecord } from '../lib/vbg'
import { Panel, Select, StatusPill, type SelectOption } from './ui'

const PAGE_SIZE = 25
const EMPTY: EventFilters = { q: '', symbology: '', compliance: '', vbg_state: '', link_level: '', source: '' }

type Tone = 'good' | 'warning' | 'critical' | 'neutral'

const COMPLIANCE: Record<string, [string, Tone]> = {
  gs1: ['Standard GS1', 'good'],
  partial: ['Non standard', 'warning'],
  error: ['Con errori', 'critical'],
  none: ['Non GS1', 'neutral'],
  manual: ['A mano', 'neutral'],
}
const VBG: Record<string, [string, Tone]> = {
  verified: ['Verificato', 'good'],
  licensed: ['Solo licenza', 'warning'],
  invalid: ['Non valido', 'critical'],
  error: ['Non riuscita', 'neutral'],
  none: ['Non verificato', 'neutral'],
}
const LINK: Record<string, [string, Tone]> = {
  trusted: ['Dominio del titolare', 'good'],
  unknown: ['Non riconosciuto', 'warning'],
  danger: ['Sospetto', 'critical'],
  pending: ['In verifica', 'neutral'],
  none: ['Senza link', 'neutral'],
}
const SOURCE: Record<string, string> = { camera: 'Fotocamera', image: 'Da foto', manual: 'Inserito a mano' }

const options = (all: string, map: Record<string, [string, Tone]> | Record<string, string>): SelectOption<string>[] => [
  { value: '', label: all },
  ...Object.entries(map).map(([value, v]) => ({ value, label: Array.isArray(v) ? v[0] : v })),
]

function Status({ map, value }: { map: Record<string, [string, Tone]>; value: string | null }) {
  const [label, tone] = map[value ?? 'none'] ?? [value ?? '–', 'neutral']
  return <StatusPill tone={tone}>{label}</StatusPill>
}

const productLabel = (e: ScanEvent) => e.gpc_brick_name ?? (e.vbg_state === 'invalid' ? 'Numero non assegnato' : e.licensee_name ? 'Scheda non pubblicata' : null)

const keyLabel = (e: ScanEvent) => (e.primary_key ? (e.primary_ai === '01' ? gtinDisplay(e.primary_key) : e.primary_key) : null)

type Props = { days: number; country: string; demo: boolean; symbologies: string[] }

export function RawData({ days, country, demo, symbologies }: Props) {
  const [filters, setFilters] = useState<EventFilters>(EMPTY)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [scope, setScope] = useState(`${days}|${country}`)
  const [result, setResult] = useState<{ key: string; page: EventsPage | null; error: string | null } | null>(null)
  const [selected, setSelected] = useState<ScanEvent | null>(null)

  // Periodo o paese cambiati in alto: si riparte dalla prima pagina.
  if (scope !== `${days}|${country}`) {
    setScope(`${days}|${country}`)
    setPage(0)
  }

  // Ricerca libera con un attimo di attesa, per non interrogare a ogni tasto.
  useEffect(() => {
    if (filters.q === search) return
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, q: search }))
      setPage(0)
    }, 300)
    return () => clearTimeout(t)
  }, [search, filters.q])

  const requestKey = JSON.stringify({ days, country, filters, page, demo })
  useEffect(() => {
    let cancelled = false
    fetchEvents({ days, country, filters, limit: PAGE_SIZE, offset: page * PAGE_SIZE, demo })
      .then((p) => !cancelled && setResult({ key: requestKey, page: p, error: null }))
      .catch((e: Error) => !cancelled && setResult({ key: requestKey, page: null, error: e.message }))
    return () => {
      cancelled = true
    }
  }, [requestKey, days, country, filters, page, demo])

  const loading = result?.key !== requestKey
  const data = result?.page
  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const active = Object.entries(filters).filter(([k, v]) => k !== 'q' && v).length + (filters.q ? 1 : 0)

  function setFilter(key: keyof EventFilters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(0)
  }

  return (
    <Panel
      title="Tutte le scansioni"
      subtitle="Una riga per scansione, dalla più recente. Apri una riga per il dettaglio e la scheda attuale su Verified by GS1."
      className="raw-panel"
    >
      <div className="raw-filters">
        <label className="raw-search">
          <Search size={17} aria-hidden="true" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca codice, titolare, categoria, dominio" aria-label="Cerca nelle scansioni" />
        </label>
        <Select align="left" label="Simbologia" value={filters.symbology} onChange={(v) => setFilter('symbology', v)} options={[{ value: '', label: 'Tutte le simbologie' }, ...symbologies.map((s) => ({ value: s, label: s }))]} />
        <Select align="left" label="Esito GS1" value={filters.compliance} onChange={(v) => setFilter('compliance', v)} options={options('Ogni esito GS1', COMPLIANCE)} />
        <Select align="left" label="Verified by GS1" value={filters.vbg_state} onChange={(v) => setFilter('vbg_state', v)} options={options('Ogni esito VbG', VBG)} />
        <Select align="left" label="Link" value={filters.link_level} onChange={(v) => setFilter('link_level', v)} options={options('Con e senza link', LINK)} />
        <Select align="left" label="Origine" value={filters.source} onChange={(v) => setFilter('source', v)} options={options('Ogni origine', SOURCE)} />
        {active > 0 && (
          <button className="chip-btn" type="button" onClick={() => { setFilters(EMPTY); setSearch(''); setPage(0) }}>
            <X size={14} /> Azzera filtri
          </button>
        )}
      </div>

      {result?.error && result.key === requestKey ? (
        <p className="notice is-error" role="alert">{result.error}</p>
      ) : (
        <>
          <div className={`raw-table-wrap ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
            <table className="raw-table">
              <thead>
                <tr>
                  <th>Data e ora</th>
                  <th>Codice</th>
                  <th>Prodotto e titolare</th>
                  <th>Esito GS1</th>
                  <th>Verified by GS1</th>
                  <th>Regione</th>
                  <th><span className="visually-hidden">Dettaglio</span></th>
                </tr>
              </thead>
              <tbody>
                {data?.rows.map((e) => (
                  <tr key={e.id} onClick={() => setSelected(e)}>
                    <td className="raw-when">{dateTime(e.created_at)}</td>
                    <td className="raw-code">
                      <span className="raw-stack">
                        <small>{e.symbology ?? '–'}</small>
                        <code>{keyLabel(e) ?? e.link_domain ?? '–'}</code>
                      </span>
                    </td>
                    <td className="raw-product">
                      <span className="raw-stack">
                        {productLabel(e) && <b>{productLabel(e)}</b>}
                        {e.licensee_name && <small>{e.licensee_name}</small>}
                      </span>
                    </td>
                    <td><Status map={COMPLIANCE} value={e.compliance} /></td>
                    <td><Status map={VBG} value={e.vbg_state} /></td>
                    <td className="raw-region">{regionName(e.country, e.region_code, e.region)}</td>
                    <td className="raw-open">
                      <button className="chip-btn" type="button" onClick={(ev) => { ev.stopPropagation(); setSelected(e) }} aria-label={`Dettaglio della scansione del ${dateTime(e.created_at)}`}>
                        Dettaglio <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data && !data.rows.length && <p className="raw-empty">Nessuna scansione con questi filtri.</p>}
          </div>

          <footer className="raw-pager">
            <span>{total ? `${num(page * PAGE_SIZE + 1)}–${num(Math.min(total, (page + 1) * PAGE_SIZE))} di ${num(total)} scansioni` : loading ? 'Caricamento…' : '0 scansioni'}</span>
            <div>
              <button className="btn ghost icon-only" type="button" disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)} aria-label="Pagina precedente"><ChevronLeft size={18} /></button>
              <span className="raw-page">Pagina {page + 1} di {pages}</span>
              <button className="btn ghost icon-only" type="button" disabled={page + 1 >= pages || loading} onClick={() => setPage((p) => p + 1)} aria-label="Pagina successiva"><ChevronRight size={18} /></button>
            </div>
          </footer>
        </>
      )}

      {selected && createPortal(<EventDetail event={selected} demo={demo} onClose={() => setSelected(null)} />, document.body)}
    </Panel>
  )
}

/* ───── Dettaglio di una scansione: i dati salvati e la scheda attuale su Verified by GS1 ───── */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children ?? '–'}</dd>
    </div>
  )
}

const yesNo = (v: boolean | null) => (v == null ? '–' : v ? 'Sì' : 'No')

function EventDetail({ event: e, demo, onClose }: { event: ScanEvent; demo: boolean; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeBtn.current?.focus()
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus()
    }
  }, [onClose])

  useGSAP(
    () => {
      if (!motionOk()) return
      gsap.from('.drawer-backdrop', { opacity: 0, duration: 0.25 })
      gsap.from('.drawer', { xPercent: 100, duration: 0.45, ease: 'power3.out' })
    },
    { scope: root },
  )

  return (
    <div className="drawer-layer" ref={root}>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header className="drawer-head">
          <div>
            <p className="drawer-kicker">{dateTime(e.created_at)} · {SOURCE[e.source]}</p>
            <h2 id="drawer-title">{e.symbology ?? 'Scansione'}</h2>
            {keyLabel(e) && <code className="drawer-key">{keyLabel(e)}</code>}
          </div>
          <button ref={closeBtn} className="btn ghost icon-only" type="button" onClick={onClose} aria-label="Chiudi il dettaglio"><X size={18} /></button>
        </header>

        <div className="drawer-body">
          <div className="drawer-pills">
            <Status map={COMPLIANCE} value={e.compliance} />
            <Status map={VBG} value={e.vbg_state} />
            {e.link_domain && <Status map={LINK} value={e.link_level} />}
          </div>

          {canLookup(e.primary_ai) && e.primary_key && <LiveVbg ai={e.primary_ai!} value={e.primary_key} demo={demo} />}

          <section className="drawer-section">
            <h3>Il codice letto</h3>
            <dl className="drawer-dl">
              <Row label="Simbologia">{e.symbology}</Row>
              <Row label="Tipo">{e.is_2d == null ? 'Senza simbolo' : e.is_2d ? 'Codice 2D' : 'Barcode 1D'}</Row>
              <Row label="Chiave GS1">{e.primary_ai ? `AI (${e.primary_ai})` : null}</Row>
              <Row label="AI presenti">{e.ai_list?.length ? e.ai_list.map((a) => `(${a})`).join(' ') : null}</Row>
              <Row label="Cifra di controllo">{yesNo(e.check_digit_ok)}</Row>
              <Row label="Sintassi GS1 corretta">{yesNo(e.syntax_ok)}</Row>
              {e.syntax_error && <Row label="Errore di sintassi">{e.syntax_error}</Row>}
              <Row label="Prefisso emesso da">{e.issuer_mo}</Row>
            </dl>
          </section>

          <section className="drawer-section">
            <h3>Verified by GS1 al momento della scansione</h3>
            <dl className="drawer-dl">
              <Row label="Esito">{VBG[e.vbg_state ?? 'none'][0]}</Row>
              <Row label="Attributi essenziali">{e.vbg_core_count != null ? `${e.vbg_core_count}/7` : null}</Row>
              <Row label="Titolare">{e.licensee_name}</Row>
              <Row label="GS1 Company Prefix">{e.company_prefix}</Row>
              <Row label="GLN del titolare">{e.licensee_gln}</Row>
              <Row label="Licenza rilasciata da">{e.licensing_mo}</Row>
              <Row label="Categoria GPC">{e.gpc_brick_name ? `${e.gpc_brick_name} (${e.gpc_brick})` : null}</Row>
              {e.vbg_error_code && <Row label="Codice di errore">{e.vbg_error_code}</Row>}
            </dl>
          </section>

          {e.link_domain && (
            <section className="drawer-section">
              <h3>Link nel codice</h3>
              <dl className="drawer-dl">
                <Row label="Dominio"><code>{e.link_domain}</code></Row>
                <Row label="Valutazione">{LINK[e.link_level ?? 'pending'][0]}</Row>
                {e.link_imitates && <Row label="Imita"><code>{e.link_imitates}</code></Row>}
                {e.link_threats?.length ? <Row label="Google Web Risk">{e.link_threats.join(', ')}</Row> : null}
              </dl>
            </section>
          )}

          <section className="drawer-section">
            <h3>Contesto</h3>
            <dl className="drawer-dl">
              <Row label="Regione">{regionName(e.country, e.region_code, e.region)}</Row>
              <Row label="Dispositivo">{e.device === 'mobile' ? 'Telefono o tablet' : e.device === 'desktop' ? 'Computer' : null}</Row>
              <Row label="Versione dell’app">{e.app_version}</Row>
              <Row label="Identificativo">#{e.id}</Row>
            </dl>
          </section>
        </div>
      </aside>
    </div>
  )
}

/* Scheda attuale su Verified by GS1: consultazione che non entra nelle statistiche. */
function LiveVbg({ ai, value, demo }: { ai: string; value: string; demo: boolean }) {
  const key = `${ai}:${value}`
  const [state, setState] = useState<{ key: string; record: VbgRecord } | null>(null)

  useEffect(() => {
    let cancelled = false
    void lookup(ai, value).then((record) => !cancelled && setState({ key, record }))
    return () => {
      cancelled = true
    }
  }, [ai, value, key])

  const record = state?.key === key ? state.record : null

  return (
    <section className="live-vbg" aria-live="polite">
      <header>
        <h3>Scheda attuale su Verified by GS1</h3>
        <p>Consultazione diretta, esclusa dalle statistiche{demo ? '. Nella demo i codici sono di esempio: la scheda può non esistere.' : '.'}</p>
      </header>
      {!record ? (
        <div className="live-skeleton" aria-label="Consultazione in corso" />
      ) : record.state === 'verified' ? (
        <>
          <div className="live-product">
            <span className="live-image">
              {record.image ? <img src={record.image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <ImageOff size={26} aria-hidden="true" />}
            </span>
            <div>
              <b>{record.name}</b>
              {record.licensee && <small>{record.licensee.name}</small>}
              <span className="live-meta">
                {record.complete ? <StatusPill tone="good">Scheda completa</StatusPill> : <StatusPill tone="warning">Scheda incompleta</StatusPill>}
                {record.updated && <small>Aggiornata il {record.updated}</small>}
              </span>
            </div>
          </div>
          <ul className="core-list">
            {record.core.map((c) => (
              <li key={c.label} className={c.value ? 'is-present' : 'is-missing'}>
                <span>{c.label}</span>
                <b>{c.value ?? 'Mancante'}</b>
              </li>
            ))}
          </ul>
        </>
      ) : record.state === 'licensed' ? (
        <p className="live-note">Licenza GS1 valida{record.licensee ? ` (${record.licensee.name})` : ''}, ma il titolare non ha pubblicato la scheda del prodotto.</p>
      ) : (
        <p className="live-note">{record.message}{record.code ? ` (${record.code})` : ''}</p>
      )}
    </section>
  )
}
