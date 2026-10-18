import { useRef } from 'react'
import { gsap, motionOk, useGSAP } from '../../lib/motion'

/** Numero che conta fino al valore (e da un valore all'altro quando cambiano i filtri). */
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
