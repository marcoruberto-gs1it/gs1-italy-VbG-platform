import { useState } from 'react'
import { useReveal } from '../../hooks/useReveal'
import { useWidth } from '../../hooks/useWidth'
import { num, pct } from '../../lib/format'
import { mapClass, mapLegend, type MapMetric } from '../../lib/stats'

const SEQ = ['var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)', 'var(--seq-5)', 'var(--seq-6)']

export type Shape = { code: string; name: string; d: string }

/** Selettore della misura (scansioni o quota di codici 2D), condiviso da mappe e classifiche. */
export function MetricSwitch({ metric, onMetric }: { metric: MapMetric; onMetric: (m: MapMetric) => void }) {
  return (
    <div className="segmented small" role="radiogroup" aria-label="Misura">
      {(['letture', 'quota'] as const).map((m) => (
        <button key={m} type="button" role="radio" aria-checked={metric === m} className={metric === m ? 'is-active' : ''} onClick={() => onMetric(m)}>
          {m === 'letture' ? 'Scansioni' : 'Quota 2D'}
        </button>
      ))}
    </div>
  )
}

export type AreaStats = { letture: number; letture_2d: number; conformi: number }

type Props = {
  shapes: Shape[]
  width: number
  height: number
  stats: Map<string, AreaStats>
  metric: MapMetric
  onMetric: (m: MapMetric) => void
  label: string
  nameOf?: (shape: Shape) => string
  className?: string
  /** Inquadratura (es. un solo paese ingrandito); di base tutta la mappa. */
  viewBox?: string
  /** Area messa in risalto (bordo arancio). */
  focus?: string
  /** Selettore Scansioni / Quota 2D dentro la mappa (false se è già nell'intestazione). */
  toolbar?: boolean
}

/** Mappa coropletica (Italia per regione o mondo per paese) su scala sequenziale a una tinta, con tooltip. */
export function Choropleth({ shapes, width, height, stats, metric, onMetric, label, nameOf = (s) => s.name, className = '', viewBox, focus, toolbar = true }: Props) {
  const [ref, boxWidth] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null)

  const valueOf = (code: string) => {
    const r = stats.get(code)
    if (!r) return null
    return metric === 'letture' ? r.letture : r.letture ? r.letture_2d / r.letture : 0
  }
  const max = Math.max(1, ...shapes.map((s) => valueOf(s.code) ?? 0))
  const fmt = (v: number) => (metric === 'letture' ? num(Math.round(v)) : `${Math.round(v * 100)}%`)
  const legend = mapLegend(metric, max, fmt)

  useReveal(ref, (tl) => {
    tl.from(ref.current!.querySelectorAll('.map-region'), { opacity: 0, duration: 0.5, ease: 'power2.out', stagger: { amount: 0.8, from: 'start' } })
  }, [])

  const active = hover ? stats.get(hover.code) : undefined
  const activeShape = hover ? shapes.find((s) => s.code === hover.code) : undefined
  const pointAt = (code: string, clientX: number, clientY: number) => {
    const box = ref.current?.getBoundingClientRect()
    if (box) setHover({ code, x: clientX - box.left, y: clientY - box.top })
  }

  return (
    <div className={`map ${className}`} ref={ref}>
      {toolbar && (
        <div className="map-toolbar">
          <MetricSwitch metric={metric} onMetric={onMetric} />
        </div>
      )}
      <div className="map-canvas">
        <svg viewBox={viewBox ?? `0 0 ${width} ${height}`} role="img" aria-label={`${label}: ${metric === 'letture' ? 'scansioni' : 'quota di codici 2D'}`} onMouseLeave={() => setHover(null)}>
          {shapes.map((s) => {
            const v = valueOf(s.code)
            return (
              <path
                key={s.code}
                d={s.d}
                className={`map-region ${hover?.code === s.code ? 'is-hover' : ''} ${focus === s.code ? 'is-focus' : ''}`}
                style={{ fill: v == null ? 'var(--seq-empty)' : SEQ[mapClass(metric, v, max)] }}
                tabIndex={v == null ? -1 : 0}
                aria-label={`${nameOf(s)}: ${v == null ? 'nessuna scansione' : fmt(v)}`}
                onMouseMove={(e) => pointAt(s.code, e.clientX, e.clientY)}
                onClick={(e) => pointAt(s.code, e.clientX, e.clientY)}
                onFocus={() => setHover({ code: s.code, x: 40, y: 60 })}
                onBlur={() => setHover(null)}
              />
            )
          })}
        </svg>
        {hover && activeShape && (
          <div className="tooltip" style={{ left: Math.max(0, Math.min(hover.x + 14, boxWidth - 210)), top: hover.y + 14 }}>
            <strong>{nameOf(activeShape)}</strong>
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
        {legend.map((l, i) => <li key={l}><i style={{ background: SEQ[i] }} />{l}</li>)}
        <li><i style={{ background: 'var(--seq-empty)' }} />nessun dato</li>
      </ul>
    </div>
  )
}
