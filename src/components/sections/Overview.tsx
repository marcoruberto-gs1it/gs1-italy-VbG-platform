import { ChevronRight, ShieldAlert } from 'lucide-react'
import type { Period } from '../../lib/config'
import { num, pct } from '../../lib/format'
import { pctNum, prevShare, share } from '../../lib/stats'
import type { DashboardData, Kpi } from '../../lib/types'
import { RippleArt } from '../illustrations'
import { Counter, Delta } from '../ui'

type Props = { data: DashboardData; previous: Kpi | null; period: Period; country: string }

/** Panoramica: frase di sintesi del periodo e indicatori principali con il confronto. */
export function Overview({ data, previous, period, country }: Props) {
  const k = data.kpi
  // Senza scansioni nel periodo precedente un confronto sarebbe fuorviante: non lo mostriamo.
  const prev = previous && previous.letture > 0 ? previous : null
  const regions = data.regioni.filter((r) => r.country === 'IT' && r.region_code).length

  return (
    <section id="panoramica" className="section">
      <div className="hero">
        <div className="hero-copy">
          <p className="eyebrow light">Panoramica · {period.label}{country ? ' · Italia' : ''}</p>
          <h1><Counter value={k.letture} format={num} /> scansioni {period.long}</h1>
          <p className="hero-text">
            {num(k.prodotti_distinti)} prodotti diversi in {regions} {regions === 1 ? 'regione' : 'regioni'}. Il <b>{pct(k.letture_2d, k.letture_simbolo)}</b> dei codici letti è 2D
            e il <b>{pct(k.conformi, k.letture_simbolo)}</b> rispetta gli standard GS1.
            {k.allerte_link > 0 && <> <b className="hero-alert">{num(k.allerte_link)} {k.allerte_link === 1 ? 'allerta' : 'allerte'}</b> di brand protection da verificare.</>}
          </p>
          <div className="hero-actions">
            <a className="btn light" href="#adozione">Esplora l’adozione 2D <ChevronRight size={17} /></a>
            {k.allerte_link > 0 && <a className="btn outline-light" href="#protezione"><ShieldAlert size={16} /> Vedi le allerte</a>}
          </div>
        </div>
        <RippleArt />
      </div>

      <div className="kpis">
        <article className="kpi">
          <p className="kpi-label">Scansioni</p>
          <p className="kpi-value"><Counter value={k.letture} format={num} /></p>
          {prev ? <Delta now={k.letture} before={prev.letture} good="neutral" /> : <span className="delta is-neutral">Periodo precedente senza dati</span>}
        </article>
        <article className="kpi">
          <p className="kpi-label">Quota codici 2D</p>
          <p className="kpi-value"><Counter value={share(k.letture_2d, k.letture_simbolo) * 100} format={pctNum} /></p>
          <Delta now={share(k.letture_2d, k.letture_simbolo)} before={prevShare(prev?.letture_2d, prev?.letture_simbolo)} mode="points" good="up" />
        </article>
        <article className="kpi">
          <p className="kpi-label">Conformi agli standard GS1</p>
          <p className="kpi-value"><Counter value={share(k.conformi, k.letture_simbolo) * 100} format={pctNum} /></p>
          <Delta now={share(k.conformi, k.letture_simbolo)} before={prevShare(prev?.conformi, prev?.letture_simbolo)} mode="points" good="up" />
        </article>
        <article className="kpi">
          <p className="kpi-label">Schede VbG complete (7/7)</p>
          <p className="kpi-value"><Counter value={share(k.schede_complete, k.schede_valutate) * 100} format={pctNum} /></p>
          <Delta now={share(k.schede_complete, k.schede_valutate)} before={prevShare(prev?.schede_complete, prev?.schede_valutate)} mode="points" good="up" />
        </article>
        <article className={`kpi ${k.allerte_link ? 'is-alert' : ''}`}>
          <p className="kpi-label">Allerte di brand protection</p>
          <p className="kpi-value"><Counter value={k.allerte_link} format={num} /></p>
          <Delta now={k.allerte_link} before={prev?.allerte_link} good="down" />
        </article>
      </div>
    </section>
  )
}
