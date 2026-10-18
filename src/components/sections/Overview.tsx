import { useState, type FormEvent } from 'react'
import { BadgeCheck, Factory, LayoutGrid, Newspaper, Search, Store } from 'lucide-react'
import { useAudience } from '../../hooks/useAudience'
import { AUDIENCES, whyFor, type AudienceId } from '../../lib/audiences'
import type { Period } from '../../lib/config'
import { fillDays } from '../../lib/days'
import { num, pct } from '../../lib/format'
import { pctNum, prevShare, share } from '../../lib/stats'
import type { DashboardData, Kpi } from '../../lib/types'
import { MiniRing, MiniStack, Sparkline } from '../charts'
import { Counter, Delta, Select } from '../ui'

const AUDIENCE_ICONS = { tutti: LayoutGrid, gs1: BadgeCheck, produttori: Factory, distributori: Store, stampa: Newspaper } as const
const AUDIENCE_OPTIONS = AUDIENCES.map((a) => ({ value: a.id, label: a.label, hint: a.lead, icon: AUDIENCE_ICONS[a.id] }))

type Props = {
  data: DashboardData
  previous: Kpi | null
  period: Period
  days: number
  country: string
  onAudience: (a: AudienceId) => void
  onFindPrefix: (prefix: string) => void
}

/** Ricerca del proprio prefisso aziendale (vista Produttori): apre i dati grezzi già filtrati. */
function PrefixFinder({ onFind }: { onFind: (prefix: string) => void }) {
  const [value, setValue] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const prefix = value.replace(/\D/g, '')
    if (prefix.length >= 6) onFind(prefix)
  }
  return (
    <form className="prefix-finder" onSubmit={submit}>
      <label htmlFor="prefix">Il tuo GS1 Company Prefix</label>
      <div className="prefix-row">
        <input id="prefix" inputMode="numeric" autoComplete="off" placeholder="es. 8012345" value={value} onChange={(e) => setValue(e.target.value)} />
        <button className="btn primary" type="submit" disabled={value.replace(/\D/g, '').length < 6}><Search size={16} /> Vedi le tue scansioni</button>
      </div>
    </form>
  )
}

