import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CircleCheck, CircleSlash, Keyboard, OctagonAlert, TriangleAlert } from 'lucide-react'
import italy from '../lib/italy-regions.json'
import { day, longDay, num, pct, regionName } from '../lib/format'
import { gsap, motionOk, useGSAP } from '../lib/motion'
import type { DashboardData } from '../lib/types'
import { glyphFor } from '../lib/symbology'
import { EmptyArt, SymbologyGlyph } from './illustrations'

/* ───── Utilità ───── */

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

/** Scala con tacche tonde (1, 2, 5 × 10ⁿ), circa quattro intervalli, solo numeri interi. */
function niceScale(v: number) {
  const raw = Math.max(1, v) / 4
  const p = 10 ** Math.floor(Math.log10(raw))
  const n = raw / p
  const step = Math.max(1, (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p)
  const max = Math.max(step, Math.ceil(v / step) * step)
  return { max, ticks: Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step) }
}

/** Rettangolo con angoli arrotondati solo all'estremità dei dati (in alto). */
function topRounded(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0 || w <= 0) return ''
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`
}

/** Animazione all'ingresso nello schermo, una sola volta. */
function useReveal(scope: React.RefObject<HTMLElement | null>, build: (tl: gsap.core.Timeline) => void, deps: unknown[]) {
  useGSAP(
    () => {
      if (!motionOk() || !scope.current) return
      const tl = gsap.timeline({ scrollTrigger: { trigger: scope.current, start: 'top 88%', once: true } })
      build(tl)
    },
    { scope, dependencies: deps, revertOnUpdate: true },
  )
}

export function Empty({ text = 'Nessun dato nel periodo selezionato.' }: { text?: string }) {
  return (
    <div className="empty">
      <EmptyArt />
      <p>{text}</p>
    </div>
  )
}

/* ───── Andamento giornaliero: barre impilate 1D / 2D ───── */

export function DailyChart({ data }: { data: DashboardData['giornaliero'] }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const height = 260
  const pad = { top: 14, right: 8, bottom: 28, left: 44 }
  const innerW = Math.max(10, width - pad.left - pad.right)
  const innerH = height - pad.top - pad.bottom
  const totals = data.map((d) => d.letture_1d + d.letture_2d)
  const { max, ticks } = niceScale(Math.max(0, ...totals))
  const step = innerW / Math.max(1, data.length)
  const barW = Math.max(2, Math.min(26, step - 3))
  const y = (v: number) => pad.top + innerH - (v / max) * innerH
  const labelEvery = Math.ceil(data.length / Math.max(2, Math.floor(innerW / 72)))
  const active = hover != null ? data[hover] : null
  const key = data.map((d) => d.letture_1d + d.letture_2d).join(',')

  useReveal(ref, (tl) => {
    tl.from(ref.current!.querySelectorAll('.daily-bar'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.7, ease: 'power3.out', stagger: { amount: 0.6 } })
  }, [key])

  if (!totals.some(Boolean) && !data.some((d) => d.manuali)) return <Empty text="Nessuna scansione nel periodo." />

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
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="tick">{num(t)}</text>
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
              <g className="daily-bar">
                <path d={topRounded(x, base - h1, barW, h1, d.letture_2d ? 0 : 4)} fill="var(--series-1)" />
                <path d={topRounded(x, base - h1 - gap - h2, barW, h2, 4)} fill="var(--series-2)" />
              </g>
              {i % labelEvery === 0 && <text x={x + barW / 2} y={height - 8} textAnchor="middle" className="tick">{day(d.giorno)}</text>}
              <rect x={pad.left + i * step} y={pad.top} width={step} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${longDay(d.giorno)}: ${d.letture_1d} barcode 1D, ${d.letture_2d} codici 2D`} />
            </g>
          )
        })}
      </svg>
      {active && hover != null && (
        <div className="tooltip" style={{ left: Math.min(width - 200, Math.max(0, pad.left + hover * step + step / 2 - 100)), top: 34 }}>
          <strong>{longDay(active.giorno)}</strong>
          <span><i style={{ background: 'var(--series-2)' }} /> Codici 2D <b>{num(active.letture_2d)}</b></span>
          <span><i style={{ background: 'var(--series-1)' }} /> Barcode 1D <b>{num(active.letture_1d)}</b></span>
          <span className="tooltip-muted">Quota 2D {pct(active.letture_2d, active.letture_1d + active.letture_2d)} · a mano {num(active.manuali)}</span>
        </div>
      )}
    </div>
  )
}

