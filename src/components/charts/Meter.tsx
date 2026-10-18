/** Barra di avanzamento compatta: una quota tra 0 e 1 su una traccia al 100%. */
export function Meter({ value, color = 'var(--series-1)', label }: { value: number; color?: string; label: string }) {
  const v = Math.min(1, Math.max(0, value))
  return (
    <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} aria-label={label}>
      <span style={{ width: `${v * 100}%`, background: color }} />
    </div>
  )
}