/** Panoramica: sintesi del periodo, scelta della vista e i numeri più importanti con un grafico ciascuno. */
export function Overview({ data, previous, period, days, country, onAudience, onFindPrefix }: Props) {
  const audience = useAudience()
  const k = data.kpi
  // Senza scansioni nel periodo precedente un confronto sarebbe fuorviante: non lo mostriamo.
  const prev = previous && previous.letture > 0 ? previous : null
  const regions = data.regioni.filter((r) => r.country === 'IT' && r.region_code).length
  const daily = fillDays(data.giornaliero, Math.min(days, 90))
  const c = data.conformita

  return (
    <section id="panoramica" className="section">
      <header className="overview-head reveal">
        <div className="overview-title">
          <p className="eyebrow">Osservatorio Verified by GS1 · {period.label}{country ? ' · Italia' : ''}</p>
          <h1><Counter value={k.letture} format={num} /> scansioni {period.long}</h1>
          <p className="overview-lead">
            {num(k.prodotti_distinti)} prodotti diversi in {regions} {regions === 1 ? 'regione' : 'regioni'}. {whyFor('panoramica', audience)}
          </p>
        </div>
        <div className="overview-view">
          <span className="overview-view-label">Vista per</span>
          <Select label="Vista per" value={audience} onChange={onAudience} options={AUDIENCE_OPTIONS} />
        </div>
      </header>

      {audience !== 'tutti' && (
        <div className="audience-note reveal">
          <p>{AUDIENCES.find((a) => a.id === audience)?.lead} Le sezioni sono in ordine di utilità per questa vista.</p>
          {audience === 'produttori' && <PrefixFinder onFind={onFindPrefix} />}
        </div>
      )}

      <div className="kpis">
        <article className="kpi">
          <p className="kpi-label">Scansioni</p>
          <p className="kpi-value"><Counter value={k.letture} format={num} /></p>
          {prev ? <Delta now={k.letture} before={prev.letture} good="neutral" /> : <span className="delta is-neutral">Periodo precedente senza dati</span>}
          <div className="kpi-chart">
            <Sparkline values={daily.map((d) => d.letture_1d + d.letture_2d + d.manuali)} label="Andamento giornaliero delle scansioni" />
            <small>andamento giornaliero</small>
          </div>
        </article>
        <article className="kpi">
          <p className="kpi-label">Quota codici 2D</p>
          <p className="kpi-value"><Counter value={share(k.letture_2d, k.letture_simbolo) * 100} format={pctNum} /></p>
          <Delta now={share(k.letture_2d, k.letture_simbolo)} before={prevShare(prev?.letture_2d, prev?.letture_simbolo)} mode="points" good="up" />
          <div className="kpi-chart is-ring">
            <MiniRing value={share(k.letture_2d, k.letture_simbolo)} label={`Codici 2D: ${pct(k.letture_2d, k.letture_simbolo)}`} />
            <small>{num(k.letture_2d)} codici 2D su {num(k.letture_simbolo)}</small>
          </div>
        </article>
        <article className="kpi">
          <p className="kpi-label">Conformi agli standard GS1</p>
          <p className="kpi-value"><Counter value={share(k.conformi, k.letture_simbolo) * 100} format={pctNum} /></p>
          <Delta now={share(k.conformi, k.letture_simbolo)} before={prevShare(prev?.conformi, prev?.letture_simbolo)} mode="points" good="up" />
          <div className="kpi-chart">
            <MiniStack
              label="Ripartizione per conformità agli standard GS1"
              parts={[
                { value: c.gs1 ?? 0, color: 'var(--good)', title: 'Codice Standard GS1' },
                { value: c.partial ?? 0, color: 'var(--warning)', title: 'Non standard' },
                { value: c.error ?? 0, color: 'var(--critical)', title: 'Con errori' },
                { value: c.none ?? 0, color: 'var(--neutral-bar)', title: 'Non GS1' },
              ]}
            />
            <small>{num((c.error ?? 0) + (c.partial ?? 0))} con errori o non standard</small>
          </div>
        </article>
        <article className="kpi">
          <p className="kpi-label">Schede VbG complete (7/7)</p>
          <p className="kpi-value"><Counter value={share(k.schede_complete, k.schede_valutate) * 100} format={pctNum} /></p>
          <Delta now={share(k.schede_complete, k.schede_valutate)} before={prevShare(prev?.schede_complete, prev?.schede_valutate)} mode="points" good="up" />
          <div className="kpi-chart is-ring">
            <MiniRing value={share(k.schede_complete, k.schede_valutate)} color="var(--series-1)" label={`Schede complete: ${pct(k.schede_complete, k.schede_valutate)}`} />
            <small>{num(k.schede_complete)} schede con tutti i 7 dati</small>
          </div>
        </article>
        <article className={`kpi ${k.allerte_link ? 'is-alert' : ''}`}>
          <p className="kpi-label">Allerte di brand protection</p>
          <p className="kpi-value"><Counter value={k.allerte_link} format={num} /></p>
          <Delta now={k.allerte_link} before={prev?.allerte_link} good="down" />
          <div className="kpi-chart">
            <MiniStack
              label="Allerte: link sospetti e domini non riconosciuti"
              parts={[
                { value: k.link_sospetti, color: 'var(--critical)', title: 'Link sospetti' },
                { value: Math.max(0, k.allerte_link - k.link_sospetti), color: 'var(--warning)', title: 'Domini non riconosciuti' },
              ]}
            />
            <small>{k.allerte_link ? <><a href="#protezione">{num(k.link_sospetti)} link sospetti</a> da verificare</> : 'nessun link verso siti estranei'}</small>
          </div>
        </article>
      </div>
    </section>
  )
}
