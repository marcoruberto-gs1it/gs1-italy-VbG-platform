import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { COMPLIANCE_LABELS, LINK_LABELS, SOURCE_LABELS, VBG_LABELS, keyLabel, productLabel, type LabelMap } from '../../../lib/eventLabels'
import { fetchEvents } from '../../../lib/events'
import { dateTime, num, regionName } from '../../../lib/format'
import type { EventFilters, EventsPage, ScanEvent } from '../../../lib/types'
import { Panel, Select, type SelectOption } from '../../ui'
import { EventDetail } from './EventDetail'
import { EventStatus } from './EventStatus'

const PAGE_SIZE = 25
const EMPTY: EventFilters = { q: '', symbology: '', compliance: '', vbg_state: '', link_level: '', source: '' }

const options = (all: string, map: LabelMap | Record<string, string>): SelectOption<string>[] => [
  { value: '', label: all },
  ...Object.entries(map).map(([value, v]) => ({ value, label: typeof v === 'string' ? v : v[0] })),
]

type Props = { days: number; country: string; demo: boolean; symbologies: string[] }

/** Dati grezzi: tutte le scansioni del periodo, filtrabili, con il dettaglio di ciascuna. */
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
        <Select align="left" label="Esito GS1" value={filters.compliance} onChange={(v) => setFilter('compliance', v)} options={options('Ogni esito GS1', COMPLIANCE_LABELS)} />
        <Select align="left" label="Verified by GS1" value={filters.vbg_state} onChange={(v) => setFilter('vbg_state', v)} options={options('Ogni esito VbG', VBG_LABELS)} />
        <Select align="left" label="Link" value={filters.link_level} onChange={(v) => setFilter('link_level', v)} options={options('Con e senza link', LINK_LABELS)} />
        <Select align="left" label="Origine" value={filters.source} onChange={(v) => setFilter('source', v)} options={options('Ogni origine', SOURCE_LABELS)} />
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
                    <td><EventStatus map={COMPLIANCE_LABELS} value={e.compliance} /></td>
                    <td><EventStatus map={VBG_LABELS} value={e.vbg_state} /></td>
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