/* ───── Anello: una sola quota (es. codici 2D sul totale) ───── */

export function RingGauge({ value, total, label, caption }: { value: number; total: number; label: string; caption: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const share = total ? value / total : 0
  const r = 70
  const c = 2 * Math.PI * r
  useReveal(ref, (tl) => {
    tl.fromTo(ref.current!.querySelector('.ring-value'), { strokeDashoffset: c }, { strokeDashoffset: c * (1 - share), duration: 1.4, ease: 'power3.out' })
  }, [share])
  return (
    <div className="ring" ref={ref}>
      <svg viewBox="0 0 180 180" role="img" aria-label={`${label}: ${pct(value, total)}`}>
        <circle cx="90" cy="90" r={r} className="ring-track" />
        <circle cx="90" cy="90" r={r} className="ring-value" strokeDasharray={c} strokeDashoffset={c * (1 - share)} transform="rotate(-90 90 90)" />
      </svg>
      <div className="ring-center">
        <strong>{pct(value, total)}</strong>
        <span>{label}</span>
      </div>
      <p className="ring-caption">{caption}</p>
    </div>
  )
}

/* ───── Simbologie: schede con il disegno del codice ───── */

export function SymbologyGrid({ data }: { data: DashboardData['simbologie'] }) {
  const ref = useRef<HTMLUListElement>(null)
  const total = data.reduce((a, s) => a + s.letture, 0)
  const max = Math.max(1, ...data.map((s) => s.letture))
  useReveal(ref, (tl) => {
    tl.from(ref.current!.querySelectorAll('.sym-card'), { y: 18, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' })
      .from(ref.current!.querySelectorAll('.sym-bar span'), { scaleX: 0, transformOrigin: '0 50%', duration: 0.8, stagger: 0.06, ease: 'power3.out' }, '<0.2')
  }, [total])
  if (!data.length) return <Empty />
  return (
    <ul className="sym-grid" ref={ref}>
      {data.map((s) => (
        <li key={s.simbologia} className="sym-card">
          <span className="sym-glyph"><SymbologyGlyph kind={glyphFor(s.simbologia)} size={40} /></span>
          <span className="sym-text">
            <strong>{s.simbologia}</strong>
            <small>{s.is_2d == null ? 'inserimento manuale' : s.is_2d ? 'codice 2D' : 'barcode 1D'}</small>
          </span>
          <span className="sym-value"><b>{num(s.letture)}</b><small>{pct(s.letture, total)}</small></span>
          <span className="sym-bar"><span style={{ width: `${(s.letture / max) * 100}%`, background: s.is_2d ? 'var(--series-2)' : 'var(--series-1)' }} /></span>
        </li>
      ))}
    </ul>
  )
}

/* ───── Classifica a barre orizzontali (una sola serie) ───── */

export type BarRow = { key: string; label: string; value: number; sub?: string; note?: string }

export function BarList({ rows, color = 'var(--series-1)', format = num }: { rows: BarRow[]; color?: string; format?: (n: number) => string }) {
  const ref = useRef<HTMLOListElement>(null)
  const max = Math.max(...rows.map((r) => r.value), 1)
  useReveal(ref, (tl) => {
    tl.from(ref.current!.querySelectorAll('.barlist-bar'), { scaleX: 0, transformOrigin: '0 50%', duration: 0.9, ease: 'power3.out', stagger: 0.05 })
  }, [rows.map((r) => r.value).join(',')])
  if (!rows.length) return <Empty />
  return (
    <ol className="barlist" ref={ref}>
      {rows.map((r, i) => (
        <li key={r.key} title={`${r.label}: ${format(r.value)}${r.note ? ` · ${r.note}` : ''}`}>
          <span className="barlist-rank">{i + 1}</span>
          <div className="barlist-body">
            <div className="barlist-text">
              <span className="barlist-label">{r.label}{r.sub && <small>{r.sub}</small>}</span>
              <span className="barlist-value">{format(r.value)}{r.note && <small>{r.note}</small>}</span>
            </div>
            <span className="barlist-track"><span className="barlist-bar" style={{ width: `${(r.value / max) * 100}%`, background: color }} /></span>
          </div>
        </li>
      ))}
    </ol>
  )
}

/* ───── Mappa d'Italia per regione (scala sequenziale, una tinta) ───── */

type Metric = 'letture' | 'quota'
const SEQ = ['var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)', 'var(--seq-5)', 'var(--seq-6)']

export function ItalyMap({ data }: { data: DashboardData['regioni'] }) {
  const [ref, mapWidth] = useWidth<HTMLDivElement>()
  const [metric, setMetric] = useState<Metric>('letture')
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null)
  const byCode = useMemo(() => new Map(data.filter((r) => r.country === 'IT' && r.region_code).map((r) => [r.region_code as string, r])), [data])
  const abroad = data.filter((r) => r.country !== 'IT').reduce((a, r) => a + r.letture, 0)

  const valueOf = (code: string) => {
    const r = byCode.get(code)
    if (!r) return null
    return metric === 'letture' ? r.letture : r.letture ? r.letture_2d / r.letture : 0
  }
  const values = italy.regions.map((g) => valueOf(g.code)).filter((v): v is number => v != null)
  const maxV = Math.max(metric === 'letture' ? 1 : 0.01, ...values)
  // Sei classi a intervalli uguali sul massimo del periodo.
  const bin = (v: number) => Math.min(SEQ.length - 1, Math.floor((v / maxV) * SEQ.length))
  const fmt = (v: number) => (metric === 'letture' ? num(Math.round(v)) : `${Math.round(v * 100)}%`)
  const legend = SEQ.map((color, i) => ({ color, from: (maxV * i) / SEQ.length, to: (maxV * (i + 1)) / SEQ.length }))

  useReveal(ref, (tl) => {
    tl.from(ref.current!.querySelectorAll('.map-region'), { opacity: 0, scale: 0.94, transformOrigin: '50% 50%', duration: 0.55, ease: 'power2.out', stagger: { amount: 0.9, from: 'start' } })
  }, [])

  const active = hover ? byCode.get(hover.code) : undefined
  const activeName = hover ? italy.regions.find((r) => r.code === hover.code)?.name : ''

  return (
    <div className="map" ref={ref}>
      <div className="map-toolbar">
        <div className="segmented small" role="radiogroup" aria-label="Misura sulla mappa">
          <button type="button" role="radio" aria-checked={metric === 'letture'} className={metric === 'letture' ? 'is-active' : ''} onClick={() => setMetric('letture')}>Scansioni</button>
          <button type="button" role="radio" aria-checked={metric === 'quota'} className={metric === 'quota' ? 'is-active' : ''} onClick={() => setMetric('quota')}>Quota 2D</button>
        </div>
      </div>
      <div className="map-canvas">
        <svg viewBox={`0 0 ${italy.width} ${italy.height}`} role="img" aria-label={`Mappa d'Italia: ${metric === 'letture' ? 'scansioni' : 'quota di codici 2D'} per regione`} onMouseLeave={() => setHover(null)}>
          {italy.regions.map((g) => {
            const v = valueOf(g.code)
            return (
              <path
                key={g.code}
                d={g.d}
                className={`map-region ${hover?.code === g.code ? 'is-hover' : ''}`}
                style={{ fill: v == null ? 'var(--seq-empty)' : SEQ[bin(v)] }}
                tabIndex={0}
                aria-label={`${g.name}: ${v == null ? 'nessuna scansione' : fmt(v)}`}
                onMouseMove={(e) => {
                  const box = ref.current!.getBoundingClientRect()
                  setHover({ code: g.code, x: e.clientX - box.left, y: e.clientY - box.top })
                }}
                onFocus={() => setHover({ code: g.code, x: 40, y: 60 })}
                onBlur={() => setHover(null)}
              />
            )
          })}
        </svg>
        {hover && (
          <div className="tooltip" style={{ left: Math.min(hover.x + 14, mapWidth - 210), top: hover.y + 14 }}>
            <strong>{activeName}</strong>
            {active ? (
              <>
                <span>Scansioni <b>{num(active.letture)}</b></span>
                <span>Quota 2D <b>{pct(active.letture_2d, active.letture)}</b></span>
                <span>Conformi GS1 <b>{pct(active.conformi, active.letture)}</b></span>
              </>
            ) : (
              <span className="tooltip-muted">Nessuna scansione nel periodo</span>
            )}
          </div>
        )}
      </div>
      <ul className="map-legend" aria-label="Legenda">
        {legend.map((l) => <li key={l.from}><i style={{ background: l.color }} />{fmt(l.from)}–{fmt(l.to)}</li>)}
        <li><i style={{ background: 'var(--seq-empty)' }} />nessun dato</li>
      </ul>
      {abroad > 0 && <p className="map-note">Altre {num(abroad)} scansioni da fuori Italia.</p>}
    </div>
  )
}

/* ───── Conformità agli standard GS1: barra al 100% con colori di stato + icona + etichetta ───── */

const statusMeta = {
  gs1: { label: 'Codice Standard GS1', color: 'var(--good)', icon: CircleCheck },
  partial: { label: 'Dati GS1 in codice non standard', color: 'var(--warning)', icon: TriangleAlert },
  error: { label: 'Codice GS1 con errori', color: 'var(--critical)', icon: OctagonAlert },
  none: { label: 'Non è un codice GS1', color: 'var(--neutral-bar)', icon: CircleSlash },
  manual: { label: 'Inserito a mano', color: 'var(--neutral-bar-2)', icon: Keyboard },
} as const

export function ComplianceBar({ data }: { data: DashboardData['conformita'] }) {
  const ref = useRef<HTMLDivElement>(null)
  const order = ['gs1', 'partial', 'error', 'none', 'manual'] as const
  const total = order.reduce((a, k) => a + (data[k] ?? 0), 0)
  useReveal(ref, (tl) => {
    tl.from(ref.current!.querySelector('.stack'), { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power3.inOut' })
      .from(ref.current!.querySelectorAll('.status-legend li'), { x: -10, opacity: 0, duration: 0.4, stagger: 0.07 }, '-=0.5')
  }, [total])
  if (!total) return <Empty />
  return (
    <div className="compliance" ref={ref}>
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
              <Icon size={17} style={{ color: k === 'manual' ? 'var(--muted)' : color }} aria-hidden="true" />
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

/* ───── Tabella ───── */

export function DataTable<T>({ rows, columns, empty }: { rows: T[]; columns: { label: string; render: (row: T) => ReactNode; numeric?: boolean }[]; empty?: string }) {
  if (!rows.length) return <Empty text={empty} />
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

/** Tabella "regione per regione": vista accessibile della mappa. */
export function RegionTable({ data }: { data: DashboardData['regioni'] }) {
  return (
    <DataTable rows={data} columns={[
      { label: 'Regione', render: (r) => regionName(r.country, r.region_code, r.region) },
      { label: 'Scansioni', render: (r) => num(r.letture), numeric: true },
      { label: 'Quota 2D', render: (r) => pct(r.letture_2d, r.letture), numeric: true },
      { label: 'Conformi GS1', render: (r) => pct(r.conformi, r.letture), numeric: true },
    ]} />
  )
}
