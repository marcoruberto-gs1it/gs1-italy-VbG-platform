import { useState } from 'react'
import { Globe2 } from 'lucide-react'
import { cityName, countryName, flag, num, pct, regionName } from '../../lib/format'
import { cityRanking, countryRanking, regionRanking } from '../../lib/regions'
import type { MapMetric } from '../../lib/stats'
import type { DashboardData } from '../../lib/types'
import { BarList, DataTable, Empty, ItalyMap, MetricSwitch, WorldMap } from '../charts'
import { Panel, SectionHeader, Select } from '../ui'

const WORLD = 'world'
type Tab = 'aree' | 'citta'

const percent = (v: number) => `${(Math.round(v * 1000) / 10).toLocaleString('it-IT')}%`

/**
 * Dove si scansiona, in un unico riquadro: si sceglie l'area (mondo o un paese), la misura
 * (scansioni o quota 2D) e, accanto alla mappa, la classifica di paesi/regioni o città.
 */
export function Territory({ data, country }: { data: DashboardData; country: string }) {
  const countries = data.paesi ?? []
  const [chosen, setChosen] = useState<string>(WORLD)
  const [metric, setMetric] = useState<MapMetric>('letture')
  const [tab, setTab] = useState<Tab>('aree')
  // Con un paese scelto nel filtro in alto, l'area è quel paese (gli altri dati non sono caricati).
  const area = country || chosen
  const isWorld = area === WORLD

  const regions = data.regioni.filter((r) => r.country === area)
  const cities = (data.citta ?? []).filter((c) => isWorld || c.country === area)
  const total = countries.reduce((a, c) => a + c.letture, 0)
  const italy = countries.find((c) => c.country === 'IT')?.letture ?? 0

  const areaOptions = [
    ...(country ? [] : [{ value: WORLD, label: 'Mondo', hint: 'Tutti i paesi', icon: Globe2 }]),
    ...[...new Set([...(country ? [country] : ['IT']), ...(country ? [] : countries.map((c) => c.country))])].map((code) => ({
      value: code,
      label: `${flag(code)} ${countryName(code)}`.trim(),
      hint: code === 'IT' ? 'Regioni e città' : undefined,
    })),
  ]

  const rows = tab === 'citta' ? cityRanking(cities, metric) : isWorld ? countryRanking(countries, metric) : regionRanking(regions, metric, 8, false)
  const areaLabel = isWorld ? 'Paesi' : 'Regioni'
  const subtitle = isWorld
    ? `${num(countries.length)} ${countries.length === 1 ? 'paese' : 'paesi'} nel periodo; dall’estero il ${pct(total - italy, total)} delle scansioni.`
    : `${countryName(area)}: regioni e città dedotte dalla connessione (con le reti mobili spesso è la sede del gestore).`

  const table =
    tab === 'citta' ? (
      <DataTable
        rows={cities}
        rowKey={(c) => `${c.country}-${c.city}`}
        empty="Nessuna città con almeno 5 scansioni nel periodo."
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
      <Panel title="Mappa" subtitle={subtitle} className="map-panel" table={table}>
        <div className="territory-tools">
          <Select align="left" label="Area" value={area} onChange={setChosen} options={areaOptions} />
          <MetricSwitch metric={metric} onMetric={setMetric} />
          {country && <span className="territory-note">Area fissata dal filtro paese in alto.</span>}
        </div>
        <div className={`map-layout ${isWorld || area !== 'IT' ? 'is-world' : ''}`}>
          {area === 'IT' ? (
            <ItalyMap data={data.regioni} metric={metric} onMetric={setMetric} toolbar={false} />
          ) : (
            <WorldMap data={countries} metric={metric} onMetric={setMetric} focus={isWorld ? undefined : area} toolbar={false} />
          )}
          <div className="map-side">
            <div className="segmented small territory-tabs" role="tablist" aria-label="Classifica">
              {(['aree', 'citta'] as const).map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>
                  {t === 'aree' ? areaLabel : 'Città'}
                </button>
              ))}
            </div>
            {rows.length ? (
              metric === 'letture' ? <BarList rows={rows} /> : <BarList rows={rows} color="var(--series-2)" max={1} format={percent} />
            ) : (
              <Empty text={tab === 'citta' ? 'Nessuna città con almeno 5 scansioni nel periodo.' : 'Nessuna regione per quest’area nel periodo.'} />
            )}
            {tab === 'citta' && rows.length > 0 && <p className="map-source">Solo città con almeno 5 scansioni, per riservatezza.</p>}
          </div>
        </div>
        <p className="map-source">{area === 'IT' ? 'Confini regionali: ISTAT, CC BY 4.0.' : 'Confini: Natural Earth (dominio pubblico).'} Posizione dedotta dalla connessione, non dal GPS.</p>
      </Panel>
    </section>
  )
}
