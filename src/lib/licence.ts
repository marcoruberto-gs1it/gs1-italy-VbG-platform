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
const STATE_IT: Record<string, string> = {
  INACTIVE: 'non attiva', LAPSED: 'scaduta', EXPIRED: 'scaduta', SUSPENDED: 'sospesa', TERMINATED: 'cessata',
  WITHDRAWN: 'ritirata', DISCONTINUED: 'ritirata', CANCELLED: 'annullata', TRANSFERRED: 'trasferita',
}
const it = (state: string) => STATE_IT[state.toUpperCase()] ?? state.toLowerCase()

/** Spiegazione breve dello stato, per tabelle e dettaglio. */
export function licenceLabel(licence: string | null | undefined, record: string | null | undefined) {
  if (licence != null && !ACTIVE_LICENCE.has(licence.toUpperCase())) return `Licenza ${it(licence)}`
  if (record != null && !ACTIVE_RECORD.has(record.toUpperCase())) return `Scheda ${it(record)}`
  return 'Attiva'
}
