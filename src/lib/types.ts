export type Kpi = {
  letture: number
  letture_simbolo: number
  letture_2d: number
  conformi: number
  con_errori: number
  non_gs1: number
  prodotti_distinti: number
  verificati: number
  schede_valutate: number
  schede_complete: number
  allerte_link: number
  link_sospetti: number
}

export type DashboardData = {
  kpi: Kpi
  giornaliero: { giorno: string; letture_2d: number; letture_1d: number; manuali: number }[]
  regioni: { country: string | null; region_code: string | null; region: string | null; letture: number; letture_2d: number; conformi: number }[]
  simbologie: { simbologia: string; is_2d: boolean | null; letture: number }[]
  conformita: Partial<Record<'gs1' | 'error' | 'partial' | 'manual' | 'none', number>>
  categorie: { gpc_brick: string; categoria: string | null; segmento: string | null; letture: number; gtin_distinti: number; media_dati: number | null; schede_complete: number; letture_2d: number }[]
  qualita: { company_prefix: string; titolare: string | null; letture: number; errori_cifra: number; errori_sintassi: number; non_standard: number; errori: number; motivi?: ErrorReason[] }[]
  errori_sintassi: { errore: string; letture: number }[]
  /** Classifica dei marchi (assente nelle versioni del database precedenti alla colonna brand_name). */
  brand?: { brand: string; titolare: string | null; letture: number; prodotti: number; media_dati: number | null; schede_complete: number; letture_2d: number }[]
  allerte: { company_prefix: string | null; titolare: string | null; gtin: string; dominio: string; somiglia_a: string | null; sospetto: boolean; segnalato_google: boolean; letture: number; ultima: string; regioni: string[] | null }[]
  non_assegnati: { inizio_codice: string; letture: number; codici: number; ultima: string }[]
  domini: { dominio: string; letture: number; verificati: number; sospetti: number }[]
}

export type ErrorReason = { tipo: 'cifra' | 'sintassi' | 'non_standard'; simbologia: string | null; errore: string | null; letture: number; esempio: string | null }

/** Una scansione così come è salvata in scan_events (nessun dato personale). */
export type ScanEvent = {
  id: number
  created_at: string
  country: string | null
  region_code: string | null
  region: string | null
  is_eu: boolean | null
  source: 'camera' | 'image' | 'manual'
  device: 'mobile' | 'desktop' | null
  app_version: string | null
  symbology: string | null
  is_2d: boolean | null
  content_kind: 'gs1' | 'url' | 'text' | null
  compliance: 'gs1' | 'error' | 'partial' | 'manual' | 'none' | null
  check_digit_ok: boolean | null
  syntax_ok: boolean | null
  syntax_error: string | null
  primary_ai: string | null
  primary_key: string | null
  ai_list: string[] | null
  issuer_mo: string | null
  vbg_state: 'verified' | 'licensed' | 'invalid' | 'error' | null
  vbg_complete: boolean | null
  vbg_core_count: number | null
  vbg_error_code: string | null
  company_prefix: string | null
  licensee_name: string | null
  licensee_gln: string | null
  licensing_mo: string | null
  gpc_brick: string | null
  gpc_brick_name: string | null
  gpc_segment: string | null
  link_domain: string | null
  link_level: 'trusted' | 'unknown' | 'danger' | 'pending' | null
  link_imitates: string | null
  link_threats: string[] | null
}

export type EventFilters = {
  q: string
  symbology: string
  compliance: string
  vbg_state: string
  link_level: string
  source: string
}

export type EventsPage = { total: number; rows: ScanEvent[] }
