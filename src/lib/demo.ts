/*
 * Dati dimostrativi generati nel browser (modalità ?demo): servono a vedere la dashboard
 * prima che ci siano abbastanza scansioni reali. Non vengono mai salvati nel database.
 */
import { isLicenceInactive } from './licence'
import type { DashboardData, EventFilters, EventsPage, Kpi, ScanEvent } from './types'

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

/** Periodo precedente dimostrativo: un po' meno scansioni, meno codici 2D, più allerte. */
export function demoPrevious(k: Kpi): Kpi {
  return {
    ...k,
    letture: Math.round(k.letture * 0.84),
    letture_simbolo: Math.round(k.letture_simbolo * 0.84),
    letture_2d: Math.round(k.letture_2d * 0.7),
    conformi: Math.round(k.conformi * 0.83),
    schede_complete: Math.round(k.schede_complete * 0.8),
    allerte_link: k.allerte_link + 6,
  }
}

export function demoData(days: number): DashboardData {
  const r = rng(days * 97 + 13)
  const giornaliero = Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (days - 1 - i))
    const trend = 1 + i / days
    const weekend = [0, 6].includes(d.getDay()) ? 1.35 : 1
    const base = Math.round((180 + r() * 90) * trend * weekend)
    const twoD = Math.round(base * (0.12 + 0.14 * (i / days) + r() * 0.05))
    return { giorno: d.toISOString().slice(0, 10), letture_2d: twoD, letture_1d: base - twoD, manuali: Math.round(base * 0.06) }
  })
  const totale1d = giornaliero.reduce((a, g) => a + g.letture_1d, 0)
  const totale2d = giornaliero.reduce((a, g) => a + g.letture_2d, 0)
  const manuali = giornaliero.reduce((a, g) => a + g.manuali, 0)
  const letture = totale1d + totale2d + manuali
  const regioniPeso: [string, string, number][] = [
    ['25', 'Lombardy', 0.24], ['62', 'Lazio', 0.13], ['72', 'Campania', 0.09], ['34', 'Veneto', 0.09], ['45', 'Emilia-Romagna', 0.08],
    ['21', 'Piedmont', 0.07], ['52', 'Tuscany', 0.06], ['82', 'Sicily', 0.06], ['75', 'Apulia', 0.05], ['42', 'Liguria', 0.03],
    ['78', 'Calabria', 0.025], ['88', 'Sardinia', 0.025], ['36', 'Friuli Venezia Giulia', 0.02], ['57', 'Marche', 0.02],
  ]
  const regioni = regioniPeso.map(([region_code, region, w]) => {
    const l = Math.round(letture * w * (0.85 + r() * 0.3))
    return { country: 'IT', region_code, region, letture: l, letture_2d: Math.round(l * (0.14 + r() * 0.12)), conformi: Math.round(l * (0.9 + r() * 0.07)) }
  })
  // Scansioni dall'estero (turisti, importatori, e-commerce): una piccola parte del totale.
  const abroad: [string, string, string, number][] = [
    ['FR', 'IDF', 'Île-de-France', 0.018], ['DE', 'BY', 'Bavaria', 0.014], ['CH', 'ZH', 'Zurich', 0.011], ['ES', 'CT', 'Catalonia', 0.009],
    ['GB', 'ENG', 'England', 0.008], ['US', 'NY', 'New York', 0.006], ['AT', '9', 'Vienna', 0.004], ['BR', 'SP', 'São Paulo', 0.002],
  ]
  for (const [country, region_code, region, w] of abroad) {
    const l = Math.round(letture * w * (0.85 + r() * 0.3))
    regioni.push({ country, region_code, region, letture: l, letture_2d: Math.round(l * (0.2 + r() * 0.15)), conformi: Math.round(l * (0.88 + r() * 0.08)) })
  }
  regioni.sort((a, b) => b.letture - a.letture)
  const byCountry = new Map<string, { country: string; letture: number; letture_2d: number; conformi: number }>()
  for (const g of regioni) {
    const c = byCountry.get(g.country) ?? { country: g.country, letture: 0, letture_2d: 0, conformi: 0 }
    c.letture += g.letture
    c.letture_2d += g.letture_2d
    c.conformi += g.conformi
    byCountry.set(g.country, c)
  }
  const paesi = [...byCountry.values()].sort((a, b) => b.letture - a.letture)
  const conformi = Math.round(letture * 0.91)
  const conErrori = Math.round(letture * 0.035)
  const nonGs1 = Math.round(letture * 0.03)
  return {
    kpi: {
      letture, letture_simbolo: letture - manuali, letture_2d: totale2d, conformi, con_errori: conErrori, non_gs1: nonGs1,
      prodotti_distinti: Math.round(letture * 0.31), verificati: Math.round(letture * 0.72), schede_valutate: Math.round(letture * 0.8),
      schede_complete: Math.round(letture * 0.8 * 0.64), allerte_link: 23, link_sospetti: 4,
      licenze_non_attive: Math.round(letture * 0.004), paesi: paesi.length,
    },
    giornaliero,
    paesi,
    regioni,
    licenze: [
      { company_prefix: '8033333', titolare: 'Conserviera Dismessa S.r.l.', letture: Math.round(letture * 0.003), prodotti: 6, stato_licenza: 'INACTIVE', stato_scheda: 'OK', ultima: new Date(Date.now() - 3600e3 * 3).toISOString(), paesi: ['IT', 'DE'] },
      { company_prefix: '8044444', titolare: 'Bevande Storiche S.n.c.', letture: Math.round(letture * 0.001), prodotti: 2, stato_licenza: null, stato_scheda: 'INACTIVE', ultima: new Date(Date.now() - 3600e3 * 40).toISOString(), paesi: ['IT'] },
    ],
    simbologie: [
      { simbologia: 'EAN-13', is_2d: false, letture: Math.round(totale1d * 0.86) },
      { simbologia: 'QR Code Standard GS1', is_2d: true, letture: Math.round(totale2d * 0.58) },
      { simbologia: 'GS1 DataMatrix', is_2d: true, letture: Math.round(totale2d * 0.3) },
      { simbologia: 'GS1-128', is_2d: false, letture: Math.round(totale1d * 0.07) },
      { simbologia: 'EAN-8', is_2d: false, letture: Math.round(totale1d * 0.04) },
      { simbologia: 'GS1 DataBar', is_2d: false, letture: Math.round(totale1d * 0.03) },
      { simbologia: 'Codice con link', is_2d: true, letture: Math.round(totale2d * 0.12) },
      { simbologia: 'Inserito a mano', is_2d: null, letture: manuali },
    ],
    conformita: { gs1: conformi - manuali, manual: manuali, error: Math.round(conErrori * 0.6), partial: Math.round(conErrori * 0.4), none: nonGs1 },
    categorie: [
      ['10000057', 'Salse/Sughi - Da Cucina (Ambiente)', 0.71, 6.6],
      ['10000043', 'Pasta Secca', 0.68, 6.4],
      ['10000105', 'Latte (Deperibile)', 0.42, 5.7],
      ['10000248', 'Biscotti/Cracker Dolci', 0.6, 6.1],
      ['10000227', 'Acqua Minerale', 0.5, 5.9],
      ['10000159', 'Caffè - Macinato/In Grani', 0.55, 6.2],
      ['10000117', 'Formaggi - Duri/Semiduri', 0.31, 5.2],
      ['10000488', 'Detersivi Lavatrice', 0.47, 5.8],
    ].map(([gpc_brick, categoria, completezza, media], i) => {
      const l = Math.round(letture * (0.11 - i * 0.011))
      return {
        gpc_brick: String(gpc_brick), categoria: String(categoria), segmento: i === 7 ? 'Prodotti per la Pulizia/Igiene' : 'Alimentari/Bevande',
        letture: l, gtin_distinti: Math.round(l * 0.18), media_dati: Number(media), schede_complete: Math.round(l * Number(completezza)), letture_2d: Math.round(l * (0.1 + r() * 0.2)),
      }
    }),
    qualita: [
      { company_prefix: '8012345', titolare: 'Pastificio Esempio S.r.l.', letture: 1840, errori_cifra: 61, errori_sintassi: 4, non_standard: 0, errori: 65, motivi: [
        { tipo: 'cifra', simbologia: 'EAN-13', errore: null, letture: 61, esempio: '08012345000015' },
        { tipo: 'sintassi', simbologia: 'GS1 DataMatrix', errore: 'AI (17): The date contains an illegal month of the year.', letture: 4, esempio: '08012345000012' },
      ] },
      { company_prefix: '8054321', titolare: 'Conserve Dimostrative S.p.A.', letture: 960, errori_cifra: 0, errori_sintassi: 22, non_standard: 9, errori: 31, motivi: [
        { tipo: 'sintassi', simbologia: 'GS1-128', errore: 'Required AIs for AI (10) are not satisfied: 01,02,8006,8026', letture: 22, esempio: null },
        { tipo: 'non_standard', simbologia: 'QR Code', errore: null, letture: 9, esempio: '08054321000128' },
      ] },
      { company_prefix: '8009876', titolare: 'Latteria Campione Soc. Coop.', letture: 1210, errori_cifra: 12, errori_sintassi: 0, non_standard: 3, errori: 15, motivi: [
        { tipo: 'cifra', simbologia: 'EAN-13', errore: null, letture: 12, esempio: '08009876000236' },
        { tipo: 'non_standard', simbologia: 'Data Matrix', errore: null, letture: 3, esempio: '08009876000239' },
      ] },
    ],
    errori_sintassi: [
      { errore: 'AI (17): The date contains an illegal day of the month.', letture: 14 },
      { errore: 'It is invalid to pair AI (01) with AI (02)', letture: 9 },
      { errore: 'Required AIs for AI (21) are not satisfied: 01,03,8006', letture: 3 },
    ],
    allerte: [
      { company_prefix: '8076809', titolare: 'Marchio Esempio S.p.A.', gtin: '08076809513388', dominio: 'marchio-esernpio.com', somiglia_a: 'marchio-esempio.com', sospetto: true, segnalato_google: true, letture: 17, ultima: new Date(Date.now() - 3600e3 * 5).toISOString(), regioni: ['25', '62'] },
      { company_prefix: '8012345', titolare: 'Pastificio Esempio S.r.l.', gtin: '08012345000017', dominio: 'promo-qr.example', somiglia_a: null, sospetto: false, segnalato_google: false, letture: 6, ultima: new Date(Date.now() - 3600e3 * 30).toISOString(), regioni: ['72'] },
    ],
    brand: [
      ['Marchio Esempio', 'Marchio Esempio S.p.A.', 0.088, 0.74, 6.7],
      ['Pasta Campione', 'Pastificio Esempio S.r.l.', 0.061, 0.66, 6.4],
      ['Latte del Borgo', 'Latteria Campione Soc. Coop.', 0.047, 0.38, 5.6],
      ['Sugo Demo', 'Conserve Dimostrative S.p.A.', 0.041, 0.71, 6.6],
      ['Frollini Prova', 'Dolciaria Esempio S.p.A.', 0.036, 0.58, 6.1],
      ['Fonte Esempio', 'Fonti Dimostrative S.r.l.', 0.029, 0.49, 5.9],
      ['Casa Pulita Demo', 'Detergenti Esempio S.r.l.', 0.018, 0.44, 5.7],
      ['Caffè del Campione', 'Torrefazione Demo S.r.l.', 0.014, 0.55, 6.2],
    ].map(([brand, titolare, quota, completezza, media]) => {
      const l = Math.round(letture * Number(quota))
      return { brand: String(brand), titolare: String(titolare), letture: l, prodotti: Math.max(3, Math.round(l * 0.04)), media_dati: Number(media), schede_complete: Math.round(l * Number(completezza)), letture_2d: Math.round(l * (0.12 + r() * 0.18)) }
    }),
    non_assegnati: [
      { inizio_codice: '08099999', letture: 42, codici: 7, ultima: new Date(Date.now() - 3600e3 * 2).toISOString() },
      { inizio_codice: '08000000', letture: 11, codici: 2, ultima: new Date(Date.now() - 3600e3 * 50).toISOString() },
    ],
    domini: [
      { dominio: 'gs1.org', letture: 410, verificati: 410, sospetti: 0 },
      { dominio: 'marchio-esempio.com', letture: 233, verificati: 233, sospetti: 0 },
      { dominio: 'marchio-esernpio.com', letture: 17, verificati: 0, sospetti: 17 },
      { dominio: 'promo-qr.example', letture: 6, verificati: 0, sospetti: 0 },
    ],
  }
}

