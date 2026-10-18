import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { CircleCheck, CircleSlash, Keyboard, OctagonAlert, TriangleAlert } from 'lucide-react'
import { day, longDay, num, pct } from '../lib/format'
import type { DashboardData } from '../lib/types'

/* ───── Riquadro con titolo, sottotitolo e (facoltativa) vista tabella ───── */

export function Panel({ title, subtitle, children, table, wide }: { title: string; subtitle?: string; children: ReactNode; table?: ReactNode; wide?: boolean }) {
  const [showTable, setShowTable] = useState(false)
  return (
    <section className={`panel ${wide ? 'is-wide' : ''}`}>
      <header className="panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {table && (
          <button className="ghost-btn" type="button" onClick={() => setShowTable((v) => !v)} aria-pressed={showTable}>
            {showTable ? 'Grafico' : 'Tabella'}
          </button>
        )}
      </header>
      {showTable && table ? table : children}
    </section>
  )
}

/* ───── Indicatore singolo ───── */

export function StatTile({ label, value, detail, tone }: { label: string; value: string; detail?: string; tone?: 'alert' }) {
  return (
    <div className={`stat ${tone === 'alert' ? 'is-alert' : ''}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {detail && <span className="stat-detail">{detail}</span>}
    </div>
  )
}

/* ───── Andamento giornaliero: barre impilate 1D / 2D ───── */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(600)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

/** Rettangolo con angoli arrotondati solo all'estremità dei dati (in alto). */
function topRounded(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0 || w <= 0) return ''
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`
}

/** Scala con tacche tonde (1, 2, 5 × 10ⁿ), circa quattro intervalli, solo numeri interi. */
function niceScale(v: number) {
  const raw = Math.max(1, v) / 4
  const p = 10 ** Math.floor(Math.log10(raw))
  const n = raw / p
  const step = Math.max(1, (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p)
  const max = Math.max(step, Math.ceil(v / step) * step)
  return { max, ticks: Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step) }
}

export function DailyChart({ data }: { data: DashboardData['giornaliero'] }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const height = 240
  const pad = { top: 12, right: 8, bottom: 26, left: 44 }
  const innerW = Math.max(10, width - pad.left - pad.right)
  const innerH = height - pad.top - pad.bottom
  const totals = data.map((d) => d.letture_1d + d.letture_2d)
  const { max, ticks } = niceScale(Math.max(0, ...totals))
  const step = innerW / Math.max(1, data.length)
  const barW = Math.max(2, Math.min(28, step - 3))
  const y = (v: number) => pad.top + innerH - (v / max) * innerH
  const labelEvery = Math.ceil(data.length / Math.max(2, Math.floor(innerW / 70)))
  const active = hover != null ? data[hover] : null

  if (!totals.some(Boolean) && !data.some((d) => d.manuali)) return <p className="empty">Nessuna scansione nel periodo.</p>

  return (
    <div className="chart" ref={ref}>
      <ul className="legend">
        <li><i style={{ background: 'var(--series-1)' }} /> Barcode 1D</li>
        <li><i style={{ background: 'var(--series-2)' }} /> Codici 2D</li>
      </ul>
      <svg width={width} height={height} role="img" aria-label="Scansioni al giorno, divise tra barcode 1D e codici 2D" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={pad.left + innerW} y1={y(t)} y2={y(t)} className={t === 0 ? 'axis' : 'grid'} />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="tick">{num(Math.round(t))}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.left + i * step + (step - barW) / 2
          const h1 = (d.letture_1d / max) * innerH
          const h2 = (d.letture_2d / max) * innerH
          const gap = d.letture_1d && d.letture_2d ? 2 : 0
          const base = pad.top + innerH
          return (
            <g key={d.giorno} className={hover != null && hover !== i ? 'is-dim' : ''}>
              <path d={topRounded(x, base - h1, barW, h1, d.letture_2d ? 0 : 4)} fill="var(--series-1)" />
              <path d={topRounded(x, base - h1 - gap - h2, barW, h2, 4)} fill="var(--series-2)" />
              {i % labelEvery === 0 && <text x={x + barW / 2} y={height - 8} textAnchor="middle" className="tick">{day(d.giorno)}</text>}
              {/* area di aggancio più ampia della barra */}
              <rect x={pad.left + i * step} y={pad.top} width={step} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${longDay(d.giorno)}: ${d.letture_1d} barcode 1D, ${d.letture_2d} codici 2D`} />
            </g>
          )
        })}
      </svg>
      {active && hover != null && (
        <div className="tooltip" style={{ left: Math.min(width - 190, Math.max(0, pad.left + hover * step + step / 2 - 95)) }}>
          <strong>{longDay(active.giorno)}</strong>
          <span><i style={{ background: 'var(--series-2)' }} /> Codici 2D <b>{num(active.letture_2d)}</b></span>
          <span><i style={{ background: 'var(--series-1)' }} /> Barcode 1D <b>{num(active.letture_1d)}</b></span>
          <span className="tooltip-muted">Quota 2D {pct(active.letture_2d, active.letture_1d + active.letture_2d)} · inseriti a mano {num(active.manuali)}</span>
        </div>
      )}
    </div>
  )
}

/* ───── Classifica a barre orizzontali (una sola serie) ───── */

export type BarRow = { key: string; label: string; value: number; sub?: string; note?: string }

export function BarList({ rows, color = 'var(--series-1)', format = num, empty = 'Nessun dato nel periodo.' }: { rows: BarRow[]; color?: string; format?: (n: number) => string; empty?: string }) {
  if (!rows.length) return <p className="empty">{empty}</p>
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <ol className="barlist">
      {rows.map((r) => (
        <li key={r.key} title={`${r.label}: ${format(r.value)}${r.note ? ` · ${r.note}` : ''}`}>
          <div className="barlist-text">
            <span className="barlist-label">{r.label}{r.sub && <small>{r.sub}</small>}</span>
            <span className="barlist-value">{format(r.value)}{r.note && <small>{r.note}</small>}</span>
          </div>
          <span className="barlist-track"><span className="barlist-bar" style={{ width: `${(r.value / max) * 100}%`, background: color }} /></span>
        </li>
      ))}
    </ol>
  )
}

/* ───── Conformità agli standard GS1: barra al 100% con colori di stato + icona + etichetta ───── */

const statusMeta = {
  gs1: { label: 'Codice Standard GS1', color: 'var(--status-good)', icon: CircleCheck },
  partial: { label: 'Dati GS1 in codice non standard', color: 'var(--status-warning)', icon: TriangleAlert },
  error: { label: 'Codice GS1 con errori', color: 'var(--status-critical)', icon: OctagonAlert },
  none: { label: 'Non è un codice GS1', color: 'var(--neutral-bar)', icon: CircleSlash },
  manual: { label: 'Inserito a mano', color: 'var(--neutral-bar-2)', icon: Keyboard },
} as const

export function ComplianceBar({ data }: { data: DashboardData['conformita'] }) {
  const order = ['gs1', 'partial', 'error', 'none', 'manual'] as const
  const total = order.reduce((a, k) => a + (data[k] ?? 0), 0)
  if (!total) return <p className="empty">Nessuna scansione nel periodo.</p>
  return (
    <div className="compliance">
      <div className="stack" role="img" aria-label="Ripartizione delle scansioni per conformità agli standard GS1">
        {order.filter((k) => data[k]).map((k) => (
          <span key={k} style={{ flexGrow: data[k], background: statusMeta[k].color }} title={`${statusMeta[k].label}: ${num(data[k])} (${pct(data[k] ?? 0, total)})`} />
        ))}
      </div>
      <ul className="status-legend">
        {order.map((k) => {
          const { label, color, icon: Icon } = statusMeta[k]
          return (
            <li key={k}>
              <Icon size={16} style={{ color }} aria-hidden="true" />
              <span>{label}</span>
              <b>{pct(data[k] ?? 0, total)}</b>
              <small>{num(data[k] ?? 0)}</small>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ───── Tabella semplice ───── */

export function DataTable<T>({ rows, columns, empty = 'Nessun dato nel periodo.' }: { rows: T[]; columns: { label: string; render: (row: T) => ReactNode; numeric?: boolean }[]; empty?: string }) {
  if (!rows.length) return <p className="empty">{empty}</p>
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c.label} className={c.numeric ? 'num' : undefined}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{columns.map((c) => <td key={c.label} className={c.numeric ? 'num' : undefined}>{c.render(row)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
