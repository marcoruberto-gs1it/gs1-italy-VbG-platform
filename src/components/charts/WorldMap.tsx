import { useMemo } from 'react'
import { t } from '../../i18n'
import { countryName } from '../../lib/format'
import type { MapMetric } from '../../lib/stats'
import type { DashboardData } from '../../lib/types'
import world from '../../lib/world-countries.json'
import { shapeViewBox } from '../../lib/geo'
import { Choropleth } from './Choropleth'

type Props = { data: NonNullable<DashboardData['paesi']>; metric: MapMetric; onMetric: (m: MapMetric) => void; focus?: string; toolbar?: boolean }

/** Mappa del mondo per paese (contorni Natural Earth, dominio pubblico); con `focus` ingrandisce un paese. */
export function WorldMap({ data, metric, onMetric, focus, toolbar }: Props) {
  const stats = useMemo(() => new Map(data.map((c) => [c.country, c])), [data])
  const shape = focus ? world.countries.find((c) => c.code === focus) : undefined
  return (
    <Choropleth
      className={`is-world ${shape ? 'is-zoomed' : ''}`}
      shapes={world.countries}
      width={world.width}
      height={world.height}
      stats={stats}
      metric={metric}
      onMetric={onMetric}
      label={shape ? t('Mappa: {country}', { country: countryName(focus!) }) : t('Mappa del mondo per paese')}
      nameOf={(s) => countryName(s.code)}
      viewBox={shape ? shapeViewBox(shape.d) : undefined}
      focus={shape?.code}
      toolbar={toolbar}
    />
  )
}
