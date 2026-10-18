import { useRef } from 'react'
import { useReveal } from '../../hooks/useReveal'
import { pct } from '../../lib/format'
import { share } from '../../lib/stats'

const R = 70
const C = 2 * Math.PI * R

/** Anello con una sola quota (es. codici 2D sul totale). */
export function RingGauge({ value, total, label, caption }: { value: number; total: number; label: string; caption: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const ratio = share(value, total)
  useReveal(ref, (tl) => {
    tl.fromTo(ref.current!.querySelector('.ring-value'), { strokeDashoffset: C }, { strokeDashoffset: C * (1 - ratio), duration: 1.4, ease: 'power3.out' })
  }, [ratio])
  return (
    <div className="ring" ref={ref}>
      <svg viewBox="0 0 180 180" role="img" aria-label={`${label}: ${pct(value, total)}`}>
        <circle cx="90" cy="90" r={R} className="ring-track" />
        <circle cx="90" cy="90" r={R} className="ring-value" strokeDasharray={C} strokeDashoffset={C * (1 - ratio)} transform="rotate(-90 90 90)" />
      </svg>
      <div className="ring-center">
        <strong>{pct(value, total)}</strong>
        <span>{label}</span>
      </div>
      <p className="ring-caption">{caption}</p>
    </div>
  )
}
