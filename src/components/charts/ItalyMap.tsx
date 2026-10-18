import { useMemo } from 'react'
import italy from '../../lib/italy-regions.json'
import type { MapMetric } from '../../lib/stats'
import type { DashboardData } from '../../lib/types'
import { Choropleth } from './Choropleth'

type Props = { data: DashboardData['regioni']; metric: MapMetric; onMetric: (m: MapMetric) => void }

/** Mappa d'Italia per regione (confini ISTAT). */
export function ItalyMap({ data, metric, onMetric }: Props) {
  const stats = useMemo(() => new Map(data.filter((r) => r.country === 'IT' && r.region_code).map((r) => [r.region_code as string, r])), [data])
  return <Choropleth shapes={italy.regions} width={italy.width} height={italy.height} stats={stats} metric={metric} onMetric={onMetric} label="Mappa d’Italia per regione" />
}
