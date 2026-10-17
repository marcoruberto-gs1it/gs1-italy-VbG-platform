const nf = new Intl.NumberFormat('it-IT')
export const num = (n: number | null | undefined) => (n == null ? '–' : nf.format(n))
export const pct = (part: number, total: number) => (total ? `${(Math.round((part / total) * 1000) / 10).toLocaleString('it-IT')}%` : '–')
export const share = (part: number, total: number) => (total ? part / total : 0)

const dayFmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' })
const longFmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
export const day = (iso: string) => dayFmt.format(new Date(iso))
export const longDay = (iso: string) => longFmt.format(new Date(iso))
export const dateTime = (iso: string) => dateTimeFmt.format(new Date(iso))

// Codici ISO 3166-2:IT delle regioni, come li restituisce Cloudflare.
const ITALIAN_REGIONS: Record<string, string> = {
  '21': 'Piemonte', '23': 'Valle d’Aosta', '25': 'Lombardia', '32': 'Trentino-Alto Adige', '34': 'Veneto',
  '36': 'Friuli-Venezia Giulia', '42': 'Liguria', '45': 'Emilia-Romagna', '52': 'Toscana', '55': 'Umbria',
  '57': 'Marche', '62': 'Lazio', '65': 'Abruzzo', '67': 'Molise', '72': 'Campania', '75': 'Puglia',
  '77': 'Basilicata', '78': 'Calabria', '82': 'Sicilia', '88': 'Sardegna', BZ: 'Alto Adige', TN: 'Trentino',
}
const countries = new Intl.DisplayNames(['it'], { type: 'region' })

export function countryName(code: string | null) {
  if (!code) return 'Paese sconosciuto'
  try {
    return countries.of(code) ?? code
  } catch {
    return code
  }
}

export function regionName(country: string | null, code: string | null, fallback: string | null) {
  if (country === 'IT' && code && ITALIAN_REGIONS[code]) return ITALIAN_REGIONS[code]
  if (country && country !== 'IT') return `${fallback ?? 'Regione sconosciuta'} (${countryName(country)})`
  return fallback ?? 'Regione sconosciuta'
}

export const gtinDisplay = (gtin: string) => (gtin.length === 14 && gtin.startsWith('0') ? gtin.slice(1) : gtin)
