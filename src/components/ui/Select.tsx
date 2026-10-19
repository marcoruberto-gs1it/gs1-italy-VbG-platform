import { useCallback, useId, useRef, useState, type KeyboardEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check, ChevronDown } from 'lucide-react'
import { useDismiss } from '../../hooks/useDismiss'
import { gsap, motionOk, useGSAP } from '../../lib/motion'

export type SelectOption<T extends string> = {
  value: T
  label: string
  hint?: string
  icon?: LucideIcon
  /** Testo breve mostrato nel pulsante in modalità compatta (es. IT). */
  short?: string
  /** Lingua del testo dell'opzione (es. nomi delle lingue). */
  lang?: string
}

type Props<T extends string> = {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  label: string
  icon?: LucideIcon
  align?: 'left' | 'right'
  /** Pulsante stretto: mostra solo il testo breve dell'opzione scelta. */
  compact?: boolean
}

/** Menu a tendina del UI kit (al posto del <select> nativo): lista accessibile da tastiera. */
export function Select<T extends string>({ value, options, onChange, label, icon: TriggerIcon, align = 'right', compact = false }: Props<T>) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = options.find((o) => o.value === value) ?? options[0]
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, [root], close)

  useGSAP(
    () => {
      if (!open || !motionOk()) return
      gsap.from('.select-menu', { y: -6, opacity: 0, scale: 0.98, transformOrigin: align === 'right' ? '100% 0' : '0 0', duration: 0.22, ease: 'power2.out' })
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

  function onKeyDown(e: KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openMenu()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % options.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + options.length) % options.length)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      choose(active)
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  const CurrentIcon = compact ? TriggerIcon : (current.icon ?? TriggerIcon)
  return (
    <div className={`select align-${align} ${compact ? 'is-compact' : ''} ${open ? 'is-open' : ''}`} ref={root}>
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
        <span>{compact ? (current.short ?? current.label) : current.label}</span>
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
                lang={o.lang}
                aria-selected={o.value === value}
                className={`select-option ${i === active ? 'is-active' : ''} ${o.value === value ? 'is-selected' : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(i)
                }}
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
