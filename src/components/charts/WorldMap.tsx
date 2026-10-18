import { useMemo } from 'react'
import { countryName } from '../../lib/format'
import type { MapMetric } from '../../lib/stats'
import type { DashboardData } from '../../lib/types'
import world from '../../lib/world-countries.json'
import { Choropleth } from './Choropleth'

type Props = { data: NonNullable<DashboardData['paesi']>; metric: MapMetric; onMetric: (m: MapMetric) => void }

/** Mappa del mondo per paese (contorni Natural Earth, dominio pubblico). */
export function WorldMap({ data, metric, onMetric }: Props) {
  const stats = useMemo(() => new Map(data.map((c) => [c.country, c])), [data])
  return (
    <Choropleth
      className="is-world"
      shapes={world.countries}
      width={world.width}
      height={world.height}
      stats={stats}
      metric={metric}
      onMetric={onMetric}
      label="Mappa del mondo per paese"
      nameOf={(s) => countryName(s.code)}
    />
  )
}
