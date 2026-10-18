import { useRef } from 'react'
import { useReveal } from '../../hooks/useReveal'
import { num, pct } from '../../lib/format'
import { pieSlice } from '../../lib/stats'
import { glyphFor, isGs1Symbology } from '../../lib/symbology'
import type { DashboardData } from '../../lib/types'
import { SymbologyGlyph } from '../illustrations'
import { Empty } from './Empty'

type Rows = DashboardData['simbologie']

/** Torta piccola: la quota della simbologia sul totale delle scansioni. */
function MiniPie({ value, color }: { value: number; color: string }) {
  return (
    <svg className="mini-pie" viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
      <circle cx="22" cy="22" r="20" className="mini-pie-track" />
      {value > 0 && <path className="mini-pie-slice" d={pieSlice(value, 20, 22)} fill={color} />}
    </svg>
  )
}

function SymbologyCards({ rows, total }: { rows: Rows; total: number }) {
  return (
    <ul className="sym-grid">
      {rows.map((s) => (
        <li key={s.simbologia} className={`sym-card ${isGs1Symbology(s.simbologia) ? 'is-gs1' : ''}`}>
          <span className="sym-glyph"><SymbologyGlyph kind={glyphFor(s.simbologia)} size={40} /></span>
          <span className="sym-text">
            <strong>{s.simbologia}</strong>
            <small>{s.is_2d == null ? 'senza simbolo' : s.is_2d ? 'codice 2D' : 'barcode 1D'}</small>
            <small>{num(s.letture)} scansioni</small>
          </span>
          <span className="sym-share" aria-label={`${pct(s.letture, total)} delle scansioni`}>
            <MiniPie value={total ? s.letture / total : 0} color={s.is_2d ? 'var(--series-2)' : 'var(--series-1)'} />
            <b>{pct(s.letture, total)}</b>
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Simbologie lette: prima quelle degli standard GS1 (in blu), poi gli altri codici. */
export function SymbologyGrid({ data }: { data: Rows }) {
  const ref = useRef<HTMLDivElement>(null)
  const total = data.reduce((a, s) => a + s.letture, 0)
  const byReads = [...data].sort((a, b) => b.letture - a.letture)
  const groups = [
    { title: 'Standard GS1', rows: byReads.filter((s) => isGs1Symbology(s.simbologia)) },
    { title: 'Altri codici', rows: byReads.filter((s) => !isGs1Symbology(s.simbologia)) },
  ].filter((g) => g.rows.length)

  useReveal(ref, (tl) => {
    tl.from(ref.current!.querySelectorAll('.sym-card'), { y: 18, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out' })
      .from(ref.current!.querySelectorAll('.mini-pie-slice'), { scale: 0, transformOrigin: '22px 22px', duration: 0.6, stagger: 0.05, ease: 'back.out(1.6)' }, '<0.2')
  }, [total])

  if (!data.length) return <Empty />
  return (
    <div className="sym-groups" ref={ref}>
      {groups.map((g) => (
        <section key={g.title}>
          <h4 className="sym-group-title">{g.title} <span>{pct(g.rows.reduce((a, s) => a + s.letture, 0), total)} delle scansioni</span></h4>
          <SymbologyCards rows={g.rows} total={total} />
        </section>
      ))}
    </div>
  )
}
