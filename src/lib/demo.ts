/*
 * Dati dimostrativi generati nel browser (modalità ?demo): servono a vedere la dashboard
 * prima che ci siano abbastanza scansioni reali. Non vengono mai salvati nel database.
 */
import type { DashboardData } from './types'

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
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
  }).sort((a, b) => b.letture - a.letture)
  const conformi = Math.round(letture * 0.91)
  const conErrori = Math.round(letture * 0.035)
  const nonGs1 = Math.round(letture * 0.03)
  return {
    kpi: {
      letture, letture_simbolo: letture - manuali, letture_2d: totale2d, conformi, con_errori: conErrori, non_gs1: nonGs1,
      prodotti_distinti: Math.round(letture * 0.31), verificati: Math.round(letture * 0.72), schede_valutate: Math.round(letture * 0.8),
      schede_complete: Math.round(letture * 0.8 * 0.64), allerte_link: 23, link_sospetti: 4,
    },
    giornaliero,
    regioni,
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
      { company_prefix: '8012345', titolare: 'Pastificio Esempio S.r.l.', letture: 1840, errori_cifra: 61, errori_sintassi: 4, non_standard: 0, errori: 65 },
      { company_prefix: '8054321', titolare: 'Conserve Dimostrative S.p.A.', letture: 960, errori_cifra: 0, errori_sintassi: 22, non_standard: 9, errori: 31 },
      { company_prefix: '8009876', titolare: 'Latteria Campione Soc. Coop.', letture: 1210, errori_cifra: 12, errori_sintassi: 0, non_standard: 3, errori: 15 },
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
