/* Etichette in italiano dei valori di scan_events, con il tono di stato da mostrare. */
import { gtinDisplay } from './format'
import type { ScanEvent } from './types'

export type Tone = 'good' | 'warning' | 'critical' | 'neutral'
export type LabelMap = Record<string, readonly [string, Tone]>

export const COMPLIANCE_LABELS: LabelMap = {
  gs1: ['Standard GS1', 'good'],
  partial: ['Non standard', 'warning'],
  error: ['Con errori', 'critical'],
  none: ['Non GS1', 'neutral'],
  manual: ['A mano', 'neutral'],
}
export const VBG_LABELS: LabelMap = {
  verified: ['Verificato', 'good'],
  licensed: ['Solo licenza', 'warning'],
  invalid: ['Non valido', 'critical'],
  error: ['Non riuscita', 'neutral'],
  none: ['Non verificato', 'neutral'],
}
export const LINK_LABELS: LabelMap = {
  trusted: ['Dominio del titolare', 'good'],
  unknown: ['Non riconosciuto', 'warning'],
  danger: ['Sospetto', 'critical'],
  pending: ['In verifica', 'neutral'],
  none: ['Senza link', 'neutral'],
}
export const LICENCE_LABELS: LabelMap = {
  inactive: ['Licenza non attiva', 'critical'],
  active: ['Licenza attiva', 'good'],
}

export const SOURCE_LABELS: Record<ScanEvent['source'], string> = { camera: 'Fotocamera', image: 'Da foto', manual: 'Inserito a mano' }

/** Etichetta e tono di un valore (null = "none"); i valori sconosciuti restano leggibili. */
export function labelFor(map: LabelMap, value: string | null): readonly [string, Tone] {
  return map[value ?? 'none'] ?? [value ?? '–', 'neutral']
}

/** Cosa mostrare come prodotto: categoria, oppure il motivo per cui manca. */
export const productLabel = (e: ScanEvent) =>
  e.gpc_brick_name ?? (e.vbg_state === 'invalid' ? 'Numero non assegnato' : e.licensee_name ? 'Scheda non pubblicata' : null)

/** Chiave del codice come si legge sulla confezione (GTIN senza lo zero iniziale). */
export const keyLabel = (e: ScanEvent) => (e.primary_key ? (e.primary_ai === '01' ? gtinDisplay(e.primary_key) : e.primary_key) : null)
