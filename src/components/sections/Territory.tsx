import { useState } from 'react'
import { regionRanking } from '../../lib/regions'
import type { MapMetric } from '../../lib/stats'
import type { DashboardData } from '../../lib/types'
import { BarList, ItalyMap, RegionTable } from '../charts'
import { Panel, SectionHeader } from '../ui'

const percent = (v: number) => `${(Math.round(v * 1000) / 10).toLocaleString('it-IT')}%`

/** Dove si scansiona: mappa delle regioni e classifica, per scansioni o per quota 2D. */
export function Territory({ data }: { data: DashboardData }) {
  const [metric, setMetric] = useState<MapMetric>('letture')
  const rows = regionRanking(data.regioni, metric)
  return (
    <section className="section">
      <SectionHeader id="territorio" title="Dove si scansiona" text="Regione dedotta da Cloudflare dalla connessione: con le reti mobili può risultare la sede del gestore." />
      <Panel title="Mappa delle regioni" className="map-panel" table={<RegionTable data={data.regioni} />}>
        <div className="map-layout">
          <ItalyMap data={data.regioni} metric={metric} onMetric={setMetric} />
          <div className="map-side">
            <h4>{metric === 'letture' ? 'Classifica per scansioni' : 'Classifica per quota 2D'}</h4>
            {metric === 'letture' ? <BarList rows={rows} /> : <BarList rows={rows} color="var(--series-2)" max={1} format={percent} />}
          </div>
        </div>
        <p className="map-source">Confini regionali: ISTAT, CC BY 4.0</p>
      </Panel>
    </section>
  )
}
