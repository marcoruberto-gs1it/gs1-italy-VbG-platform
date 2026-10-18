import { useState } from 'react'
import { cityName, countryName, num, pct, regionName } from '../../lib/format'
import { cityRanking, countryRanking, regionRanking } from '../../lib/regions'
import type { MapMetric } from '../../lib/stats'
import type { DashboardData } from '../../lib/types'
import { BarList, DataTable, Empty, ItalyMap, RegionTable, WorldMap, type BarRow } from '../charts'
import { Panel, SectionHeader } from '../ui'

const percent = (v: number) => `${(Math.round(v * 1000) / 10).toLocaleString('it-IT')}%`

function Ranking({ title, rows, metric }: { title: string; rows: BarRow[]; metric: MapMetric }) {
  return (
    <div className="map-side">
      <h4>{title} {metric === 'letture' ? 'per scansioni' : 'per quota 2D'}</h4>
      {metric === 'letture' ? <BarList rows={rows} /> : <BarList rows={rows} color="var(--series-2)" max={1} format={percent} />}
    </div>
  )
}

/** Dove si scansiona: mondo per paese, Italia per regione (o le regioni del paese scelto in alto). */
export function Territory({ data, country }: { data: DashboardData; country: string }) {
  const [worldMetric, setWorldMetric] = useState<MapMetric>('letture')
  const [italyMetric, setItalyMetric] = useState<MapMetric>('letture')
  const [cityMetric, setCityMetric] = useState<MapMetric>('letture')
  const cities = data.citta ?? []
  const countries = data.paesi ?? []
  const total = countries.reduce((a, c) => a + c.letture, 0)
  const italy = countries.find((c) => c.country === 'IT')?.letture ?? 0
  const showItaly = !country || country === 'IT'

  return (
    <section className="section">
      <SectionHeader id="territorio" title="Dove si scansiona" />

      {countries.length > 0 && (
        <Panel
          title="Nel mondo"
          subtitle={`${num(countries.length)} ${countries.length === 1 ? 'paese' : 'paesi'} nel periodo; dall’estero il ${pct(total - italy, total)} delle scansioni. Vale per tutti i paesi, qualunque sia il filtro in alto.`}
          className="map-panel"
          table={
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
          }
        >
          <div className="map-layout is-world">
            <WorldMap data={countries} metric={worldMetric} onMetric={setWorldMetric} />
            <Ranking title="Classifica dei paesi" rows={countryRanking(countries, worldMetric)} metric={worldMetric} />
          </div>
          <p className="map-source">Paese dedotto dalla connessione. Confini: Natural Earth (dominio pubblico).</p>
        </Panel>
      )}

      {showItaly ? (
        <Panel
          title="In Italia"
          subtitle="Regione dedotta dalla connessione: con le reti mobili può risultare la sede del gestore."
          className="map-panel"
          table={<RegionTable data={data.regioni.filter((r) => r.country === 'IT')} />}
        >
          <div className="map-layout">
            <ItalyMap data={data.regioni} metric={italyMetric} onMetric={setItalyMetric} />
            <Ranking title="Classifica delle regioni" rows={regionRanking(data.regioni.filter((r) => r.country === 'IT'), italyMetric)} metric={italyMetric} />
          </div>
          <p className="map-source">Confini regionali: ISTAT, CC BY 4.0</p>
        </Panel>
      ) : (
        <Panel title={`Regioni: ${countryName(country)}`} subtitle="Regione dedotta dalla connessione." table={<RegionTable data={data.regioni} />}>
          <Ranking title="Classifica delle regioni" rows={regionRanking(data.regioni, italyMetric)} metric={italyMetric} />
        </Panel>
      )}

      <Panel
        title="Città"
        subtitle="Città approssimativa, dedotta dalla connessione (non dal GPS): con le reti mobili spesso è la città del gestore. Solo città con almeno 5 scansioni."
        table={
          <DataTable
            rows={cities}
            rowKey={(c) => `${c.country}-${c.city}`}
            empty="Nessuna città con almeno 5 scansioni nel periodo."
            columns={[
              { label: 'Città', render: (c) => cityName(c.city) },
              { label: 'Regione', render: (c) => regionName(c.country, c.region_code, c.region) },
              { label: 'Paese', render: (c) => countryName(c.country) },
              { label: 'Scansioni', render: (c) => num(c.letture), numeric: true },
              { label: 'Quota 2D', render: (c) => pct(c.letture_2d, c.letture), numeric: true },
            ]}
          />
        }
      >
        {cities.length ? (
          <div className="city-panel">
            <div className="segmented small" role="radiogroup" aria-label="Misura delle città">
              {(['letture', 'quota'] as const).map((m) => (
                <button key={m} type="button" role="radio" aria-checked={cityMetric === m} className={cityMetric === m ? 'is-active' : ''} onClick={() => setCityMetric(m)}>
                  {m === 'letture' ? 'Scansioni' : 'Quota 2D'}
                </button>
              ))}
            </div>
            <Ranking title="Classifica delle città" rows={cityRanking(cities, cityMetric)} metric={cityMetric} />
          </div>
        ) : (
          <Empty text="Nessuna città con almeno 5 scansioni nel periodo: la città viene registrata dalle scansioni più recenti." />
        )}
      </Panel>
    </section>
  )
}
