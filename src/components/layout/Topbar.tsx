import { CalendarDays, Globe2, LogIn, LogOut, RefreshCw } from 'lucide-react'
import logo from '../../assets/gs1-italy-logo.png'
import { AUDIENCE_ICONS, AUDIENCES, type AudienceId } from '../../lib/audiences'
import { PERIODS, sectionById, type SectionId } from '../../lib/config'
import { countryName, flag } from '../../lib/format'
import { t } from '../../i18n'
import { LangSwitch, Select } from '../ui'

type Props = {
  /** Sezione che si sta guardando (percorso in alto a sinistra). */
  active: SectionId
  /** Paesi con scansioni nel periodo, dal più frequente. */
  countries: string[]
  days: number
  country: string
  audience: AudienceId
  loading: boolean
  onDays: (days: number) => void
  onCountry: (country: string) => void
  onAudience: (audience: AudienceId) => void
  onReload: () => void
}

/** Opzioni della vista (calcolate a ogni rendering: le etichette seguono la lingua). */
const audienceOptions = () => AUDIENCES.map((a) => ({ value: a.id, label: a.label, hint: a.lead, icon: AUDIENCE_ICONS[a.id] }))

/** Opzioni dell'area: il mondo, l'Italia sempre, poi i paesi presenti nei dati (e quello scelto). */
function areaOptions(countries: string[], selected: string) {
  const codes = [...new Set(['IT', ...countries, ...(selected ? [selected] : [])])]
  return [
    { value: '', label: t('Mondo'), hint: t('Scansioni da tutti i paesi'), icon: Globe2 },
    ...codes.map((code) => ({ value: code, label: `${flag(code)} ${countryName(code)}`.trim(), hint: code === 'IT' ? t('Regioni e città italiane') : undefined })),
  ]
}

/** Riga del marchio su telefono e tablet (scorre via con la pagina; i filtri restano fissi). */
export function MobileBrand({ demo, onSignOut }: { demo: boolean; onSignOut: () => void }) {
  return (
    <div className="topbar-brand">
      <img src={logo} alt="GS1 Italy" width={46} height={32} />
      <div className="topbar-brand-actions">
        <LangSwitch />
        {demo ? (
          <a className="btn ghost small" href="./"><LogIn size={15} /> {t('Accedi')}</a>
        ) : (
          <button className="btn ghost small" type="button" onClick={onSignOut}><LogOut size={15} /> {t('Esci')}</button>
        )}
      </div>
    </div>
  )
}

/**
 * Barra in alto: le scelte che valgono per tutta la pagina, in un solo posto — periodo, area
 * (mondo o un paese) e vista. Su telefono e tablet anche marchio e account.
 */
export function Topbar({ active, countries, days, country, audience, loading, onDays, onCountry, onAudience, onReload }: Props) {
  return (
    <header className="topbar">
      <p className="crumbs" aria-label={t('Percorso')}><span>Dashboard</span> / <b>{sectionById(active).label}</b></p>
      <div className="filters" role="toolbar" aria-label={t('Filtri della pagina')}>
        {/* Su telefono il periodo è un menu: così periodo, area e vista stanno su una riga sola nella barra fissa. */}
        <div className="filter-field period-select">
          <Select label={t('Periodo')} value={String(days)} onChange={(v) => onDays(Number(v))} options={PERIODS.map((p) => ({ value: String(p.days), label: p.label }))} icon={CalendarDays} align="left" />
        </div>
        <div className="segmented periods" role="radiogroup" aria-label={t('Periodo')}>
          {PERIODS.map((p) => (
            <button key={p.days} type="button" role="radio" aria-checked={days === p.days} className={days === p.days ? 'is-active' : ''} onClick={() => onDays(p.days)}>{p.label}</button>
          ))}
        </div>
        <div className="filter-field">
          <span className="filter-label">{t('Area')}</span>
          <Select label={t('Area')} value={country} onChange={onCountry} options={areaOptions(countries, country)} />
        </div>
        <div className="filter-field">
          <span className="filter-label">{t('Vista')}</span>
          <Select label={t('Vista')} value={audience} onChange={onAudience} options={audienceOptions()} />
        </div>
        <button className="btn ghost icon-only" type="button" onClick={onReload} disabled={loading} aria-label={t('Aggiorna i dati')} title={t('Aggiorna i dati')}>
          <RefreshCw size={17} className={loading ? 'spin' : undefined} />
        </button>
      </div>
      {/* Lingua: nell'angolo in alto a destra, separata dai filtri dei dati. */}
      <div className="topbar-lang">
        <LangSwitch />
      </div>
    </header>
  )
}
