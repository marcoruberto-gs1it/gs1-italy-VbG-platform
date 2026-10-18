import { useEffect, useState } from 'react'
import type { SectionId } from '../lib/config'

/**
 * Sezione attiva nel menu, aggiornata durante lo scorrimento: è l'ultima sezione il cui inizio ha
 * superato il 30% dell'altezza dello schermo; in fondo alla pagina è sempre l'ultima.
 */
export function useActiveSection(ready: boolean, order: SectionId[]): SectionId {
  const [active, setActive] = useState<SectionId>(order[0])
  useEffect(() => {
    if (!ready) return
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * 0.3
      let current: SectionId = order[0]
      for (const id of order) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = order[order.length - 1]
      setActive(current)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
    }
    // order cambia solo con la vista: la chiave testuale evita di ricreare l'ascolto a ogni render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, order.join()])
  return active
}

/** Nel menu orizzontale (telefono) la voce attiva resta sempre visibile, centrata. */
export function useKeepActiveVisible(active: string, navSelector: string) {
  useEffect(() => {
    const chip = document.querySelector<HTMLElement>(`${navSelector} a[href="#${active}"]`)
    const bar = chip?.parentElement
    if (!chip || !bar || bar.scrollWidth <= bar.clientWidth) return
    const offset = chip.getBoundingClientRect().left - bar.getBoundingClientRect().left
    bar.scrollTo({ left: bar.scrollLeft + offset - (bar.clientWidth - chip.clientWidth) / 2, behavior: 'smooth' })
  }, [active, navSelector])
}
