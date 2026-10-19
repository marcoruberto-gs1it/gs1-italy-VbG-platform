import { useState, type FormEvent, type ReactNode } from 'react'
import { MapPinned, Package, Search } from 'lucide-react'
import { useAudience } from '../../hooks/useAudience'
import { AUDIENCE_ICONS, AUDIENCES } from '../../lib/audiences'
import type { Period } from '../../lib/config'
import { fillDays } from '../../lib/days'
import { countryName, num, numShort, pct } from '../../lib/format'
import { pctNum, prevShare, share } from '../../lib/stats'
import type { DashboardData, Kpi } from '../../lib/types'
import { Meter, MiniStack, Sparkline } from '../charts'
import { Counter, Delta } from '../ui'
import { t } from '../../i18n'

type Props = {
  data: DashboardData
  previous: Kpi | null
  period: Period
  days: number
  country: string
  onFindPrefix: (prefix: string) => void
}

type CardProps = { label: string; value: ReactNode; full?: string; delta: ReactNode; visual: ReactNode; caption: ReactNode; risk?: boolean; alert?: boolean }

/** Card della panoramica: stessa anatomia per tutte (etichetta, valore, confronto, grafico, nota). */
function KpiCard({ label, value, full, delta, visual, caption, risk = false, alert = false }: CardProps) {
  return (
    <article className={`kpi ${risk ? 'is-risk' : ''} ${alert ? 'is-alert' : ''}`}>
      <p className="kpi-label">{label}</p>
      <div className="kpi-main">
        <div className="kpi-main-row">
          <p className="kpi-value" title={full}>{value}</p>
          <div className="kpi-delta">{delta}</div>
        </div>
      </div>
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
      <label htmlFor="prefix" className="visually-hidden">{t('Il tuo GS1 Company Prefix')}</label>
      <input id="prefix" inputMode="numeric" autoComplete="off" placeholder={t('Il tuo GS1 Company Prefix, es. 8012345')} value={value} onChange={(e) => setValue(e.target.value)} />
      <button className="btn primary" type="submit" disabled={digits.length < 6}><Search size={16} /> {t('Vedi le tue scansioni')}</button>
    </form>
  )
}

