/* Dati grezzi: una pagina di scansioni filtrate (database o dati dimostrativi). */
import { demoEvents } from './demo'
import { supabase } from './supabase'
import type { EventFilters, EventsPage } from './types'

export type EventsQuery = { days: number; country: string; filters: EventFilters; limit: number; offset: number; demo: boolean }

export async function fetchEvents({ days, country, filters, limit, offset, demo }: EventsQuery): Promise<EventsPage> {
  if (demo) return demoEvents(Math.min(days, 90), filters, limit, offset)
  const to = new Date()
  const from = new Date(to.getTime() - days * 86_400_000)
  const { data, error } = await supabase.rpc('dashboard_events', {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_country: country || null,
    p_filters: filters,
    p_limit: limit,
    p_offset: offset,
  })
  if (error) {
    // La funzione non esiste ancora: va eseguito supabase/raw-data.sql.
    if (error.code === 'PGRST202' || error.code === '42883') throw new Error('La tabella dei dati grezzi non è ancora attiva sul database (manca supabase/raw-data.sql).')
    throw new Error(error.message)
  }
  return data as EventsPage
}
