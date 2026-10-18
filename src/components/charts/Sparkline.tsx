/** Andamento compatto (area + linea), senza assi: per le card in evidenza. */
export function Sparkline({ values, color = 'var(--series-1)', label }: { values: number[]; color?: string; label: string }) {
  const max = Math.max(1, ...values)
  const n = Math.max(1, values.length - 1)
  const points = values.map((v, i) => [(i / n) * 100, 30 - (v / max) * 26] as const)
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
  return (
    <svg className="sparkline" viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label={label}>
      {values.length > 1 && (
        <>
          <path d={`${line} L100 32 L0 32 Z`} fill={color} opacity="0.12" />
          <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}
