import { useRef } from 'react'
import { CircleCheck, CircleSlash, Keyboard, OctagonAlert, TriangleAlert } from 'lucide-react'
import { useReveal } from '../../hooks/useReveal'
import { num, pct } from '../../lib/format'
import type { DashboardData } from '../../lib/types'
import { Empty } from './Empty'
import { t } from '../../i18n'

const META = {
  gs1: { get label() { return t('Codice Standard GS1') }, color: 'var(--good)', icon: CircleCheck },
  partial: { get label() { return t('Dati GS1 in codice non standard') }, color: 'var(--warning)', icon: TriangleAlert },
  error: { get label() { return t('Codice GS1 con errori') }, color: 'var(--critical)', icon: OctagonAlert },
  none: { get label() { return t('Non è un codice GS1') }, color: 'var(--neutral-bar)', icon: CircleSlash },
  manual: { get label() { return t('Inserito a mano') }, color: 'var(--neutral-bar-2)', icon: Keyboard },
} as const
const ORDER = ['gs1', 'partial', 'error', 'none', 'manual'] as const

/** Conformità agli standard GS1: barra al 100% con colori di stato, sempre con icona ed etichetta. */
export function ComplianceBar({ data }: { data: DashboardData['conformita'] }) {
  const ref = useRef<HTMLDivElement>(null)
  const total = ORDER.reduce((a, k) => a + (data[k] ?? 0), 0)
  useReveal(ref, (tl) => {
    tl.from(ref.current!.querySelector('.stack'), { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power3.inOut' })
      .from(ref.current!.querySelectorAll('.status-legend li'), { x: -10, opacity: 0, duration: 0.4, stagger: 0.07 }, '-=0.5')
  }, [total])
  if (!total) return <Empty />
  return (
    <div className="compliance" ref={ref}>
      <div className="stack" role="img" aria-label={t('Ripartizione delle scansioni per conformità agli standard GS1')}>
        {ORDER.filter((k) => data[k]).map((k) => (
          <span key={k} style={{ flexGrow: data[k], background: META[k].color }} title={`${META[k].label}: ${num(data[k])} (${pct(data[k] ?? 0, total)})`} />
        ))}
      </div>
      <ul className="status-legend">
        {ORDER.map((k) => {
          const { label, color, icon: Icon } = META[k]
          return (
            <li key={k}>
              <Icon size={17} style={{ color: k === 'manual' ? 'var(--muted)' : color }} aria-hidden="true" />
              <span>{label}</span>
              <b>{pct(data[k] ?? 0, total)}</b>
              <small>{num(data[k] ?? 0)}</small>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
