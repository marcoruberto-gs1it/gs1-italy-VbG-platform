import { t } from '../i18n'
/*
 * Licenza GS1 scaduta o non attiva: lo stato della licenza o della scheda riportato da Verified by GS1
 * è diverso da "attivo". Stessa regola della funzione licence_inactive nel database.
 */
const ACTIVE_LICENCE = new Set(['ACTIVE', 'VALID', 'OK'])
const ACTIVE_RECORD = new Set(['OK', 'ACTIVE'])

export function isLicenceInactive(licence: string | null | undefined, record: string | null | undefined) {
  return (licence != null && !ACTIVE_LICENCE.has(licence.toUpperCase())) || (record != null && !ACTIVE_RECORD.has(record.toUpperCase()))
}

/** Stati di Verified by GS1 in italiano; quelli sconosciuti restano come arrivano. */
/** Segna un testo da tradurre senza tradurlo subito. */
const k = (s: string) => s
const STATE_IT: Record<string, string> = {
  INACTIVE: k('non attiva'), LAPSED: k('scaduta'), EXPIRED: k('scaduta'), SUSPENDED: k('sospesa'), TERMINATED: k('cessata'),
  WITHDRAWN: k('ritirata'), DISCONTINUED: k('ritirata'), CANCELLED: k('annullata'), TRANSFERRED: k('trasferita'),
}
const it = (state: string) => t(STATE_IT[state.toUpperCase()] ?? state.toLowerCase())

/** Spiegazione breve dello stato, per tabelle e dettaglio. */
export function licenceLabel(licence: string | null | undefined, record: string | null | undefined) {
  if (licence != null && !ACTIVE_LICENCE.has(licence.toUpperCase())) return t('Licenza {state}', { state: it(licence) })
  if (record != null && !ACTIVE_RECORD.has(record.toUpperCase())) return t('Scheda {state}', { state: it(record) })
  return t('Attiva')
}
