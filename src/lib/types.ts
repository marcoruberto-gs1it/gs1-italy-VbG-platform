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
  qualita: { company_prefix: string; titolare: string | null; letture: number; errori_cifra: number; errori_sintassi: number; non_standard: number; errori: number }[]
  errori_sintassi: { errore: string; letture: number }[]
  allerte: { company_prefix: string | null; titolare: string | null; gtin: string; dominio: string; somiglia_a: string | null; sospetto: boolean; segnalato_google: boolean; letture: number; ultima: string; regioni: string[] | null }[]
  non_assegnati: { inizio_codice: string; letture: number; codici: number; ultima: string }[]
  domini: { dominio: string; letture: number; verificati: number; sospetti: number }[]
}
