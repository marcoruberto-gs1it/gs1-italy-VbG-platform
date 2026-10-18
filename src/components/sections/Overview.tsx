import { useState, type FormEvent, type ReactNode } from 'react'
import { BadgeCheck, Factory, Globe2, LayoutGrid, MapPinned, Newspaper, Package, Search, Store } from 'lucide-react'
import { useAudience } from '../../hooks/useAudience'
import { AUDIENCES, type AudienceId } from '../../lib/audiences'
import type { Period } from '../../lib/config'
import { fillDays } from '../../lib/days'
import { countryName, flag, num, numShort, pct } from '../../lib/format'
import { pctNum, prevShare, share } from '../../lib/stats'
import type { DashboardData, Kpi } from '../../lib/types'
import { Meter, MiniStack, Sparkline } from '../charts'
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

type CardProps = { label: string; value: ReactNode; full?: string; delta: ReactNode; visual: ReactNode; caption: ReactNode; risk?: boolean; alert?: boolean }

/** Card della panoramica: stessa anatomia per tutte (etichetta, valore, confronto, grafico, nota). */
function KpiCard({ label, value, full, delta, visual, caption, risk = false, alert = false }: CardProps) {
  return (
    <article className={`kpi ${risk ? 'is-risk' : ''} ${alert ? 'is-alert' : ''}`}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value" title={full}>{value}</p>
      <div className="kpi-delta">{delta}</div>
      <div className="kpi-visual">{visual}</div>
      <p className="kpi-caption">{caption}</p>
    </article>
  )
}

/** Ricerca del proprio prefisso aziendale (vista Produttori): apre i dati grezzi già filtrati. */
function PrefixFinder({ onFind }: { onFind: (prefix: string) => void }) {
  const [value, setValue] = useState('')
  const digits = value.replace(/\D/g, '')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (digits.length >= 6) onFind(digits)
  }
  return (
    <form className="prefix-finder" onSubmit={submit}>
      <label htmlFor="prefix" className="visually-hidden">Il tuo GS1 Company Prefix</label>
      <input id="prefix" inputMode="numeric" autoComplete="off" placeholder="Il tuo GS1 Company Prefix, es. 8012345" value={value} onChange={(e) => setValue(e.target.value)} />
      <button className="btn primary" type="submit" disabled={digits.length < 6}><Search size={16} /> Vedi le tue scansioni</button>
    </form>
  )
}

