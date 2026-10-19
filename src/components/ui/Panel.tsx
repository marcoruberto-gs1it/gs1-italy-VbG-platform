import { useState, type ReactNode } from 'react'
import { ChartColumn, Table2 } from 'lucide-react'
import { useAudience } from '../../hooks/useAudience'
import { t } from '../../i18n'
import { whatOf, whyFor } from '../../lib/audiences'
import type { SectionId } from '../../lib/config'

type PanelProps = { title: string; subtitle?: string; children: ReactNode; table?: ReactNode; className?: string }

/** Card di sezione con titolo e, se c'è una vista tabellare, il pulsante Grafico/Tabella. */
export function Panel({ title, subtitle, children, table, className = '' }: PanelProps) {
  const [showTable, setShowTable] = useState(false)
  return (
    <section className={`panel reveal ${className}`}>
      <header className="panel-head">
        <div className="panel-title">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {table && (
          <button className="chip-btn" type="button" onClick={() => setShowTable((v) => !v)} aria-pressed={showTable}>
            {showTable ? <><ChartColumn size={15} /> {t('Grafico')}</> : <><Table2 size={15} /> {t('Tabella')}</>}
          </button>
        )}
      </header>
      {showTable && table ? table : children}
    </section>
  )
}

/**
 * Intestazione di una sezione: titolo, cosa mostra e perché conta (per il pubblico della vista scelta).
 * L'id è l'ancora usata dal menu.
 */
export function SectionHeader({ id, title }: { id: SectionId; title: string }) {
  const audience = useAudience()
  return (
    <header className="section-head reveal" id={id}>
      <h2>{title}</h2>
      <p className="section-what">{whatOf(id)}</p>
      <p className="section-why"><b>{t('Perché conta')}</b> {whyFor(id, audience)}</p>
    </header>
  )
}
