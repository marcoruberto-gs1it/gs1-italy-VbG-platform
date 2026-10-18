import { useEffect, type RefObject } from 'react'

/**
 * Chiude un elemento aperto (menu, fumetto) con un clic o un tocco fuori dagli elementi indicati,
 * oppure con il tasto Esc.
 */
export function useDismiss(open: boolean, refs: RefObject<HTMLElement | null>[], onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!refs.some((r) => r.current?.contains(e.target as Node))) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
    // refs è un array di oggetti stabili (useRef): non serve tra le dipendenze.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose])
}
