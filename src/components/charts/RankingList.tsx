import { useRef } from 'react'
import { useReveal } from '../../hooks/useReveal'
import { num } from '../../lib/format'
import { Empty } from './Empty'
import { t } from '../../i18n'

export type RankRow = { key: string; label: string; sub?: string | null; value: number; stats: { label: string; value: string; meter?: number }[] }

/** Classifica a righe: posizione, nome, barra delle scansioni e indicatori. Su telefono, una scheda per riga. */
export function RankingList({ rows, valueLabel, empty }: { rows: RankRow[]; valueLabel?: string; empty?: string }) {
  const ref = useRef<HTMLOListElement>(null)
  const max = Math.max(...rows.map((r) => r.value), 1)
  useReveal(ref, (tl) => {
    tl.from(ref.current!.querySelectorAll('.rank-row'), { y: 12, opacity: 0, duration: 0.45, stagger: 0.04, ease: 'power3.out' })
      .from(ref.current!.querySelectorAll('.rank-bar span, .rank-meter span'), { scaleX: 0, transformOrigin: '0 50%', duration: 0.8, stagger: 0.02, ease: 'power3.out' }, '<0.15')
  }, [rows.map((r) => r.value).join(',')])
  if (!rows.length) return <Empty text={empty} />
  return (
    <div className="rank">
      <div className="rank-head" aria-hidden="true">
        <span>#</span>
        <span>{t('Nome')}</span>
        <span>{valueLabel ?? t('Scansioni')}</span>
        {rows[0].stats.map((s) => <span key={s.label}>{s.label}</span>)}
      </div>
      <ol className="rank-list" ref={ref}>
        {rows.map((r, i) => (
          <li key={r.key} className="rank-row">
            <span className="rank-pos">{i + 1}</span>
            <span className="rank-name"><b>{r.label}</b>{r.sub && <small>{r.sub}</small>}</span>
            <span className="rank-value">
              <b>{num(r.value)}</b>
              <span className="rank-bar"><span style={{ width: `${(r.value / max) * 100}%` }} /></span>
            </span>
            {r.stats.map((s) => (
              <span key={s.label} className="rank-stat">
                <small>{s.label}</small>
                <b>{s.value}</b>
                {s.meter != null && <span className="rank-meter"><span style={{ width: `${s.meter * 100}%` }} /></span>}
              </span>
            ))}
          </li>
        ))}
      </ol>
    </div>
  )
}
