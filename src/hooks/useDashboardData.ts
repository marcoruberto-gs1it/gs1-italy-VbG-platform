import { useCallback, useEffect, useMemo, useState } from 'react'
import { demoData, demoPrevious } from '../lib/demo'
import { supabase } from '../lib/supabase'
import type { DashboardData, Kpi } from '../lib/types'

type Query = { days: number; country: string; demo: boolean; signedIn: boolean }

type Result = {
  key: string
  data: DashboardData | null
  previous: Kpi | null
  error: string | null
  forbidden: boolean
}

export type DashboardState = {
  data: DashboardData | null
  previous: Kpi | null
  loading: boolean
  error: string | null
  forbidden: boolean
  reload: () => void
}

/**
 * Dati della dashboard per periodo e paese: periodo corrente e periodo precedente di pari durata
 * (per i confronti), richiesti in parallelo. In modalità demo i dati sono generati nel browser.
 */
export function useDashboardData({ days, country, demo, signedIn }: Query): DashboardState {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const key = `${days}|${country}|${attempt}`

  const demoResult = useMemo(() => {
    if (!demo) return null
    const data = demoData(Math.min(days, 90))
    return { data, previous: demoPrevious(data.kpi) }
  }, [demo, days])

  useEffect(() => {
    if (demo || !signedIn) return
    let cancelled = false
    const to = new Date()
    const from = new Date(to.getTime() - days * 86_400_000)
    const before = new Date(from.getTime() - days * 86_400_000)
    const call = (a: Date, b: Date) =>
      supabase.rpc('dashboard_data', { p_from: a.toISOString(), p_to: b.toISOString(), p_country: country || null })

    Promise.all([call(from, to), call(before, from)])
      .then(([current, prev]) => {
        if (cancelled) return
        if (current.error) {
          const forbidden = current.error.code === '42501'
          setResult({ key, data: null, previous: null, forbidden, error: forbidden ? null : `Impossibile caricare i dati: ${current.error.message}` })
          return
        }
        setResult({ key, data: current.data as DashboardData, previous: prev.error ? null : (prev.data as DashboardData).kpi, error: null, forbidden: false })
      })
      .catch((e: unknown) => {
        if (!cancelled) setResult({ key, data: null, previous: null, forbidden: false, error: `Impossibile caricare i dati: ${e instanceof Error ? e.message : String(e)}` })
      })
    return () => {
      cancelled = true
    }
  }, [demo, signedIn, days, country, key])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  if (demoResult) return { ...demoResult, loading: false, error: null, forbidden: false, reload }
  const fresh = result?.key === key
  return {
    // Durante un nuovo caricamento restano visibili i dati precedenti (niente salti nella pagina).
    data: result?.data ?? null,
    previous: result?.previous ?? null,
    loading: signedIn && !fresh,
    error: fresh ? result.error : null,
    forbidden: Boolean(fresh && result.forbidden),
    reload,
  }
}