/* ───── Dati grezzi dimostrativi: righe di scan_events plausibili, filtrate come fa il database ───── */


const DEMO_PRODUCTS: { key: string; prefix: string; owner: string; brick: string; cat: string; licence?: string; record?: string }[] = [
  { key: '08076802085738', prefix: '8076809', owner: 'Marchio Esempio S.p.A.', brick: '10000043', cat: 'Pasta Secca' },
  { key: '08012345000012', prefix: '8012345', owner: 'Pastificio Esempio S.r.l.', brick: '10000043', cat: 'Pasta Secca' },
  { key: '08054321000128', prefix: '8054321', owner: 'Conserve Dimostrative S.p.A.', brick: '10000057', cat: 'Salse/Sughi - Da Cucina (Ambiente)' },
  { key: '08009876000239', prefix: '8009876', owner: 'Latteria Campione Soc. Coop.', brick: '10000117', cat: 'Formaggi - Duri/Semiduri' },
  { key: '08000500310427', prefix: '8000500', owner: 'Dolciaria Esempio S.p.A.', brick: '10000248', cat: 'Biscotti/Cracker Dolci' },
  { key: '08002270000140', prefix: '8002270', owner: 'Fonti Dimostrative S.r.l.', brick: '10000227', cat: 'Acqua Minerale' },
  { key: '08033333000012', prefix: '8033333', owner: 'Conserviera Dismessa S.r.l.', brick: '10000057', cat: 'Salse/Sughi - Da Cucina (Ambiente)', licence: 'INACTIVE' },
]
const DEMO_SYMBOLOGIES: [string, boolean | null, ScanEvent['source']][] = [
  ['EAN-13', false, 'camera'], ['EAN-13', false, 'camera'], ['EAN-13', false, 'image'], ['QR Code Standard GS1', true, 'camera'],
  ['GS1 DataMatrix', true, 'camera'], ['GS1-128', false, 'camera'], ['EAN-8', false, 'camera'], ['GS1 DataBar', false, 'camera'],
  ['Codice con link', true, 'camera'], ['Inserito a mano', null, 'manual'],
]
const DEMO_REGIONS: [string, string, string][] = [
  ['IT', '25', 'Lombardy'], ['IT', '62', 'Lazio'], ['IT', '72', 'Campania'], ['IT', '34', 'Veneto'], ['IT', '45', 'Emilia-Romagna'], ['IT', '21', 'Piedmont'], ['IT', '82', 'Sicily'],
  ['IT', '25', 'Lombardy'], ['IT', '62', 'Lazio'], ['IT', '52', 'Tuscany'], ['FR', 'IDF', 'Île-de-France'], ['DE', 'BY', 'Bavaria'], ['CH', 'ZH', 'Zurich'],
]