/** Panoramica: intestazione compatta, vista per pubblico e i sei numeri chiave in due gruppi. */
export function Overview({ data, previous, period, days, country, onAudience, onFindPrefix }: Props) {
  const audience = useAudience()
  const k = data.kpi
  // Senza scansioni nel periodo precedente un confronto sarebbe fuorviante: non lo mostriamo.
  const prev = previous && previous.letture > 0 ? previous : null
  const countries = k.paesi ?? data.paesi?.length ?? 0
  const inactive = k.licenze_non_attive ?? 0
  const daily = fillDays(data.giornaliero, Math.min(days, 90))
  const c = data.conformita
  const noPrev = <span className="delta is-neutral">nessun dato precedente</span>
  const AudienceIcon = AUDIENCE_ICONS[audience]

  return (
    <section id="panoramica" className="section overview">
      <header className="ov-head reveal">
        <div className="ov-title">
          <p className="eyebrow">Panoramica · {period.label}</p>
          <h1>
            <span className="ov-number" title={`${num(k.letture)} scansioni`}><Counter value={k.letture} format={numShort} /></span>
            <span className="ov-unit">scansioni {period.long}</span>
          </h1>
          <ul className="ov-meta" aria-label="In sintesi">
            <li>{country ? <span aria-hidden="true">{flag(country)}</span> : <Globe2 size={15} aria-hidden="true" />} {country ? countryName(country) : 'Tutto il mondo'}</li>
            <li><Package size={15} aria-hidden="true" /> {numShort(k.prodotti_distinti)} prodotti diversi</li>
            {!country && countries > 0 && <li><MapPinned size={15} aria-hidden="true" /> {num(countries)} {countries === 1 ? 'paese' : 'paesi'}</li>}
          </ul>
        </div>
        <div className="ov-view">
          <span className="ov-view-label" id="vista-label">Vista per</span>
          <Select label="Vista per" value={audience} onChange={onAudience} options={AUDIENCE_OPTIONS} />
        </div>
      </header>

      {audience !== 'tutti' && (
        <div className="audience-note reveal">
          <span className="audience-icon"><AudienceIcon size={18} /></span>
          <p>{AUDIENCES.find((a) => a.id === audience)?.lead} Le sezioni sono in ordine di utilità per questa vista.</p>
          {audience === 'produttori' && <PrefixFinder onFind={onFindPrefix} />}
        </div>
      )}

      <div className="ov-grid">
        <h2 className="ov-group-title g-use">Uso e qualità <span>{prev ? `variazioni rispetto ai ${period.label} precedenti` : 'nessun periodo precedente da confrontare'}</span></h2>
        <h2 className="ov-group-title g-risk">Rischi da verificare</h2>

        <KpiCard
          label="Scansioni"
          value={<Counter value={k.letture} format={numShort} />}
          full={num(k.letture)}
          delta={prev ? <Delta now={k.letture} before={prev.letture} good="neutral" /> : noPrev}
          visual={<Sparkline values={daily.map((d) => d.letture_1d + d.letture_2d + d.manuali)} label="Andamento giornaliero delle scansioni" />}
          caption="andamento giornaliero"
        />
        <KpiCard
          label="Quota codici 2D"
          value={<Counter value={share(k.letture_2d, k.letture_simbolo) * 100} format={pctNum} />}
          delta={prev ? <Delta now={share(k.letture_2d, k.letture_simbolo)} before={prevShare(prev.letture_2d, prev.letture_simbolo)} mode="points" good="up" /> : noPrev}
          visual={<Meter value={share(k.letture_2d, k.letture_simbolo)} color="var(--series-2)" label={`Codici 2D: ${pct(k.letture_2d, k.letture_simbolo)}`} />}
          caption={<>{numShort(k.letture_2d)} su {numShort(k.letture_simbolo)}</>}
        />
        <KpiCard
          label="Conformi agli standard GS1"
          value={<Counter value={share(k.conformi, k.letture_simbolo) * 100} format={pctNum} />}
          delta={prev ? <Delta now={share(k.conformi, k.letture_simbolo)} before={prevShare(prev.conformi, prev.letture_simbolo)} mode="points" good="up" /> : noPrev}
          visual={
            <MiniStack
              label="Ripartizione per conformità agli standard GS1"
              parts={[
                { value: c.gs1 ?? 0, color: 'var(--good)', title: 'Codice Standard GS1' },
                { value: c.partial ?? 0, color: 'var(--warning)', title: 'Non standard' },
                { value: c.error ?? 0, color: 'var(--critical)', title: 'Con errori' },
                { value: c.none ?? 0, color: 'var(--neutral-bar)', title: 'Non GS1' },
              ]}
            />
          }
          caption={<><a href="#qualita">{numShort((c.error ?? 0) + (c.partial ?? 0))}</a> da correggere</>}
        />
        <KpiCard
          label="Schede VbG complete"
          value={<Counter value={share(k.schede_complete, k.schede_valutate) * 100} format={pctNum} />}
          delta={prev ? <Delta now={share(k.schede_complete, k.schede_valutate)} before={prevShare(prev.schede_complete, prev.schede_valutate)} mode="points" good="up" /> : noPrev}
          visual={<Meter value={share(k.schede_complete, k.schede_valutate)} label={`Schede complete: ${pct(k.schede_complete, k.schede_valutate)}`} />}
          caption="7 informazioni su 7"
        />
        <KpiCard
          risk
          alert={k.allerte_link > 0}
          label="Allerte di brand protection"
          value={<Counter value={k.allerte_link} format={numShort} />}
          full={num(k.allerte_link)}
          delta={prev ? <Delta now={k.allerte_link} before={prev.allerte_link} good="down" /> : noPrev}
          visual={
            <MiniStack
              label="Allerte: link sospetti e domini non riconosciuti"
              parts={[
                { value: k.link_sospetti, color: 'var(--critical)', title: 'Link sospetti' },
                { value: Math.max(0, k.allerte_link - k.link_sospetti), color: 'var(--warning)', title: 'Domini non riconosciuti' },
              ]}
            />
          }
          caption={k.allerte_link ? <><a href="#protezione">{numShort(k.link_sospetti)} link sospetti</a></> : 'nessun link estraneo'}
        />
        <KpiCard
          risk
          alert={inactive > 0}
          label="Licenza GS1 non attiva"
          value={<Counter value={inactive} format={numShort} />}
          full={num(inactive)}
          delta={prev ? <Delta now={inactive} before={prev.licenze_non_attive} good="down" /> : noPrev}
          visual={<Meter value={share(inactive, k.verificati)} color="var(--critical)" label={`Licenze non attive: ${pct(inactive, k.verificati)} dei prodotti verificati`} />}
          caption={inactive ? <><a href="#protezione">{pct(inactive, k.verificati)}</a> dei verificati</> : 'tutte attive'}
        />
      </div>
    </section>
  )
}
