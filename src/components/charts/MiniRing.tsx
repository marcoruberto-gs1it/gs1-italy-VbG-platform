const R = 22
const C = 2 * Math.PI * R

/** Anello piccolo con una quota tra 0 e 1. */
export function MiniRing({ value, color = 'var(--series-2)', label }: { value: number; color?: string; label: string }) {
  const v = Math.min(1, Math.max(0, value))
  return (
    <svg className="mini-ring" viewBox="0 0 56 56" width="56" height="56" role="img" aria-label={label}>
      <circle cx="28" cy="28" r={R} className="mini-ring-track" />
      <circle cx="28" cy="28" r={R} className="mini-ring-value" stroke={color} strokeDasharray={C} strokeDashoffset={C * (1 - v)} transform="rotate(-90 28 28)" />
    </svg>
  )
}