let demoRows: ScanEvent[] | null = null

function buildDemoRows(): ScanEvent[] {
  const r = rng(4242)
  const pick = <T,>(list: T[]) => list[Math.floor(r() * list.length)]
  return Array.from({ length: 420 }, (_, i) => {
    const [symbology, is2d, source] = pick(DEMO_SYMBOLOGIES)
    const product = pick(DEMO_PRODUCTS)
    const [country, region_code, region] = pick(DEMO_REGIONS)
    const roll = r()
    const link = symbology === 'Codice con link' || (symbology === 'QR Code Standard GS1' && r() < 0.4)
    const compliance: ScanEvent['compliance'] =
      source === 'manual' ? 'manual' : symbology === 'Codice con link' ? 'none' : roll < 0.035 ? 'error' : roll < 0.06 ? 'partial' : 'gs1'
    const isGs1 = compliance !== 'none'
    const vbgRoll = r()
    const vbg: ScanEvent['vbg_state'] = !isGs1 ? null : compliance === 'error' && vbgRoll < 0.5 ? 'invalid' : vbgRoll < 0.72 ? 'verified' : vbgRoll < 0.95 ? 'licensed' : 'invalid'
    const core = vbg === 'verified' ? 4 + Math.floor(r() * 4) : null
    const suspicious = link && r() < 0.12
    const minutes = Math.floor(i * 95 + r() * 80)
    return {
      id: 100000 - i,
      created_at: new Date(Date.now() - minutes * 60_000).toISOString(),
      country, region_code, region, is_eu: country !== 'CH',
      source, device: r() < 0.86 ? 'mobile' : 'desktop', app_version: '1.4.0',
      symbology, is_2d: is2d,
      content_kind: symbology === 'Codice con link' ? 'url' : 'gs1',
      compliance,
      check_digit_ok: isGs1 ? compliance !== 'error' || r() < 0.4 : null,
      syntax_ok: isGs1 ? compliance === 'gs1' || compliance === 'manual' : null,
      syntax_error: compliance === 'error' ? 'AI (17): data non valida (mese 13)' : compliance === 'partial' ? 'Dati GS1 senza FNC1 iniziale' : null,
      primary_ai: isGs1 ? '01' : null,
      primary_key: isGs1 ? (vbg === 'invalid' ? '08099999' + String(100000 + i).slice(-6) : product.key) : null,
      ai_list: !isGs1 ? null : is2d ? ['01', '10', '17'] : ['01'],
      issuer_mo: isGs1 ? 'GS1 Italy' : null,
      vbg_state: vbg,
      vbg_complete: core == null ? null : core === 7,
      vbg_core_count: core,
      vbg_error_code: vbg === 'invalid' ? 'E039' : null,
      vbg_record_status: vbg && vbg !== 'invalid' ? (product.record ?? 'OK') : null,
      vbg_licence_status: vbg && vbg !== 'invalid' ? (product.licence ?? null) : null,
      company_prefix: vbg && vbg !== 'invalid' ? product.prefix : null,
      licensee_name: vbg && vbg !== 'invalid' ? product.owner : null,
      licensee_gln: vbg && vbg !== 'invalid' ? `${product.prefix}000003` : null,
      licensing_mo: vbg && vbg !== 'invalid' ? 'GS1 Italy' : null,
      gpc_brick: vbg === 'verified' ? product.brick : null,
      gpc_brick_name: vbg === 'verified' ? product.cat : null,
      gpc_segment: vbg === 'verified' ? 'Alimentari/Bevande' : null,
      link_domain: link ? (suspicious ? 'marchio-esernpio.com' : r() < 0.6 ? 'id.gs1.it' : 'marchio-esempio.com') : null,
      link_level: link ? (suspicious ? 'danger' : 'trusted') : null,
      link_imitates: suspicious ? 'marchio-esempio.com' : null,
      link_threats: suspicious && r() < 0.5 ? ['SOCIAL_ENGINEERING'] : null,
    }
  })
}

