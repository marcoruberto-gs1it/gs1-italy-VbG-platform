import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { COMPLIANCE_LABELS, LICENCE_LABELS, LINK_LABELS, SOURCE_LABELS, VBG_LABELS, keyLabel, productLabel, type LabelMap } from '../../../lib/eventLabels'
import { isLicenceInactive } from '../../../lib/licence'
import { fetchEvents } from '../../../lib/events'
import { dateTime, num, regionName } from '../../../lib/format'
import type { EventFilters, EventsPage, ScanEvent } from '../../../lib/types'
import { Panel, Select, StatusPill, type SelectOption } from '../../ui'
import { EventDetail } from './EventDetail'
import { EventStatus } from './EventStatus'
import { t } from '../../../i18n'
import { symbologyName } from '../../../lib/symbology'

const PAGE_SIZE = 25
const EMPTY: EventFilters = { q: '', symbology: '', compliance: '', vbg_state: '', link_level: '', source: '', licence: '' }

const options = (all: string, map: LabelMap | Record<string, string>): SelectOption<string>[] => [
  { value: '', label: all },
  ...Object.entries(map).map(([value, v]) => ({ value, label: typeof v === 'string' ? v : t(v[0]) })),
]

type Props = { days: number; country: string; demo: boolean; symbologies: string[]; initialSearch?: string }

/** Dati grezzi: tutte le scansioni del periodo, filtrabili, con il dettaglio di ciascuna. */
export function RawData({ days, country, demo, symbologies, initialSearch = '' }: Props) {
  const [filters, setFilters] = useState<EventFilters>({ ...EMPTY, q: initialSearch })
  const [search, setSearch] = useState(initialSearch)
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
    const timer = setTimeout(() => {
      setFilters((f) => ({ ...f, q: search }))
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
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
      title={t('Tutte le scansioni')}
      subtitle={t('Una riga per scansione, dalla più recente. Apri una riga per il dettaglio e la scheda attuale su Verified by GS1.')}
      className="raw-panel"
    >
      <div className="raw-filters">
        <label className="raw-search">
          <Search size={17} aria-hidden="true" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Cerca codice, titolare, categoria, dominio')} aria-label={t('Cerca nelle scansioni')} />
        </label>
        <Select align="left" label={t('Simbologia')} value={filters.symbology} onChange={(v) => setFilter('symbology', v)} options={[{ value: '', label: t('Tutte le simbologie') }, ...symbologies.map((s) => ({ value: s, label: symbologyName(s) }))]} />
        <Select align="left" label={t('Esito GS1')} value={filters.compliance} onChange={(v) => setFilter('compliance', v)} options={options(t('Ogni esito GS1'), COMPLIANCE_LABELS)} />
        <Select align="left" label={t('Verified by GS1')} value={filters.vbg_state} onChange={(v) => setFilter('vbg_state', v)} options={options(t('Ogni esito VbG'), VBG_LABELS)} />
        <Select align="left" label={t('Link')} value={filters.link_level} onChange={(v) => setFilter('link_level', v)} options={options('Con e senza link', LINK_LABELS)} />
        <Select align="left" label={t('Licenza GS1')} value={filters.licence} onChange={(v) => setFilter('licence', v)} options={options(t('Ogni licenza'), LICENCE_LABELS)} />
        <Select align="left" label={t('Origine')} value={filters.source} onChange={(v) => setFilter('source', v)} options={options(t('Ogni origine'), SOURCE_LABELS)} />
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
                  <th>{t('Data e ora')}</th>
                  <th>{t('Codice')}</th>
                  <th>{t('Prodotto e titolare')}</th>
                  <th>{t('Esito GS1')}</th>
                  <th>Verified by GS1</th>
                  <th>{t('Regione')}</th>
                  <th><span className="visually-hidden">{t('Dettaglio')}</span></th>
                </tr>
              </thead>
              <tbody>
                {data?.rows.map((e) => (
                  <tr key={e.id} className={isLicenceInactive(e.vbg_licence_status, e.vbg_record_status) ? 'is-flagged' : undefined} onClick={() => setSelected(e)}>
                    <td className="raw-when">{dateTime(e.created_at)}</td>
                    <td className="raw-code">
                      <span className="raw-stack">
                        <small>{symbologyName(e.symbology)}</small>
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
                    <td>
                      <span className="raw-pills">
                        <EventStatus map={VBG_LABELS} value={e.vbg_state} />
                        {isLicenceInactive(e.vbg_licence_status, e.vbg_record_status) && <StatusPill tone="critical">{t('Licenza non attiva')}</StatusPill>}
                      </span>
                    </td>
                    <td className="raw-region">{regionName(e.country, e.region_code, e.region)}</td>
                    <td className="raw-open">
                      <button className="chip-btn" type="button" onClick={(ev) => { ev.stopPropagation(); setSelected(e) }} aria-label={t('Dettaglio della scansione del {when}', { when: dateTime(e.created_at) })}>
                        {t('Dettaglio')} <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data && !data.rows.length && <p className="raw-empty">{t('Nessuna scansione con questi filtri.')}</p>}
          </div>

          <footer className="raw-pager">
            <span>{total ? t('{from}–{to} di {total} scansioni', { from: num(page * PAGE_SIZE + 1), to: num(Math.min(total, (page + 1) * PAGE_SIZE)), total: num(total) }) : loading ? t('Caricamento…') : t('0 scansioni')}</span>
            <div>
              <button className="btn ghost icon-only" type="button" disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)} aria-label={t('Pagina precedente')}><ChevronLeft size={18} /></button>
              <span className="raw-page">{t('Pagina {n} di {total}', { n: page + 1, total: pages })}</span>
              <button className="btn ghost icon-only" type="button" disabled={page + 1 >= pages || loading} onClick={() => setPage((p) => p + 1)} aria-label={t('Pagina successiva')}><ChevronRight size={18} /></button>
            </div>
          </footer>
        </>
      )}

      {selected && createPortal(<EventDetail event={selected} demo={demo} onClose={() => setSelected(null)} />, document.body)}
    </Panel>
  )
}

