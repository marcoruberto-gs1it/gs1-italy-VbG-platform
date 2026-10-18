/* UI kit: componenti di base della piattaforma. */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight, Check, ChevronDown, CircleCheck, Minus, OctagonAlert, Table2, TriangleAlert, ChartColumn } from 'lucide-react'
import { gsap, motionOk, useGSAP } from '../lib/motion'

/* Riquadro icona: icona Lucide su fondo tenue, in quattro toni del marchio. */
export function IconTile({ icon: Icon, tone = 'navy', size = 'md' }: { icon: LucideIcon; tone?: 'navy' | 'orange' | 'sky' | 'peach'; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`icon-tile tone-${tone} size-${size}`} aria-hidden="true">
      <Icon size={size === 'lg' ? 26 : size === 'sm' ? 16 : 20} strokeWidth={2.1} />
    </span>
  )
}

/* Numero che conta fino al valore (e da un valore all'altro quando cambiano i filtri). */
export function Counter({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const last = useRef(0)
  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      if (!motionOk()) {
        el.textContent = format(value)
        last.current = value
        return
      }
      const state = { n: last.current }
      gsap.to(state, {
        n: value,
        duration: 1.1,
        ease: 'power3.out',
        onUpdate: () => {
          el.textContent = format(Number.isInteger(value) ? Math.round(state.n) : state.n)
        },
        onComplete: () => {
          last.current = value
        },
      })
    },
    { dependencies: [value] },
  )
  return <span ref={ref}>{format(0)}</span>
}

/* Variazione rispetto al periodo precedente: freccia + testo, mai solo colore. */
export function Delta({ now, before, mode = 'relative', good = 'up' }: { now: number; before: number | null | undefined; mode?: 'relative' | 'points'; good?: 'up' | 'down' | 'neutral' }) {
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

/* Etichetta di stato: icona + testo. */
export function StatusPill({ tone, children }: { tone: 'good' | 'warning' | 'critical' | 'neutral'; children: ReactNode }) {
  const Icon = tone === 'good' ? CircleCheck : tone === 'warning' ? TriangleAlert : tone === 'critical' ? OctagonAlert : Minus
  return <span className={`pill is-${tone}`}><Icon size={13} strokeWidth={2.4} /> {children}</span>
}

/* Card di sezione con titolo, icona e (facoltativa) alternanza grafico/tabella. */
export function Panel({ title, subtitle, icon, tone, children, table, className = '', action }: { title: string; subtitle?: string; icon?: LucideIcon; tone?: 'navy' | 'orange' | 'sky' | 'peach'; children: ReactNode; table?: ReactNode; className?: string; action?: ReactNode }) {
  const [showTable, setShowTable] = useState(false)
  return (
    <section className={`panel reveal ${className}`}>
      <header className="panel-head">
        {icon && <IconTile icon={icon} tone={tone} size="sm" />}
        <div className="panel-title">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
        {table && (
          <button className="chip-btn" type="button" onClick={() => setShowTable((v) => !v)} aria-pressed={showTable}>
            {showTable ? <><ChartColumn size={15} /> Grafico</> : <><Table2 size={15} /> Tabella</>}
          </button>
        )}
      </header>
      {showTable && table ? table : children}
    </section>
  )
}

/* Intestazione di una sezione della pagina (ancora per la navigazione). */
export function SectionHeader({ id, icon: Icon, eyebrow, title, text }: { id: string; icon: LucideIcon; eyebrow: string; title: string; text?: string }) {
  return (
    <header className="section-head reveal" id={id}>
      <span className="section-icon"><Icon size={22} strokeWidth={2.1} /></span>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {text && <p className="section-text">{text}</p>}
      </div>
    </header>
  )
}

/* Menu a tendina del UI kit (sostituisce il <select> nativo): lista accessibile da tastiera. */
export type SelectOption<T extends string> = { value: T; label: string; hint?: string; icon?: LucideIcon }

export function Select<T extends string>({ value, options, onChange, label, icon: TriggerIcon }: { value: T; options: SelectOption<T>[]; onChange: (value: T) => void; label: string; icon?: LucideIcon }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = options.find((o) => o.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  useGSAP(
    () => {
      if (!open || !motionOk()) return
      gsap.from('.select-menu', { y: -6, opacity: 0, scale: 0.98, transformOrigin: '100% 0', duration: 0.22, ease: 'power2.out' })
      gsap.from('.select-option', { y: -4, opacity: 0, duration: 0.2, stagger: 0.03, delay: 0.05 })
    },
    { scope: root, dependencies: [open] },
  )

  function openMenu() {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }

  function choose(index: number) {
    onChange(options[index].value)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openMenu()
      }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % options.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + options.length) % options.length) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active) }
    else if (e.key === 'Escape' || e.key === 'Tab') setOpen(false)
  }

  const CurrentIcon = current.icon ?? TriggerIcon
  return (
    <div className={`select ${open ? 'is-open' : ''}`} ref={root}>
      <button
        type="button"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${current.label}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
      >
        {CurrentIcon && <CurrentIcon size={17} aria-hidden="true" />}
        <span>{current.label}</span>
        <ChevronDown size={16} className="select-chevron" aria-hidden="true" />
      </button>
      {open && (
        <ul className="select-menu" role="listbox" id={listId} aria-label={label} aria-activedescendant={`${listId}-${active}`}>
          {options.map((o, i) => {
            const Icon = o.icon
            return (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={o.value === value}
                className={`select-option ${i === active ? 'is-active' : ''} ${o.value === value ? 'is-selected' : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); choose(i) }}
              >
                {Icon && <span className="select-option-icon"><Icon size={16} /></span>}
                <span className="select-option-text"><b>{o.label}</b>{o.hint && <small>{o.hint}</small>}</span>
                {o.value === value && <Check size={16} className="select-check" aria-hidden="true" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
