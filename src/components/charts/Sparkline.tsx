import { useId } from 'react'
import { smoothPath } from '../../lib/stats'

/** Andamento compatto: curva morbida con area sfumata, senza assi. Per le card in evidenza. */
export function Sparkline({ values, color = 'var(--series-1)', label }: { values: number[]; color?: string; label: string }) {
  const id = useId().replace(/:/g, '')
  const max = Math.max(1, ...values)
  const n = Math.max(1, values.length - 1)
  const points = values.map((v, i) => [(i / n) * 100, 30 - (v / max) * 26] as [number, number])
  const line = smoothPath(points)
  const last = points[points.length - 1]
  return (
    <svg className="sparkline" viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {values.length > 1 && (
        <>
          <path d={`${line} L100 32 L0 32 Z`} fill={`url(#spark-${id})`} />
          <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
          {last && <circle cx={last[0]} cy={last[1]} r="2.4" fill="#fff" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />}
        </>
      )}
    </svg>
  )
}
