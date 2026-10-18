import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

type Props = { now: number; before: number | null | undefined; mode?: 'relative' | 'points'; good?: 'up' | 'down' | 'neutral' }

/** Variazione rispetto al periodo precedente: freccia + testo, mai solo colore. */
export function Delta({ now, before, mode = 'relative', good = 'up' }: Props) {
  if (before == null) return null
  const diff = mode === 'points' ? (now - before) * 100 : before === 0 ? (now > 0 ? Infinity : 0) : ((now - before) / before) * 100
  if (!Number.isFinite(diff)) return <span className="delta is-neutral"><ArrowUpRight size={14} /> nuovo rispetto al periodo precedente</span>
  const rounded = Math.round(diff * 10) / 10
  const dir = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat'
  const tone = dir === 'flat' || good === 'neutral' ? 'is-neutral' : dir === good ? 'is-good' : 'is-bad'
  const Icon = dir === 'up' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus
  const text = `${rounded > 0 ? '+' : ''}${rounded.toLocaleString('it-IT')}${mode === 'points' ? ' pp' : '%'}`
  return (
    <span className={`delta ${tone}`} title="Rispetto al periodo precedente di pari durata">
      <Icon size={14} strokeWidth={2.4} /> {text} <span className="delta-ref">vs periodo prec.</span>
    </span>
  )
}
