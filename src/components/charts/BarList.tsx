import { useRef } from 'react'
import { useReveal } from '../../hooks/useReveal'
import { num } from '../../lib/format'
import { Empty } from './Empty'

export type BarRow = { key: string; label: string; value: number; sub?: string; note?: string }

type Props = { rows: BarRow[]; color?: string; format?: (n: number) => string; max?: number; onSelect?: (key: string) => void; selectLabel?: (row: BarRow) => string }

/**
 * Classifica a barre orizzontali (una sola serie). `max` fissa il fondo scala (es. 1 = 100%).
 * Con `onSelect` ogni riga è un pulsante (es. per andare nel dettaglio di un paese).
 */
export function BarList({ rows, color = 'var(--series-1)', format = num, max: fixedMax, onSelect, selectLabel }: Props) {
  const ref = useRef<HTMLOListElement>(null)
  const max = fixedMax ?? Math.max(...rows.map((r) => r.value), 1)
  useReveal(ref, (tl) => {
    tl.from(ref.current!.querySelectorAll('.barlist-bar'), { scaleX: 0, transformOrigin: '0 50%', duration: 0.9, ease: 'power3.out', stagger: 0.05 })
  }, [rows.map((r) => r.value).join(',')])
  if (!rows.length) return <Empty />
  return (
    <ol className="barlist" ref={ref}>
      {rows.map((r, i) => (
        <li key={r.key} title={`${r.label}: ${format(r.value)}${r.note ? ` · ${r.note}` : ''}`}>
          <span className="barlist-rank">{i + 1}</span>
          {(() => {
            const body = (
              <>
                <span className="barlist-text">
                  <span className="barlist-label">{r.label}{r.sub && <small>{r.sub}</small>}</span>
                  <span className="barlist-value">{format(r.value)}{r.note && <small>{r.note}</small>}</span>
                </span>
                <span className="barlist-track"><span className="barlist-bar" style={{ width: `${(r.value / max) * 100}%`, background: color }} /></span>
              </>
            )
            return onSelect ? (
              <button type="button" className="barlist-body is-link" onClick={() => onSelect(r.key)} aria-label={selectLabel?.(r)}>{body}</button>
            ) : (
              <div className="barlist-body">{body}</div>
            )
          })()}
        </li>
      ))}
    </ol>
  )
}
