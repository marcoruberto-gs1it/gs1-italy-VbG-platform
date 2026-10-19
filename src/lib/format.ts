/* Formati di numeri, date e nomi geografici nella lingua corrente. */
import { lang, locale, t } from '../i18n'

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat | Intl.DisplayNames>()
function cached<T extends Intl.NumberFormat | Intl.DateTimeFormat | Intl.DisplayNames>(key: string, make: (loc: string) => T): T {
  const k = `${locale()}|${key}`
  let f = cache.get(k) as T | undefined
  if (!f) cache.set(k, (f = make(locale())))
  return f
}
const nf = () => cached('n', (l) => new Intl.NumberFormat(l))
const one = () => cached('n1', (l) => new Intl.NumberFormat(l, { maximumFractionDigits: 1 }))

export const num = (n: number | null | undefined) => (n == null ? '–' : nf().format(n))

/** Numero breve per gli spazi stretti: da 100.000 in su diventa "123,5 mila", "2,4 Mln" (in inglese "123.5k", "2.4M"). */
export function numShort(n: number | null | undefined) {
  if (n == null) return '–'
  const a = Math.abs(n)
  const en = lang() === 'en'
  if (a >= 1e9) return `${one().format(n / 1e9)}${en ? 'B' : ' Mld'}`
  if (a >= 1e6) return `${one().format(n / 1e6)}${en ? 'M' : ' Mln'}`
  if (a >= 1e5) return `${one().format(n / 1e3)}${en ? 'k' : ' mila'}`
  return nf().format(n)
}

/** Numero con un decimale nella lingua corrente (es. 22,3 / 22.3). */
export const dec1 = (n: number) => one().format(Math.round(n * 10) / 10)

/** Bandiera emoji di un codice paese ISO 3166-1 (dove il sistema la mostra). */
export const flag = (code: string | null) =>
  code && /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0))) : ''

export const pct = (part: number, total: number) => (total ? `${dec1((part / total) * 100)}%` : '–')

export const day = (iso: string) => cached('d', (l) => new Intl.DateTimeFormat(l, { day: 'numeric', month: 'short' })).format(new Date(iso))
export const longDay = (iso: string) => cached('ld', (l) => new Intl.DateTimeFormat(l, { day: 'numeric', month: 'long', year: 'numeric' })).format(new Date(iso))
export const dateTime = (iso: string) =>
  cached('dt', (l) => new Intl.DateTimeFormat(l, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })).format(new Date(iso))

// Codici ISO 3166-2:IT delle regioni, come li restituisce Cloudflare (nomi italiani).
const ITALIAN_REGIONS: Record<string, string> = {
  '21': 'Piemonte', '23': 'Valle d’Aosta', '25': 'Lombardia', '32': 'Trentino-Alto Adige', '34': 'Veneto',
  '36': 'Friuli-Venezia Giulia', '42': 'Liguria', '45': 'Emilia-Romagna', '52': 'Toscana', '55': 'Umbria',
  '57': 'Marche', '62': 'Lazio', '65': 'Abruzzo', '67': 'Molise', '72': 'Campania', '75': 'Puglia',
  '77': 'Basilicata', '78': 'Calabria', '82': 'Sicilia', '88': 'Sardegna', BZ: 'Alto Adige', TN: 'Trentino',
}

export function countryName(code: string | null) {
  if (!code) return t('Paese sconosciuto')
  try {
    return cached('c', (l) => new Intl.DisplayNames([l], { type: 'region' })).of(code) ?? code
  } catch {
    return code
  }
}

/** Nome della regione: in italiano dalla tabella ISTAT, in inglese quello di Cloudflare (già inglese). */
export function regionName(country: string | null, code: string | null, fallback: string | null) {
  if (country === 'IT' && code && ITALIAN_REGIONS[code]) return lang() === 'en' && fallback ? fallback : ITALIAN_REGIONS[code]
  if (country && country !== 'IT') return `${fallback ?? t('Regione sconosciuta')} (${countryName(country)})`
  return fallback ?? t('Regione sconosciuta')
}

export const gtinDisplay = (gtin: string) => (gtin.length === 14 && gtin.startsWith('0') ? gtin.slice(1) : gtin)

// Cloudflare restituisce i nomi delle città in inglese: i più comuni in italiano.
const CITY_IT: Record<string, string> = {
  Milan: 'Milano', Rome: 'Roma', Naples: 'Napoli', Turin: 'Torino', Florence: 'Firenze', Genoa: 'Genova', Venice: 'Venezia',
  Padua: 'Padova', Syracuse: 'Siracusa', Mantua: 'Mantova', Leghorn: 'Livorno', Bolzano: 'Bolzano', Munich: 'Monaco di Baviera',
  Cologne: 'Colonia', Vienna: 'Vienna', Geneva: 'Ginevra', Zurich: 'Zurigo', Lucerne: 'Lucerna', Basel: 'Basilea', Brussels: 'Bruxelles',
  London: 'Londra', Lisbon: 'Lisbona', Athens: 'Atene', Warsaw: 'Varsavia', Prague: 'Praga', Moscow: 'Mosca', Marseille: 'Marsiglia',
  Nice: 'Nizza', Lyon: 'Lione', Seville: 'Siviglia', Belgrade: 'Belgrado', Bucharest: 'Bucarest', Copenhagen: 'Copenaghen',
}
export const cityName = (city: string) => (lang() === 'it' ? CITY_IT[city] ?? city : city)
