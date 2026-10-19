import { Languages } from 'lucide-react'
import { LANGS, setLang, useLang, type Lang } from '../../i18n'
import { Select } from './Select'

/**
 * Scelta della lingua, nell'angolo in alto a destra: pulsante compatto (icona + IT/EN) che apre
 * l'elenco delle lingue, ognuna col proprio nome. La scelta viene ricordata per le visite successive.
 */
export function LangSwitch() {
  const current = useLang()
  return (
    <div className="lang-select">
      <Select<Lang>
        label="Lingua / Language"
        value={current}
        onChange={setLang}
        icon={Languages}
        compact
        options={LANGS.map((l) => ({ value: l.id, label: l.label, short: l.short, lang: l.id }))}
      />
    </div>
  )
}
