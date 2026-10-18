import { Globe2, LogIn, LogOut, RefreshCw } from 'lucide-react'
import logo from '../../assets/gs1-italy-logo.png'
import { PERIODS } from '../../lib/config'
import { countryName, flag } from '../../lib/format'
import { Select } from '../ui'

type Props = {
  /** Paesi con scansioni nel periodo, dal più frequente. */
  countries: string[]
  days: number
  country: string
  loading: boolean
  demo: boolean
  onDays: (days: number) => void
  onCountry: (country: string) => void
  onReload: () => void
  onSignOut: () => void
}

/** Opzioni del filtro paese: tutti, l'Italia sempre, poi i paesi presenti nei dati (e quello scelto). */
function countryOptions(countries: string[], selected: string) {
  const codes = [...new Set(['IT', ...countries, ...(selected ? [selected] : [])])]
  return [
    { value: '', label: 'Tutti i paesi', hint: 'Scansioni da tutto il mondo', icon: Globe2 },
    ...codes.map((code) => ({ value: code, label: `${flag(code)} ${countryName(code)}`.trim(), hint: code === 'IT' ? 'Solo scansioni dall’Italia' : undefined })),
  ]
}

/** Barra in alto: filtri (periodo, paese, aggiorna). Su telefono e tablet anche marchio e account. */
export function Topbar({ countries, days, country, loading, demo, onDays, onCountry, onReload, onSignOut }: Props) {
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
      <div className="filters" role="toolbar" aria-label="Filtri">
        <div className="segmented periods" role="radiogroup" aria-label="Periodo">
          {PERIODS.map((p) => (
            <button key={p.days} type="button" role="radio" aria-checked={days === p.days} className={days === p.days ? 'is-active' : ''} onClick={() => onDays(p.days)}>{p.label}</button>
          ))}
        </div>
        <Select label="Paese" value={country} onChange={onCountry} options={countryOptions(countries, country)} />
        <button className="btn ghost icon-only" type="button" onClick={onReload} disabled={loading} aria-label="Aggiorna i dati" title="Aggiorna i dati">
          <RefreshCw size={17} className={loading ? 'spin' : undefined} />
        </button>
      </div>
    </header>
  )
}
