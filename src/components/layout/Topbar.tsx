import { Globe2, LogIn, LogOut, MapPin, RefreshCw } from 'lucide-react'
import logo from '../../assets/gs1-italy-logo.png'
import { PERIODS } from '../../lib/config'
import { Select } from '../ui'

type Props = {
  days: number
  country: string
  loading: boolean
  demo: boolean
  onDays: (days: number) => void
  onCountry: (country: string) => void
  onReload: () => void
  onSignOut: () => void
}

const COUNTRIES = [
  { value: '', label: 'Tutti i paesi', hint: 'Scansioni da ogni paese', icon: Globe2 },
  { value: 'IT', label: 'Italia', hint: 'Solo scansioni dall’Italia', icon: MapPin },
]

/** Barra in alto: filtri (periodo, paese, aggiorna). Su telefono e tablet anche marchio e account. */
export function Topbar({ days, country, loading, demo, onDays, onCountry, onReload, onSignOut }: Props) {
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
        <Select label="Paese" value={country} onChange={onCountry} options={COUNTRIES} />
        <button className="btn ghost icon-only" type="button" onClick={onReload} disabled={loading} aria-label="Aggiorna i dati" title="Aggiorna i dati">
          <RefreshCw size={17} className={loading ? 'spin' : undefined} />
        </button>
      </div>
    </header>
  )
}
