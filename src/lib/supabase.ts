import { createClient } from '@supabase/supabase-js'

// Chiave "publishable": è pensata per stare nel browser. I dati sono protetti dalla
// funzione dashboard_data, che risponde solo agli utenti in dashboard_users.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const configured = Boolean(url && key)

export const supabase = createClient(url ?? 'https://invalid.supabase.co', key ?? 'missing', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
})
