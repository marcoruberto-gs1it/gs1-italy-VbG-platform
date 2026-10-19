import { useState } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { cityName, countryName, dec1, flag, num, pct, regionName } from '../../lib/format'
import { cityRanking, countryRanking, regionRanking } from '../../lib/regions'
import type { MapMetric } from '../../lib/stats'
import type { DashboardData } from '../../lib/types'
import { BarList, DataTable, Empty, ItalyMap, MetricSwitch, WorldMap } from '../charts'
import { Panel, SectionHeader } from '../ui'
import { t } from '../../i18n'

type Tab = 'aree' | 'citta'

const percent = (v: number) => `${dec1(v * 100)}%`

type Props = { data: DashboardData; country: string; onCountry: (country: string) => void }

/**
 * Dove si scansiona. L'area è quella scelta nella barra in alto (unica per tutta la pagina):
 * mondo → mappa del mondo e classifica dei paesi, dove ogni paese porta al suo dettaglio;
 * un paese → mappa del paese (regioni per l'Italia) e classifica di regioni o città.
 */
export function Territory({ data, country, onCountry }: Props) {
  const [metric, setMetric] = useState<MapMetric>('letture')
  const [tab, setTab] = useState<Tab>('aree')
  const countries = data.paesi ?? []
  const isWorld = !country
  const regions = data.regioni.filter((r) => r.country === country)
  const cities = (data.citta ?? []).filter((c) => isWorld || c.country === country)
  const total = countries.reduce((a, c) => a + c.letture, 0)
  const italy = countries.find((c) => c.country === 'IT')?.letture ?? 0

  const rows = tab === 'citta' ? cityRanking(cities, metric) : isWorld ? countryRanking(countries, metric) : regionRanking(regions, metric, 8, false)
  const subtitle = isWorld
    ? t('{countries} nel periodo; dall’estero il {pct} delle scansioni. Scegli un paese per vederne regioni e città.', {
        countries: countries.length === 1 ? t('1 paese') : t('{n} paesi', { n: num(countries.length) }),
        pct: pct(total - italy, total),
      })
    : t('Regioni e città dedotte dalla connessione: con le reti mobili spesso indicano la sede del gestore.')

  const table =
    tab === 'citta' ? (
      <DataTable
        rows={cities}
        rowKey={(c) => `${c.country}-${c.city}`}
        empty={t('Nessuna città nel periodo.')}
        columns={[
          { label: t('Città'), render: (c) => cityName(c.city) },
          { label: t('Regione'), render: (c) => regionName(c.country, c.region_code, c.region) },
          { label: t('Scansioni'), render: (c) => num(c.letture), numeric: true },
          { label: t('Quota 2D'), render: (c) => pct(c.letture_2d, c.letture), numeric: true },
        ]}
      />
    ) : isWorld ? (
      <DataTable
        rows={countries}
        rowKey={(c) => c.country}
        columns={[
          { label: t('Paese'), render: (c) => countryName(c.country) },
          { label: t('Scansioni'), render: (c) => num(c.letture), numeric: true },
          { label: t('Quota 2D'), render: (c) => pct(c.letture_2d, c.letture), numeric: true },
          { label: t('Conformi GS1'), render: (c) => pct(c.conformi, c.letture), numeric: true },
        ]}
      />
    ) : (
      <DataTable
        rows={regions}
        rowKey={(r) => `${r.country}-${r.region_code}`}
        columns={[
          { label: t('Regione'), render: (r) => (r.country === 'IT' ? regionName(r.country, r.region_code, r.region) : r.region ?? r.region_code) },
          { label: t('Scansioni'), render: (r) => num(r.letture), numeric: true },
          { label: t('Quota 2D'), render: (r) => pct(r.letture_2d, r.letture), numeric: true },
          { label: t('Conformi GS1'), render: (r) => pct(r.conformi, r.letture), numeric: true },
        ]}
      />
    )

  return (
    <section className="section">
      <SectionHeader id="territorio" title={t('Dove si scansiona')} />
      <Panel title={isWorld ? 'Mondo' : `${flag(country)} ${countryName(country)}`.trim()} subtitle={subtitle} className="map-panel" table={table}>
        <div className="territory-tools">
          {!isWorld && (
            <button className="chip-btn" type="button" onClick={() => onCountry('')}>
              <ArrowLeft size={14} /> Mondo
            </button>
          )}
          <MetricSwitch metric={metric} onMetric={setMetric} />
        </div>
        <div className={`map-layout ${country === 'IT' ? '' : 'is-world'}`}>
          {country === 'IT' ? (
            <ItalyMap data={data.regioni} metric={metric} onMetric={setMetric} toolbar={false} />
          ) : (
            <WorldMap data={countries} metric={metric} onMetric={setMetric} focus={country || undefined} toolbar={false} />
          )}
          <div className="map-side">
            <div className="segmented small territory-tabs" role="tablist" aria-label={t('Classifica')}>
              {(['aree', 'citta'] as const).map((tb) => (
                <button key={tb} type="button" role="tab" aria-selected={tab === tb} className={tab === tb ? 'is-active' : ''} onClick={() => setTab(tb)}>
                  {tb === 'aree' ? (isWorld ? t('Paesi') : t('Regioni')) : t('Città')}
                </button>
              ))}
            </div>
            {rows.length ? (
              <BarList
                rows={rows}
                color={metric === 'letture' ? undefined : 'var(--series-2)'}
                max={metric === 'letture' ? undefined : 1}
                format={metric === 'letture' ? undefined : percent}
                onSelect={isWorld && tab === 'aree' ? onCountry : undefined}
                selectLabel={(r) => t('Vedi {name}: regioni e città', { name: r.label })}
              />
            ) : (
              <Empty text={tab === 'citta' ? t('Nessuna città nel periodo.') : t('Nessuna regione nel periodo.')} />
            )}
            {isWorld && tab === 'aree' && rows.length > 0 && <p className="map-source"><ChevronRight size={12} /> {t('Clicca un paese per vederne regioni e città.')}</p>}
            {tab === 'citta' && rows.length > 0 && <p className="map-source">{t('Città approssimativa, dedotta dalla connessione: con le reti mobili spesso è quella del gestore.')}</p>}
          </div>
        </div>
        <p className="map-source">{country === 'IT' ? t('Confini regionali: ISTAT, CC BY 4.0.') : t('Confini: Natural Earth (dominio pubblico).')} {t('Posizione dedotta dalla connessione, non dal GPS.')}</p>
      </Panel>
    </section>
  )
}
