import type { RefObject } from 'react'
import { gsap, motionOk, useGSAP } from '../lib/motion'

/** Animazione di un grafico al suo ingresso nello schermo, una sola volta. */
export function useReveal(scope: RefObject<HTMLElement | null>, build: (tl: gsap.core.Timeline) => void, deps: unknown[]) {
  useGSAP(
    () => {
      if (!motionOk() || !scope.current) return
      const tl = gsap.timeline({ scrollTrigger: { trigger: scope.current, start: 'top 88%', once: true } })
      build(tl)
    },
    { scope, dependencies: deps, revertOnUpdate: true },
  )
}
