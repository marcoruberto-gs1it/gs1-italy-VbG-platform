/* Etichette dei valori di scan_events, con il tono di stato da mostrare (tradotte in labelFor). */
import { t } from '../i18n'
import { gtinDisplay } from './format'

/** Segna un testo da tradurre senza tradurlo subito. */
const k = (s: string) => s
import type { ScanEvent } from './types'

export type Tone = 'good' | 'warning' | 'critical' | 'neutral'
export type LabelMap = Record<string, readonly [string, Tone]>

export const COMPLIANCE_LABELS: LabelMap = {
  gs1: [k('Standard GS1'), 'good'],
  partial: [k('Non standard'), 'warning'],
  error: [k('Con errori'), 'critical'],
  none: [k('Non GS1'), 'neutral'],
  manual: [k('A mano'), 'neutral'],
}
export const VBG_LABELS: LabelMap = {
  verified: [k('Verificato'), 'good'],
  licensed: [k('Solo licenza'), 'warning'],
  invalid: [k('Non valido'), 'critical'],
  error: [k('Non riuscita'), 'neutral'],
  none: [k('Non verificato'), 'neutral'],
}
export const LINK_LABELS: LabelMap = {
  trusted: [k('Dominio del titolare'), 'good'],
  unknown: [k('Non riconosciuto'), 'warning'],
  danger: [k('Sospetto'), 'critical'],
  pending: [k('In verifica'), 'neutral'],
  none: [k('Senza link'), 'neutral'],
}
export const LICENCE_LABELS: LabelMap = {
  inactive: [k('Licenza non attiva'), 'critical'],
  active: [k('Licenza attiva'), 'good'],
}

export const SOURCE_LABELS: Record<ScanEvent['source'], string> = {
  get camera() { return t('Fotocamera') },
  get image() { return t('Da foto') },
  get manual() { return t('Inserito a mano') },
}

/** Etichetta e tono di un valore (null = "none"); i valori sconosciuti restano leggibili. */
export function labelFor(map: LabelMap, value: string | null): readonly [string, Tone] {
  const found = map[value ?? 'none']
  return found ? [t(found[0]), found[1]] : [value ?? '–', 'neutral']
}

/** Cosa mostrare come prodotto: categoria, oppure il motivo per cui manca. */
export const productLabel = (e: ScanEvent) =>
  e.gpc_brick_name ?? (e.vbg_state === 'invalid' ? t('Numero non assegnato') : e.licensee_name ? t('Scheda non pubblicata') : null)

/** Chiave del codice come si legge sulla confezione (GTIN senza lo zero iniziale). */
export const keyLabel = (e: ScanEvent) => (e.primary_key ? (e.primary_ai === '01' ? gtinDisplay(e.primary_key) : e.primary_key) : null)
