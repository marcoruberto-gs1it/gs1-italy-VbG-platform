import { num, pct, regionName } from './format'
import type { MapMetric } from './stats'
import type { DashboardData } from './types'

export type RankedRegion = { key: string; label: string; value: number; note: string }

type Region = DashboardData['regioni'][number]

const regionKey = (r: Region) => `${r.country}-${r.region_code}`
const share2d = (r: Region) => (r.letture ? r.letture_2d / r.letture : 0)

/** Righe della classifica accanto alla mappa, secondo la misura scelta. */
export function regionRanking(regions: Region[], metric: MapMetric, limit = 8): RankedRegion[] {
  if (metric === 'letture') {
    return regions.slice(0, limit).map((r) => ({ key: regionKey(r), label: regionName(r.country, r.region_code, r.region), value: r.letture, note: `2D ${pct(r.letture_2d, r.letture)}` }))
  }
  return regions
    .filter((r) => r.letture > 0)
    .sort((a, b) => share2d(b) - share2d(a) || b.letture - a.letture)
    .slice(0, limit)
    .map((r) => ({ key: regionKey(r), label: regionName(r.country, r.region_code, r.region), value: share2d(r), note: `${num(r.letture_2d)} su ${num(r.letture)}` }))
}

