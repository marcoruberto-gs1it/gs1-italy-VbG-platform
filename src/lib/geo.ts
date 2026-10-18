/* Geometria delle mappe. */

type Box = { x0: number; y0: number; x1: number; y1: number }

function boxOf(part: string): Box | null {
  const n = (part.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
  if (n.length < 2) return null
  const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }
  for (let i = 0; i + 1 < n.length; i += 2) {
    b.x0 = Math.min(b.x0, n[i]); b.x1 = Math.max(b.x1, n[i])
    b.y0 = Math.min(b.y0, n[i + 1]); b.y1 = Math.max(b.y1, n[i + 1])
  }
  return b
}

/**
 * Inquadratura di un paese (percorso SVG con coordinate assolute), con un margine.
 * Si inquadra la parte più grande: per la Francia la Francia europea, non la Guyana.
 */
export function shapeViewBox(d: string, pad = 0.18, min = 36) {
  const boxes = d.split(/(?=M)/).map(boxOf).filter((b): b is Box => b !== null)
  if (!boxes.length) return undefined
  const b = boxes.reduce((best, x) => ((x.x1 - x.x0) * (x.y1 - x.y0) > (best.x1 - best.x0) * (best.y1 - best.y0) ? x : best))
  const w = Math.max(min, b.x1 - b.x0)
  const h = Math.max(min * 0.6, b.y1 - b.y0)
  const cx = (b.x0 + b.x1) / 2
  const cy = (b.y0 + b.y1) / 2
  const pw = w * (1 + pad * 2)
  const ph = h * (1 + pad * 2)
  return `${(cx - pw / 2).toFixed(1)} ${(cy - ph / 2).toFixed(1)} ${pw.toFixed(1)} ${ph.toFixed(1)}`
}
