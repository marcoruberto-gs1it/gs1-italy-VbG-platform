import { useState, type ReactNode } from 'react'
import { ChartColumn, Table2 } from 'lucide-react'

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
            {showTable ? <><ChartColumn size={15} /> Grafico</> : <><Table2 size={15} /> Tabella</>}
          </button>
        )}
      </header>
      {showTable && table ? table : children}
    </section>
  )
}

/** Intestazione di una sezione della pagina; l'id è l'ancora usata dal menu. */
export function SectionHeader({ id, title, text }: { id: string; title: string; text?: string }) {
  return (
    <header className="section-head reveal" id={id}>
      <h2>{title}</h2>
      {text && <p className="section-text">{text}</p>}
    </header>
  )
}
