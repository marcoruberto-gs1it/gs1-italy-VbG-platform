import { useMemo, useState } from 'react'
import { useReveal } from '../../hooks/useReveal'
import { useWidth } from '../../hooks/useWidth'
import italy from '../../lib/italy-regions.json'
import { num, pct } from '../../lib/format'
import { mapClass, mapLegend, type MapMetric } from '../../lib/stats'
import type { DashboardData } from '../../lib/types'

const SEQ = ['var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)', 'var(--seq-5)', 'var(--seq-6)']

type Props = { data: DashboardData['regioni']; metric: MapMetric; onMetric: (m: MapMetric) => void }

/** Mappa d'Italia per regione, su scala sequenziale a una tinta. */
export function ItalyMap({ data, metric, onMetric }: Props) {
  const [ref, mapWidth] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null)
  const byCode = useMemo(() => new Map(data.filter((r) => r.country === 'IT' && r.region_code).map((r) => [r.region_code as string, r])), [data])
  const abroad = data.filter((r) => r.country !== 'IT').reduce((a, r) => a + r.letture, 0)

  const valueOf = (code: string) => {
    const r = byCode.get(code)
    if (!r) return null
    return metric === 'letture' ? r.letture : r.letture ? r.letture_2d / r.letture : 0
  }
  const max = Math.max(1, ...italy.regions.map((g) => valueOf(g.code) ?? 0))
  const fmt = (v: number) => (metric === 'letture' ? num(Math.round(v)) : `${Math.round(v * 100)}%`)
  const legend = mapLegend(metric, max, fmt)

  useReveal(ref, (tl) => {
    tl.from(ref.current!.querySelectorAll('.map-region'), { opacity: 0, scale: 0.94, transformOrigin: '50% 50%', duration: 0.55, ease: 'power2.out', stagger: { amount: 0.9, from: 'start' } })
  }, [])

  const active = hover ? byCode.get(hover.code) : undefined
  const activeName = hover ? italy.regions.find((r) => r.code === hover.code)?.name : ''
  const pointAt = (code: string, clientX: number, clientY: number) => {
    const box = ref.current?.getBoundingClientRect()
    if (box) setHover({ code, x: clientX - box.left, y: clientY - box.top })
  }

  return (
    <div className="map" ref={ref}>
      <div className="map-toolbar">
        <div className="segmented small" role="radiogroup" aria-label="Misura sulla mappa">
          {(['letture', 'quota'] as const).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={metric === m} className={metric === m ? 'is-active' : ''} onClick={() => onMetric(m)}>
              {m === 'letture' ? 'Scansioni' : 'Quota 2D'}
            </button>
          ))}
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
                style={{ fill: v == null ? 'var(--seq-empty)' : SEQ[mapClass(metric, v, max)] }}
                tabIndex={0}
                aria-label={`${g.name}: ${v == null ? 'nessuna scansione' : fmt(v)}`}
                onMouseMove={(e) => pointAt(g.code, e.clientX, e.clientY)}
                onClick={(e) => pointAt(g.code, e.clientX, e.clientY)}
                onFocus={() => setHover({ code: g.code, x: 40, y: 60 })}
                onBlur={() => setHover(null)}
              />
            )
          })}
        </svg>
        {hover && (
          <div className="tooltip" style={{ left: Math.max(0, Math.min(hover.x + 14, mapWidth - 210)), top: hover.y + 14 }}>
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
        {legend.map((label, i) => <li key={label}><i style={{ background: SEQ[i] }} />{label}</li>)}
        <li><i style={{ background: 'var(--seq-empty)' }} />nessun dato</li>
      </ul>
      {abroad > 0 && <p className="map-note">Altre {num(abroad)} scansioni da fuori Italia.</p>}
    </div>
  )
}
