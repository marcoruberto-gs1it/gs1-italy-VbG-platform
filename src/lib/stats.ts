import { dec1 } from './format'
/* Calcoli sui numeri della dashboard, senza dipendenze dall'interfaccia. */

/** Quota tra 0 e 1; 0 se il totale è zero. */
export const share = (part: number, total: number) => (total ? part / total : 0)

/** Quota del periodo precedente solo se c'era una base su cui calcolarla (altrimenti nessun confronto). */
export const prevShare = (part: number | undefined, total: number | undefined) => (part != null && total ? part / total : null)

/** Percentuale già moltiplicata per 100, con un decimale (es. 22,3%). */
export const pctNum = (n: number) => `${dec1(n)}%`

/** Scala con tacche tonde (1, 2, 5 × 10ⁿ), circa quattro intervalli, solo numeri interi. */
export function niceScale(v: number) {
  const raw = Math.max(1, v) / 4
  const p = 10 ** Math.floor(Math.log10(raw))
  const n = raw / p
  const step = Math.max(1, (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p)
  const max = Math.max(step, Math.ceil(v / step) * step)
  return { max, ticks: Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step) }
}

/** Rettangolo SVG con angoli arrotondati solo all'estremità dei dati (in alto). */
export function topRounded(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0 || w <= 0) return ''
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`
}

/** Spicchio di torta (da ore 12, in senso orario) per una quota tra 0 e 1, in un cerchio di raggio r centrato in (c, c). */
export function pieSlice(value: number, r: number, c: number) {
  const angle = Math.min(Math.max(value, 0), 0.9999) * 2 * Math.PI
  const x = c + r * Math.sin(angle)
  const y = c - r * Math.cos(angle)
  return `M${c} ${c} L${c} ${c - r} A${r} ${r} 0 ${angle > Math.PI ? 1 : 0} 1 ${x} ${y} Z`
}

/**
 * Curva morbida che passa per tutti i punti (spline di Catmull-Rom convertita in curve di Bézier),
 * con le maniglie limitate in verticale per non superare i valori reali.
 */
export function smoothPath(points: [number, number][]) {
  if (!points.length) return ''
  const f = (n: number) => n.toFixed(2)
  let d = `M${f(points[0][0])} ${f(points[0][1])}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const lo = Math.min(p1[1], p2[1])
    const hi = Math.max(p1[1], p2[1])
    const c1y = Math.min(hi, Math.max(lo, p1[1] + (p2[1] - p0[1]) / 6))
    const c2y = Math.min(hi, Math.max(lo, p2[1] - (p3[1] - p1[1]) / 6))
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(c1y)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`
  }
  return d
}

/* ───── Mappa: classi di colore ───── */

export const MAP_CLASSES = 6
export type MapMetric = 'letture' | 'quota'

/**
 * Classe di colore (0…5) di un valore sulla mappa.
 * Scansioni: sei classi uguali fino al massimo del periodo. Quota 2D: scala fissa a passi di 10 punti
 * (0–10% … oltre 50%), così un colore indica sempre la stessa percentuale.
 */
export function mapClass(metric: MapMetric, value: number, max: number) {
  const raw = metric === 'quota' ? Math.floor(value * 10 + 1e-9) : Math.floor((value / Math.max(1, max)) * MAP_CLASSES)
  return Math.min(MAP_CLASSES - 1, Math.max(0, raw))
}

/** Etichette della legenda, una per classe. */
export function mapLegend(metric: MapMetric, max: number, format: (n: number) => string) {
  return Array.from({ length: MAP_CLASSES }, (_, i) =>
    metric === 'quota'
      ? i === MAP_CLASSES - 1 ? 'oltre 50%' : `${i * 10}–${(i + 1) * 10}%`
      : `${format((max * i) / MAP_CLASSES)}–${format((max * (i + 1)) / MAP_CLASSES)}`,
  )
}
