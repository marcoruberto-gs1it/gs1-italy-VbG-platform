import { useState } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { cityName, countryName, flag, num, pct, regionName } from '../../lib/format'
import { cityRanking, countryRanking, regionRanking } from '../../lib/regions'
import type { MapMetric } from '../../lib/stats'
import type { DashboardData } from '../../lib/types'
import { BarList, DataTable, Empty, ItalyMap, MetricSwitch, WorldMap } from '../charts'
import { Panel, SectionHeader } from '../ui'

type Tab = 'aree' | 'citta'

const percent = (v: number) => `${(Math.round(v * 1000) / 10).toLocaleString('it-IT')}%`

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
    ? `${num(countries.length)} ${countries.length === 1 ? 'paese' : 'paesi'} nel periodo; dall’estero il ${pct(total - italy, total)} delle scansioni. Scegli un paese per vederne regioni e città.`
    : 'Regioni e città dedotte dalla connessione: con le reti mobili spesso indicano la sede del gestore.'

  const table =
    tab === 'citta' ? (
      <DataTable
        rows={cities}
        rowKey={(c) => `${c.country}-${c.city}`}
        empty="Nessuna città nel periodo."
        columns={[
          { label: 'Città', render: (c) => cityName(c.city) },
          { label: 'Regione', render: (c) => regionName(c.country, c.region_code, c.region) },
          { label: 'Scansioni', render: (c) => num(c.letture), numeric: true },
          { label: 'Quota 2D', render: (c) => pct(c.letture_2d, c.letture), numeric: true },
        ]}
      />
    ) : isWorld ? (
      <DataTable
        rows={countries}
        rowKey={(c) => c.country}
        columns={[
          { label: 'Paese', render: (c) => countryName(c.country) },
          { label: 'Scansioni', render: (c) => num(c.letture), numeric: true },
          { label: 'Quota 2D', render: (c) => pct(c.letture_2d, c.letture), numeric: true },
          { label: 'Conformi GS1', render: (c) => pct(c.conformi, c.letture), numeric: true },
        ]}
      />
    ) : (
      <DataTable
        rows={regions}
        rowKey={(r) => `${r.country}-${r.region_code}`}
        columns={[
          { label: 'Regione', render: (r) => (r.country === 'IT' ? regionName(r.country, r.region_code, r.region) : r.region ?? r.region_code) },
          { label: 'Scansioni', render: (r) => num(r.letture), numeric: true },
          { label: 'Quota 2D', render: (r) => pct(r.letture_2d, r.letture), numeric: true },
          { label: 'Conformi GS1', render: (r) => pct(r.conformi, r.letture), numeric: true },
        ]}
      />
    )

  return (
    <section className="section">
      <SectionHeader id="territorio" title="Dove si scansiona" />
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
            <div className="segmented small territory-tabs" role="tablist" aria-label="Classifica">
              {(['aree', 'citta'] as const).map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>
                  {t === 'aree' ? (isWorld ? 'Paesi' : 'Regioni') : 'Città'}
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
                selectLabel={(r) => `Vedi ${r.label}: regioni e città`}
              />
            ) : (
              <Empty text={tab === 'citta' ? 'Nessuna città nel periodo.' : 'Nessuna regione nel periodo.'} />
            )}
            {isWorld && tab === 'aree' && rows.length > 0 && <p className="map-source"><ChevronRight size={12} /> Clicca un paese per vederne regioni e città.</p>}
            {tab === 'citta' && rows.length > 0 && <p className="map-source">Città approssimativa, dedotta dalla connessione: con le reti mobili spesso è quella del gestore.</p>}
          </div>
        </div>
        <p className="map-source">{country === 'IT' ? 'Confini regionali: ISTAT, CC BY 4.0.' : 'Confini: Natural Earth (dominio pubblico).'} Posizione dedotta dalla connessione, non dal GPS.</p>
      </Panel>
    </section>
  )
}
