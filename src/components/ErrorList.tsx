import { Empty } from './charts'
import { InfoPopover, StatusPill } from './ui'
import { explain, reasonsFromCounts } from '../lib/errors'
import { gtinDisplay, num, pct } from '../lib/format'
import type { DashboardData, ErrorReason } from '../lib/types'

const TONE: Record<ErrorReason['tipo'], 'critical' | 'warning'> = { cifra: 'critical', sintassi: 'critical', non_standard: 'warning' }
const TAG: Record<ErrorReason['tipo'], string> = { cifra: 'Cifra di controllo', sintassi: 'Sintassi GS1', non_standard: 'Non standard' }

/* Aziende con errori: per ciascuna, i motivi spiegati in italiano con la correzione da fare. */
export function ErrorList({ rows }: { rows: DashboardData['qualita'] }) {
  if (!rows.length) return <Empty text="Nessun errore nel periodo." />
  return (
    <ul className="err-list">
      {rows.map((q) => {
        const reasons = q.motivi?.length ? q.motivi : reasonsFromCounts(q)
        return (
          <li key={q.company_prefix} className="err-company">
            <header className="err-head">
              <div>
                <b>{q.titolare ?? 'Titolare non disponibile'}</b>
                <small>Prefisso {q.company_prefix} · {num(q.letture)} scansioni</small>
              </div>
              <StatusPill tone={q.errori / q.letture > 0.03 ? 'critical' : 'warning'}>{num(q.errori)} con errori · {pct(q.errori, q.letture)}</StatusPill>
            </header>
            <ul className="err-reasons">
              {reasons.map((r, i) => {
                const e = explain(r)
                return (
                  <li key={`${r.tipo}-${r.simbologia}-${i}`} className={`err-reason is-${TONE[r.tipo]}`}>
                    <div className="err-reason-top">
                      <StatusPill tone={TONE[r.tipo]}>{TAG[r.tipo]}</StatusPill>
                      <span className="err-count">{num(r.letture)} {r.letture === 1 ? 'scansione' : 'scansioni'}</span>
                      <InfoPopover label={`Perché è un errore: ${e.title}`}>
                        <b className="info-title">{e.title}</b>
                        <span className="info-text">{e.detail}</span>
                        {e.original && <code className="err-original">{e.original}</code>}
                        <span className="info-text"><b>Come correggere:</b> {e.fix}</span>
                        {r.esempio && <span className="info-muted">Esempio: <code>{gtinDisplay(r.esempio)}</code></span>}
                      </InfoPopover>
                    </div>
                    <p className="err-title">{e.title}{r.simbologia && <span> · {r.simbologia}</span>}</p>
                  </li>
                )
              })}
            </ul>
          </li>
        )
      })}
    </ul>
  )
}
