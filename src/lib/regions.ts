import { cityName, countryName, flag, num, pct, regionName } from './format'
import type { MapMetric } from './stats'
import type { DashboardData } from './types'

export type RankedRow = { key: string; label: string; value: number; note: string }

type Area = { letture: number; letture_2d: number }
const share2d = (r: Area) => (r.letture ? r.letture_2d / r.letture : 0)

/** Ordina per scansioni o per quota 2D e prepara le righe di una classifica. */
function rank<T extends Area>(rows: T[], metric: MapMetric, limit: number, key: (r: T) => string, label: (r: T) => string): RankedRow[] {
  const sorted = metric === 'letture'
    ? [...rows].sort((a, b) => b.letture - a.letture)
    : rows.filter((r) => r.letture > 0).sort((a, b) => share2d(b) - share2d(a) || b.letture - a.letture)
  return sorted.slice(0, limit).map((r) => ({
    key: key(r),
    label: label(r),
    value: metric === 'letture' ? r.letture : share2d(r),
    note: metric === 'letture' ? `2D ${pct(r.letture_2d, r.letture)}` : `${num(r.letture_2d)} su ${num(r.letture)}`,
  }))
}

/** Classifica delle regioni (di un paese o di tutti), per la misura scelta. */
export function regionRanking(regions: DashboardData['regioni'], metric: MapMetric, limit = 8): RankedRow[] {
  return rank(regions, metric, limit, (r) => `${r.country}-${r.region_code}`, (r) => regionName(r.country, r.region_code, r.region))
}

/** Classifica delle città approssimative, con regione e bandiera del paese. */
export function cityRanking(cities: NonNullable<DashboardData['citta']>, metric: MapMetric, limit = 10): RankedRow[] {
  return rank(cities, metric, limit, (c) => `${c.country}-${c.city}`, (c) => `${flag(c.country)} ${cityName(c.city)} · ${regionName(c.country, c.region_code, c.region)}`.trim())
}

/** Classifica dei paesi, con bandiera e nome in italiano. */
export function countryRanking(countries: NonNullable<DashboardData['paesi']>, metric: MapMetric, limit = 10): RankedRow[] {
  return rank(countries, metric, limit, (c) => c.country, (c) => `${flag(c.country)} ${countryName(c.country)}`.trim())
}
