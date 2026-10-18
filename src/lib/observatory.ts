/* Osservatorio: frasi pronte da citare, generate dai dati aggregati del periodo. */
import type { Period } from './config'
import { longDay, num, pct, regionName } from './format'
import type { DashboardData } from './types'

export type KeyFact = { id: string; text: string }

/** Intervallo di date del periodo, per la fonte. */
export function periodRange(days: number, today = new Date()) {
  const from = new Date(today.getTime() - (days - 1) * 86_400_000)
  return `${longDay(from.toISOString())} – ${longDay(today.toISOString())}`
}

export const sourceLine = (days: number, today = new Date()) => `Fonte: Osservatorio Verified by GS1, GS1 Italy (scansioni con l’app VbG Scan, ${periodRange(days, today)}).`

/** Numeri chiave in frasi complete; si omettono quelli senza dati sufficienti. */
export function keyFacts(data: DashboardData, period: Period): KeyFact[] {
  const k = data.kpi
  const facts: KeyFact[] = []
  if (!k.letture) return facts
  facts.push({ id: 'scansioni', text: `${period.long[0].toUpperCase()}${period.long.slice(1)} sono stati scansionati ${num(k.letture)} codici di ${num(k.prodotti_distinti)} prodotti diversi.` })
  if (k.letture_simbolo) {
    facts.push({ id: '2d', text: `Il ${pct(k.letture_2d, k.letture_simbolo)} dei codici letti è un codice 2D (come il QR Code Standard GS1 o il GS1 DataMatrix).` })
    facts.push({ id: 'conformi', text: `Il ${pct(k.conformi, k.letture_simbolo)} dei codici letti rispetta gli standard GS1.` })
  }
  if (k.schede_valutate) facts.push({ id: 'schede', text: `Il ${pct(k.schede_complete, k.schede_valutate)} delle schede prodotto consultate su Verified by GS1 contiene tutte e 7 le informazioni essenziali.` })
  const top = data.regioni.find((r) => r.country === 'IT' && r.region_code)
  const italy = data.regioni.filter((r) => r.country === 'IT').reduce((a, r) => a + r.letture, 0)
  if (top && italy) facts.push({ id: 'regione', text: `La regione con più scansioni è ${regionName(top.country, top.region_code, top.region)}, con il ${pct(top.letture, italy)} delle scansioni in Italia.` })
  const cat = data.categorie[0]
  if (cat?.categoria) facts.push({ id: 'categoria', text: `La categoria di prodotto più scansionata è “${cat.categoria}”.` })
  if (k.allerte_link) facts.push({ id: 'allerte', text: `${num(k.allerte_link)} scansioni hanno portato a siti diversi da quelli del titolare del codice: possibili casi di contraffazione o truffa.` })
  return facts
}
