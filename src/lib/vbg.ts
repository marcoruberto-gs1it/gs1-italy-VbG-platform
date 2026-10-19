/*
 * Consultazione di Verified by GS1 dal dettaglio di una scansione.
 * Passa dal proxy del Worker (il token resta un secret di Cloudflare). Il proxy non registra nulla:
 * le statistiche nascono solo da /api/events, che chiama l'app di scansione. Quindi aprire un record
 * qui non aggiunge scansioni e non altera i conteggi.
 */

import { lang, locale, t } from '../i18n'
import { countryName, longDay } from './format'
const BASE = import.meta.env.VITE_VBG_BASE ?? 'https://gs1-vbg-scan.marco-ruberto.workers.dev/api/vbg'

type Lang = { language: string; value: string }
type RawRecord = {
  gtin?: string
  gtinRecordStatus?: string
  keyRecordStatus?: string
  gpcCategoryCode?: string
  brandName?: Lang[]
  productDescription?: Lang[]
  productImageUrl?: Lang[]
  netContent?: { unitCode: string; value: string }[]
  countryOfSaleCode?: { alpha2?: string; numeric: string }[]
  dateUpdated?: string
  isComplete?: boolean
  gs1Licence?: { licenseeName: string; licenceKey?: string; licenseeGLN?: string; licensingMO?: { moName: string } }
  glnRecords?: { organizationName?: Lang[] }[]
  code?: number
  validationErrors?: { errors: { errorCode: string; message: string }[] }[]
}

export type CoreAttribute = { label: string; value?: string }

export type VbgRecord = {
  state: 'verified' | 'licensed' | 'invalid' | 'error'
  message?: string
  code?: string
  image?: string
  name?: string
  complete?: boolean
  status?: string
  updated?: string
  licensee?: { name: string; prefix?: string; gln?: string; mo?: string }
  /** I 7 attributi essenziali di Verified by GS1, presenti o mancanti. */
  core: CoreAttribute[]
}

const endpoints: Record<string, string> = {
  '01': 'gtin', '414': 'gln', '417': 'gln', '00': 'sscc', '8003': 'grai', '8004': 'giai', '8017': 'gsrn', '8018': 'gsrn',
  '253': 'gdti', '401': 'ginc', '402': 'gsin', '255': 'gcn', '8010': 'cpid', '8013': 'gmn', '8006': 'itip',
}

export const canLookup = (ai: string | null | undefined) => Boolean(ai && endpoints[ai])

/** Messaggi degli errori GS1 più comuni, tradotti al momento dell'uso. */
const errorMessage = (code: string) =>
  ({
    E002: t('La cifra di controllo non è corretta.'),
    E030: t('Numero riservato a uso interno (circolazione ristretta).'),
    E037: t('Numero riservato ai coupon.'),
    E039: t('Il numero non risulta assegnato da GS1 a nessuna azienda.'),
  })[code]

const units: Record<string, string> = { GRM: 'g', KGM: 'kg', MGM: 'mg', MLT: 'ml', CLT: 'cl', LTR: 'l', H87: 'pz', MTR: 'm', CMT: 'cm', MMT: 'mm' }
const unit = (code: string) => (code === 'H87' ? t('pz') : units[code] ?? code)

/** Testo nella lingua dell'interfaccia, se la scheda la offre; poi l'altra lingua, poi la prima disponibile. */
function pick(values?: Lang[]) {
  if (!values?.length) return undefined
  const [first, second] = lang() === 'en' ? [/^en/i, /^it/i] : [/^it/i, /^en/i]
  return (values.find((v) => first.test(v.language)) ?? values.find((v) => second.test(v.language)) ?? values[0]).value
}

function mapRecord(record: RawRecord): VbgRecord {
  const issue = record.validationErrors?.[0]?.errors?.[0]
  if (record.code === 5 || issue) {
    return { state: 'invalid', core: [], code: issue?.errorCode, message: (issue && errorMessage(issue.errorCode)) ?? issue?.message ?? t('Il codice non è valido.') }
  }
  const licence = record.gs1Licence
  const licensee = licence && { name: licence.licenseeName, prefix: licence.licenceKey, gln: licence.licenseeGLN, mo: licence.licensingMO?.moName }
  const name = pick(record.productDescription) ?? pick(record.glnRecords?.[0]?.organizationName)
  const status = record.gtinRecordStatus ?? record.keyRecordStatus
  if (!name || record.glnRecords) return { state: 'licensed', core: [], name: record.glnRecords ? name : undefined, status, licensee }

  const image = pick(record.productImageUrl)
  return {
    state: 'verified',
    name,
    image,
    complete: record.isComplete,
    status,
    updated: record.dateUpdated ? longDay(record.dateUpdated) : undefined,
    licensee,
    core: [
      { label: t('GTIN'), value: record.gtin },
      { label: t('Marchio'), value: pick(record.brandName) },
      { label: t('Descrizione'), value: pick(record.productDescription) },
      { label: t('Immagine'), value: image ? t('Presente') : undefined },
      { label: t('Categoria GPC'), value: record.gpcCategoryCode },
      { label: t('Contenuto netto'), value: record.netContent?.map((n) => `${Number(n.value).toLocaleString(locale())} ${unit(n.unitCode)}`).join(' · ') || undefined },
      { label: t('Paesi di vendita'), value: record.countryOfSaleCode?.map((c) => (c.alpha2 ? countryName(c.alpha2) : c.numeric)).join(', ') || undefined },
    ],
  }
}

const cache = new Map<string, Promise<VbgRecord>>()

export function lookup(ai: string, value: string): Promise<VbgRecord> {
  const endpoint = endpoints[ai]
  if (!endpoint) return Promise.resolve({ state: 'error', core: [], message: t('Questo tipo di codice non si può verificare su Verified by GS1.') })
  const key = endpoint === 'gtin' ? value.padStart(14, '0') : value
  const cacheKey = `${lang()}:${endpoint}:${key}`
  const hit = cache.get(cacheKey)
  if (hit) return hit
  const request = fetch(`${BASE}/${endpoint}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify([key]),
  })
    .then(async (res): Promise<VbgRecord> => {
      if (res.status === 429) return { state: 'error', core: [], message: t('Troppe consultazioni ravvicinate: riprova tra un minuto.') }
      if (!res.ok) return { state: 'error', core: [], message: t('Verified by GS1 non risponde (errore {status}).', { status: res.status }) }
      const [record] = (await res.json()) as RawRecord[]
      return record ? mapRecord(record) : { state: 'error', core: [], message: t('Risposta vuota da Verified by GS1.') }
    })
    .catch((): VbgRecord => ({ state: 'error', core: [], message: t('Impossibile raggiungere Verified by GS1.') }))
  cache.set(cacheKey, request)
  void request.then((v) => v.state === 'error' && cache.delete(cacheKey))
  return request
}