export function demoEvents(days: number, filters: EventFilters, limit: number, offset: number): EventsPage {
  demoRows ??= buildDemoRows()
  const from = Date.now() - days * 86_400_000
  const q = filters.q.trim().toLowerCase()
  const matches = (e: ScanEvent) =>
    new Date(e.created_at).getTime() >= from &&
    (!filters.symbology || e.symbology === filters.symbology) &&
    (!filters.compliance || e.compliance === filters.compliance) &&
    (!filters.vbg_state || (filters.vbg_state === 'none' ? e.vbg_state == null : e.vbg_state === filters.vbg_state)) &&
    (!filters.link_level || (filters.link_level === 'none' ? e.link_domain == null : e.link_level === filters.link_level)) &&
    (!filters.source || e.source === filters.source) &&
    (!filters.licence ||
      (filters.licence === 'inactive' ? isLicenceInactive(e.vbg_licence_status, e.vbg_record_status) : (e.vbg_state === 'verified' || e.vbg_state === 'licensed') && !isLicenceInactive(e.vbg_licence_status, e.vbg_record_status))) &&
    (!q || [e.primary_key, e.licensee_name, e.gpc_brick_name, e.link_domain].some((v) => v?.toLowerCase().includes(q)) || Boolean(e.company_prefix?.startsWith(q)))
  const rows = demoRows.filter(matches)
  return { total: rows.length, rows: rows.slice(offset, offset + limit) }
}

/** Medie e codici che non vanno moltiplicati quando si ingrandisce la demo. */
const NOT_COUNTS = new Set(['media_dati', 'paesi'])

/**
 * Demo "ingrandita" (?demo&scala=1000): moltiplica tutti i conteggi, per vedere come si comporta
 * l'interfaccia quando i numeri cresceranno.
 */
export function scaleDemo<T>(value: T, factor: number, key = ''): T {
  if (factor === 1) return value
  if (typeof value === 'number') return (NOT_COUNTS.has(key) ? value : Math.round(value * factor)) as T
  if (Array.isArray(value)) return value.map((v) => scaleDemo(v, factor, key)) as T
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scaleDemo(v, factor, k)])) as T
  return value
}
