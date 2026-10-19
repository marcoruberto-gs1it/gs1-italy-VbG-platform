import { LANGS, setLang, useLang } from '../../i18n'

/** Scelta della lingua (IT / EN): la scelta viene ricordata per le visite successive. */
export function LangSwitch({ tone = 'default' }: { tone?: 'default' | 'light' }) {
  const current = useLang()
  return (
    <div className={`segmented small lang-switch ${tone === 'light' ? 'is-light' : ''}`} role="radiogroup" aria-label="Lingua / Language">
      {LANGS.map((l) => (
        <button key={l.id} type="button" role="radio" lang={l.id} aria-checked={current === l.id} aria-label={l.label} title={l.label} className={current === l.id ? 'is-active' : ''} onClick={() => setLang(l.id)}>
          {l.short}
        </button>
      ))}
    </div>
  )
}
