import { useState } from 'react'
import { useReveal } from '../../hooks/useReveal'
import { useWidth } from '../../hooks/useWidth'
import { day, longDay, num, pct } from '../../lib/format'
import { niceScale, topRounded } from '../../lib/stats'
import type { DashboardData } from '../../lib/types'
import { Empty } from './Empty'

const HEIGHT = 260
const PAD = { top: 14, right: 8, bottom: 28, left: 44 }

/** Andamento giornaliero: barre impilate barcode 1D / codici 2D, con tooltip. */
export function DailyChart({ data }: { data: DashboardData['giornaliero'] }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const innerW = Math.max(10, width - PAD.left - PAD.right)
  const innerH = HEIGHT - PAD.top - PAD.bottom
  const totals = data.map((d) => d.letture_1d + d.letture_2d)
  const { max, ticks } = niceScale(Math.max(0, ...totals))
  const step = innerW / Math.max(1, data.length)
  const barW = Math.max(2, Math.min(26, step - 3))
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH
  const labelEvery = Math.ceil(data.length / Math.max(2, Math.floor(innerW / 72)))
  const active = hover != null ? data[hover] : null

  useReveal(ref, (tl) => {
    tl.from(ref.current!.querySelectorAll('.daily-bar'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.7, ease: 'power3.out', stagger: { amount: 0.6 } })
  }, [totals.join(',')])

  if (!totals.some(Boolean) && !data.some((d) => d.manuali)) return <Empty text="Nessuna scansione nel periodo." />

  return (
    <div className="chart" ref={ref}>
      <ul className="legend">
        <li><i style={{ background: 'var(--series-1)' }} /> Barcode 1D</li>
        <li><i style={{ background: 'var(--series-2)' }} /> Codici 2D</li>
      </ul>
      <svg width={width} height={HEIGHT} role="img" aria-label="Scansioni al giorno, divise tra barcode 1D e codici 2D" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={PAD.left + innerW} y1={y(t)} y2={y(t)} className={t === 0 ? 'axis' : 'grid'} />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="tick">{num(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD.left + i * step + (step - barW) / 2
          const h1 = (d.letture_1d / max) * innerH
          const h2 = (d.letture_2d / max) * innerH
          const gap = d.letture_1d && d.letture_2d ? 2 : 0
          const base = PAD.top + innerH
          return (
            <g key={d.giorno} className={hover != null && hover !== i ? 'is-dim' : ''}>
              <g className="daily-bar">
                <path d={topRounded(x, base - h1, barW, h1, d.letture_2d ? 0 : 4)} fill="var(--series-1)" />
                <path d={topRounded(x, base - h1 - gap - h2, barW, h2, 4)} fill="var(--series-2)" />
              </g>
              {i % labelEvery === 0 && <text x={x + barW / 2} y={HEIGHT - 8} textAnchor="middle" className="tick">{day(d.giorno)}</text>}
              <rect
                x={PAD.left + i * step}
                y={PAD.top}
                width={step}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onClick={() => setHover(i)}
                tabIndex={0}
                aria-label={`${longDay(d.giorno)}: ${d.letture_1d} barcode 1D, ${d.letture_2d} codici 2D`}
              />
            </g>
          )
        })}
      </svg>
      {active && hover != null && (
        <div className="tooltip" style={{ left: Math.min(width - 200, Math.max(0, PAD.left + hover * step + step / 2 - 100)), top: 34 }}>
          <strong>{longDay(active.giorno)}</strong>
          <span><i style={{ background: 'var(--series-2)' }} /> Codici 2D <b>{num(active.letture_2d)}</b></span>
          <span><i style={{ background: 'var(--series-1)' }} /> Barcode 1D <b>{num(active.letture_1d)}</b></span>
          <span className="tooltip-muted">Quota 2D {pct(active.letture_2d, active.letture_1d + active.letture_2d)} · a mano {num(active.manuali)}</span>
        </div>
      )}
    </div>
  )
}
