import { Globe2, LogIn, LogOut, RefreshCw } from 'lucide-react'
import logo from '../../assets/gs1-italy-logo.png'
import { AUDIENCE_ICONS, AUDIENCES, type AudienceId } from '../../lib/audiences'
import { PERIODS } from '../../lib/config'
import { countryName, flag } from '../../lib/format'
import { Select } from '../ui'

type Props = {
  /** Paesi con scansioni nel periodo, dal più frequente. */
  countries: string[]
  days: number
  country: string
  audience: AudienceId
  loading: boolean
  demo: boolean
  onDays: (days: number) => void
  onCountry: (country: string) => void
  onAudience: (audience: AudienceId) => void
  onReload: () => void
  onSignOut: () => void
}

const AUDIENCE_OPTIONS = AUDIENCES.map((a) => ({ value: a.id, label: a.label, hint: a.lead, icon: AUDIENCE_ICONS[a.id] }))

/** Opzioni dell'area: il mondo, l'Italia sempre, poi i paesi presenti nei dati (e quello scelto). */
function areaOptions(countries: string[], selected: string) {
  const codes = [...new Set(['IT', ...countries, ...(selected ? [selected] : [])])]
  return [
    { value: '', label: 'Mondo', hint: 'Scansioni da tutti i paesi', icon: Globe2 },
    ...codes.map((code) => ({ value: code, label: `${flag(code)} ${countryName(code)}`.trim(), hint: code === 'IT' ? 'Regioni e città italiane' : undefined })),
  ]
}

/**
 * Barra in alto: le scelte che valgono per tutta la pagina, in un solo posto — periodo, area
 * (mondo o un paese) e vista. Su telefono e tablet anche marchio e account.
 */
export function Topbar({ countries, days, country, audience, loading, demo, onDays, onCountry, onAudience, onReload, onSignOut }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <img src={logo} alt="GS1 Italy" width={46} height={32} />
        {demo ? (
          <a className="btn ghost small" href="./"><LogIn size={15} /> Accedi</a>
        ) : (
          <button className="btn ghost small" type="button" onClick={onSignOut}><LogOut size={15} /> Esci</button>
        )}
      </div>
      <div className="filters" role="toolbar" aria-label="Filtri della pagina">
        <div className="segmented periods" role="radiogroup" aria-label="Periodo">
          {PERIODS.map((p) => (
            <button key={p.days} type="button" role="radio" aria-checked={days === p.days} className={days === p.days ? 'is-active' : ''} onClick={() => onDays(p.days)}>{p.label}</button>
          ))}
        </div>
        <div className="filter-field">
          <span className="filter-label">Area</span>
          <Select label="Area" value={country} onChange={onCountry} options={areaOptions(countries, country)} />
        </div>
        <div className="filter-field">
          <span className="filter-label">Vista</span>
          <Select label="Vista" value={audience} onChange={onAudience} options={AUDIENCE_OPTIONS} />
        </div>
        <button className="btn ghost icon-only" type="button" onClick={onReload} disabled={loading} aria-label="Aggiorna i dati" title="Aggiorna i dati">
          <RefreshCw size={17} className={loading ? 'spin' : undefined} />
        </button>
      </div>
    </header>
  )
}
