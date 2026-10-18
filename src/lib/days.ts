import type { DashboardData } from './types'

/** Ogni giorno del periodo ha il suo posto sull'asse, anche senza scansioni. */
export function fillDays(rows: DashboardData['giornaliero'], days: number) {
  const byDay = new Map(rows.map((r) => [r.giorno, r]))
  const today = new Date()
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return byDay.get(key) ?? { giorno: key, letture_2d: 0, letture_1d: 0, manuali: 0 }
  })
}
