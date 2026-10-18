import type { ReactNode } from 'react'
import { CircleCheck, Minus, OctagonAlert, TriangleAlert } from 'lucide-react'

export type Tone = 'good' | 'warning' | 'critical' | 'neutral'

const ICONS = { good: CircleCheck, warning: TriangleAlert, critical: OctagonAlert, neutral: Minus } as const

/** Etichetta di stato: icona + testo (il colore non è mai l'unica informazione). */
export function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  const Icon = ICONS[tone]
  return <span className={`pill is-${tone}`}><Icon size={13} strokeWidth={2.4} /> {children}</span>
}
