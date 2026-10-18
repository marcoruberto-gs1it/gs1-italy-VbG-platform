import { useEffect, useState } from 'react'
import { SECTIONS, type SectionId } from '../lib/config'

/**
 * Sezione attiva nel menu, aggiornata durante lo scorrimento: è l'ultima sezione il cui inizio ha
 * superato il 30% dell'altezza dello schermo; in fondo alla pagina è sempre l'ultima.
 */
export function useActiveSection(ready: boolean): SectionId {
  const [active, setActive] = useState<SectionId>(SECTIONS[0].id)
  useEffect(() => {
    if (!ready) return
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * 0.3
      let current: SectionId = SECTIONS[0].id
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= line) current = s.id
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = SECTIONS[SECTIONS.length - 1].id
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
  }, [ready])
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
