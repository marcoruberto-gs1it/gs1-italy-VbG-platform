import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'
import { useDismiss } from '../../hooks/useDismiss'
import { gsap, motionOk } from '../../lib/motion'

const GAP = 8
const MARGIN = 12
const MAX_WIDTH = 340

/**
 * Icona informazioni che apre una spiegazione in un fumetto.
 * Il fumetto è montato nel body in posizione fissa: nessuna card, tabella o barra lo può coprire
 * (z-index --z-popover) e non viene tagliato dai contenitori. Si apre sotto l'icona o, se manca
 * spazio, sopra; resta sempre dentro lo schermo e segue lo scorrimento.
 */
export function InfoPopover({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const pop = useRef<HTMLDivElement>(null)
  const id = useId()
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, [button, pop], close)

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const b = button.current?.getBoundingClientRect()
      const el = pop.current
      if (!b || !el) return
      const vw = document.documentElement.clientWidth
      const vh = window.innerHeight
      const width = Math.min(MAX_WIDTH, vw - MARGIN * 2)
      el.style.width = `${width}px`
      const left = Math.min(Math.max(MARGIN, b.right - width), vw - MARGIN - width)
      const h = el.offsetHeight
      const fitsBelow = b.bottom + GAP + h <= vh - MARGIN
      const top = fitsBelow || b.top - GAP - h < MARGIN ? b.bottom + GAP : b.top - GAP - h
      el.style.left = `${left}px`
      el.style.top = `${top}px`
      // Se l'icona esce dallo schermo il fumetto si chiude.
      if (b.bottom < 0 || b.top > vh) setOpen(false)
    }
    place()
    if (motionOk() && pop.current) gsap.from(pop.current, { y: -6, opacity: 0, scale: 0.97, duration: 0.2, ease: 'power2.out' })
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open])

  return (
    <>
      <button
        ref={button}
        type="button"
        className={`info-btn ${open ? 'is-open' : ''}`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={label}
        title={label}
        onClick={() => setOpen((v) => !v)}
      >
        <Info size={17} strokeWidth={2.2} />
      </button>
      {open &&
        createPortal(
          <div ref={pop} className="info-pop" id={id} role="dialog" aria-label={label}>
            {children}
          </div>,
          document.body,
        )}
    </>
  )
}
