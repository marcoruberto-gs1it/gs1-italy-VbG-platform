import { useMemo } from 'react'
import italy from '../../lib/italy-regions.json'
import type { MapMetric } from '../../lib/stats'
import type { DashboardData } from '../../lib/types'
import { Choropleth } from './Choropleth'
import { t } from '../../i18n'

type Props = { data: DashboardData['regioni']; metric: MapMetric; onMetric: (m: MapMetric) => void; toolbar?: boolean }

/** Mappa d'Italia per regione (confini ISTAT). */
export function ItalyMap({ data, metric, onMetric, toolbar }: Props) {
  const stats = useMemo(() => new Map(data.filter((r) => r.country === 'IT' && r.region_code).map((r) => [r.region_code as string, r])), [data])
  return <Choropleth shapes={italy.regions} width={italy.width} height={italy.height} stats={stats} metric={metric} onMetric={onMetric} label={t('Mappa d’Italia per regione')} toolbar={toolbar} />
}
