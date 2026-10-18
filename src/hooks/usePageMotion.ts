import type { RefObject } from 'react'
import { gsap, motionOk, useGSAP } from '../lib/motion'

/**
 * Movimento della pagina: ingresso di barra laterale, intestazione e indicatori; onde GS1 in loop;
 * comparsa delle sezioni quando entrano nello schermo.
 */
export function usePageMotion(root: RefObject<HTMLElement | null>, ready: boolean) {
  useGSAP(
    () => {
      if (!motionOk()) return
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.side-item', { x: -14, opacity: 0, duration: 0.45, stagger: 0.05, clearProps: 'transform,opacity' })
        .from('.hero', { y: 24, opacity: 0, duration: 0.7, clearProps: 'transform,opacity' }, 0.1)
        .from('.hero-copy > *', { y: 16, opacity: 0, duration: 0.5, stagger: 0.08, clearProps: 'transform,opacity' }, 0.3)
        .from('.ga-core', { scale: 0.5, opacity: 0, transformOrigin: '50% 50%', duration: 0.8, ease: 'back.out(1.8)' }, 0.35)
        .from('.kpi', { y: 22, opacity: 0, duration: 0.55, stagger: 0.07, clearProps: 'transform,opacity' }, 0.45)
      gsap.to('.ga-wave', { attr: { r: 128 }, strokeOpacity: 0, duration: 3.2, ease: 'sine.out', stagger: { each: 0.8, repeat: -1 } })
      gsap.fromTo('.ga-scanline', { y: -16 }, { y: 16, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 })

      // Comparsa allo scorrimento: si anima solo ciò che entra davvero sullo schermo (con un salto lungo
      // non si accoda tutto ciò che è stato saltato). A fine animazione si tolgono le trasformazioni,
      // così le card non creano livelli che coprono menu e fumetti.
      const reveal = gsap.utils.toArray<HTMLElement>('.reveal')
      gsap.set(reveal, { opacity: 0, y: 26 })
      const io = new IntersectionObserver(
        (entries) => {
          const shown = entries.filter((e) => e.isIntersecting).map((e) => e.target)
          if (!shown.length) return
          shown.forEach((el) => io.unobserve(el))
          gsap.to(shown, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.08, clearProps: 'transform,opacity' })
        },
        { rootMargin: '0px 0px -8% 0px' },
      )
      reveal.forEach((el) => io.observe(el))
      return () => io.disconnect()
    },
    // revertOnUpdate: quando arrivano i dati si riparte da zero, senza ereditare stati a metà animazione.
    { scope: root, dependencies: [ready], revertOnUpdate: true },
  )
}