/** Panoramica: intestazione compatta e i sei numeri chiave in due gruppi (periodo, area e vista sono nella barra in alto). */
export function Overview({ data, previous, period, days, country, onFindPrefix }: Props) {
  const audience = useAudience()
  const k = data.kpi
  // Senza scansioni nel periodo precedente un confronto sarebbe fuorviante: non lo mostriamo.
  const prev = previous && previous.letture > 0 ? previous : null
  const countries = k.paesi ?? data.paesi?.length ?? 0
  const inactive = k.licenze_non_attive ?? 0
  const daily = fillDays(data.giornaliero, Math.min(days, 90))
  const c = data.conformita
  const noPrev = <span className="delta is-neutral">{t('nessun dato precedente')}</span>
  const AudienceIcon = AUDIENCE_ICONS[audience]

  return (
    <section id="panoramica" className="section overview">
      <header className="ov-head reveal">
        <div className="ov-title">
          <h1>{t('Panoramica')}</h1>
          <p className="ov-lead">
            {period.long[0].toUpperCase() + period.long.slice(1)} · {country ? countryName(country) : t('tutto il mondo')}
          </p>
          <ul className="ov-meta" aria-label={t('In sintesi')}>
            <li><Package size={15} aria-hidden="true" /> {t('{n} prodotti diversi', { n: numShort(k.prodotti_distinti) })}</li>
            {!country && countries > 0 && <li><a href="#territorio"><MapPinned size={15} aria-hidden="true" /> {countries === 1 ? t('1 paese') : t('{n} paesi', { n: num(countries) })}</a></li>}
          </ul>
        </div>
      </header>

      {audience !== 'tutti' && (
        <div className="audience-note reveal">
          <span className="audience-icon"><AudienceIcon size={18} /></span>
          <p>{AUDIENCES.find((a) => a.id === audience)?.lead} {t('Le sezioni sono in ordine di utilità per questa vista.')}</p>
          {audience === 'produttori' && <PrefixFinder onFind={onFindPrefix} />}
        </div>
      )}

      <div className="ov-grid">
        <h2 className="ov-group-title g-use">{t('Numeri chiave')} <span>{prev ? t('variazioni rispetto ai {period} precedenti', { period: period.label }) : t('nessun periodo precedente da confrontare')}</span></h2>

        <KpiCard
          label={t('Scansioni')}
          value={<Counter value={k.letture} format={numShort} />}
          full={num(k.letture)}
          delta={prev ? <Delta now={k.letture} before={prev.letture} good="neutral" /> : noPrev}
          visual={<Sparkline color="var(--navy)" values={daily.map((d) => d.letture_1d + d.letture_2d + d.manuali)} label={t('Andamento giornaliero delle scansioni')} />}
          caption={t('al giorno')}
        />
        <KpiCard
          label={t('Quota codici 2D')}
          value={<Counter value={share(k.letture_2d, k.letture_simbolo) * 100} format={pctNum} />}
          delta={prev ? <Delta now={share(k.letture_2d, k.letture_simbolo)} before={prevShare(prev.letture_2d, prev.letture_simbolo)} mode="points" good="up" /> : noPrev}
          visual={<Meter value={share(k.letture_2d, k.letture_simbolo)} color="var(--orange)" label={t('Codici 2D: {pct}', { pct: pct(k.letture_2d, k.letture_simbolo) })} />}
          caption={t('{a} su {b}', { a: numShort(k.letture_2d), b: numShort(k.letture_simbolo) })}
        />
        <KpiCard
          label={t('Conformi agli standard GS1')}
          value={<Counter value={share(k.conformi, k.letture_simbolo) * 100} format={pctNum} />}
          delta={prev ? <Delta now={share(k.conformi, k.letture_simbolo)} before={prevShare(prev.conformi, prev.letture_simbolo)} mode="points" good="up" /> : noPrev}
          visual={
            <MiniStack
              label={t('Ripartizione per conformità agli standard GS1')}
              parts={[
                { value: c.gs1 ?? 0, color: 'var(--navy)', title: t('Codice Standard GS1') },
                { value: c.partial ?? 0, color: 'var(--peach)', title: t('Non standard') },
                { value: c.error ?? 0, color: 'var(--orange)', title: t('Con errori') },
                { value: c.none ?? 0, color: 'var(--sky)', title: t('Non GS1') },
              ]}
            />
          }
          caption={<><a href="#qualita">{numShort((c.error ?? 0) + (c.partial ?? 0))}</a> {t('da correggere')}</>}
        />
        <KpiCard
          label={t('Schede VbG complete')}
          value={<Counter value={share(k.schede_complete, k.schede_valutate) * 100} format={pctNum} />}
          delta={prev ? <Delta now={share(k.schede_complete, k.schede_valutate)} before={prevShare(prev.schede_complete, prev.schede_valutate)} mode="points" good="up" /> : noPrev}
          visual={<Meter value={share(k.schede_complete, k.schede_valutate)} color="var(--navy)" label={t('Schede complete: {pct}', { pct: pct(k.schede_complete, k.schede_valutate) })} />}
          caption={t('7 informazioni su 7')}
        />
        <KpiCard
          risk
          alert={k.allerte_link > 0}
          label={t('Allerte di brand protection')}
          value={<Counter value={k.allerte_link} format={numShort} />}
          full={num(k.allerte_link)}
          delta={prev ? <Delta now={k.allerte_link} before={prev.allerte_link} good="down" /> : noPrev}
          visual={
            <MiniStack
              label={t('Allerte: link sospetti e domini non riconosciuti')}
              parts={[
                { value: k.link_sospetti, color: 'var(--orange)', title: t('Link sospetti') },
                { value: Math.max(0, k.allerte_link - k.link_sospetti), color: 'var(--peach)', title: t('Domini non riconosciuti') },
              ]}
            />
          }
          caption={k.allerte_link ? <><a href="#protezione">{t('{n} link sospetti', { n: numShort(k.link_sospetti) })}</a></> : t('nessun link estraneo')}
        />
        <KpiCard
          risk
          alert={inactive > 0}
          label={t('Licenza GS1 non attiva')}
          value={<Counter value={inactive} format={numShort} />}
          full={num(inactive)}
          delta={prev ? <Delta now={inactive} before={prev.licenze_non_attive} good="down" /> : noPrev}
          visual={<Meter value={share(inactive, k.verificati)} color="var(--orange)" label={t('Licenze non attive: {pct} dei prodotti verificati', { pct: pct(inactive, k.verificati) })} />}
          caption={inactive ? <><a href="#protezione">{pct(inactive, k.verificati)}</a> {t('dei verificati')}</> : t('tutte attive')}
        />
      </div>
    </section>
  )
}
