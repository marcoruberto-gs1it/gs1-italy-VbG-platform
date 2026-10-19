/*
 * Spiegazioni degli errori nei codici letti: cosa non va e come si corregge.
 * I messaggi della GS1 Barcode Syntax Engine arrivano in inglese: in italiano i più comuni vengono
 * tradotti (stesse regole dell'app di scansione), in inglese si mostrano così come sono.
 */
import { lang, t } from '../i18n'
import type { DashboardData, ErrorReason } from './types'

/** Segna un testo da tradurre senza tradurlo subito (la traduzione avviene al momento dell'uso). */
const k = (s: string) => s

const phrases: [RegExp, string][] = [
  [/The date contains an illegal month of the year\.?/i, k('il mese della data non esiste')],
  [/The date contains an illegal day of the month\.?/i, k('il giorno della data non esiste')],
  [/The numeric check digit is incorrect\.?/i, k('la cifra di controllo è errata')],
  [/The (?:data|component) is too short\.?/i, k('il valore è troppo corto')],
  [/The (?:data|component) is too long\.?/i, k('il valore è troppo lungo')],
  [/contains an illegal character\.?/i, k('contiene un carattere non ammesso')],
  [/A non-digit character was found where a digit is expected\.?/i, k('contiene una lettera dove è richiesta una cifra')],
  [/The hour.*illegal/i, k('l’ora non è valida')],
  [/The (?:minute|second).*illegal/i, k('i minuti o i secondi non sono validi')],
  [/is not a valid ISO 3166 .*country code/i, k('il codice paese non è valido')],
  [/is not a valid ISO 4217 .*currency code/i, k('il codice valuta non è valido')],
  [/The GCP .* is (?:too short|invalid)/i, k('il prefisso aziendale GS1 non è valido')],
]

/** Traduce un messaggio della GS1 Barcode Syntax Engine; null se non è tra quelli noti. */
export function translateSyntax(message: string): string | null {
  // In inglese il messaggio originale della GS1 Barcode Syntax Engine è già leggibile.
  if (lang() === 'en') return message
  let m: RegExpMatchArray | null
  if ((m = message.match(/It is invalid to pair AI \((\d+)\) with AI \((\d+)\)/i))) {
    return t('Gli AI ({a}) e ({b}) non possono comparire nello stesso codice.', { a: m[1], b: m[2] })
  }
  if ((m = message.match(/Required AIs for AI \((\d+)\) are not satisfied: ([\d,+ ]+)/i))) {
    return t('L’AI ({ai}) richiede anche uno di questi AI, che nel codice mancano: {list}.', { ai: m[1], list: m[2].split(',').map((s) => s.trim()).join(', ') })
  }
  if ((m = message.match(/^AI \((\d+)\):\s*(.*)$/i))) {
    const phrase = phrases.find(([re]) => re.test(m![2]))
    return phrase ? `AI (${m[1]}): ${t(phrase[1])}.` : null
  }
  const phrase = phrases.find(([re]) => re.test(message))
  const text = phrase && t(phrase[1])
  return text ? text[0].toUpperCase() + text.slice(1) + '.' : null
}

/** Perché i dati GS1 in questa simbologia non sono un codice standard GS1. */
function nonStandardReason(symbology: string | null): string {
  const s = symbology ?? ''
  if (/^Data Matrix$/i.test(s)) {
    return t('I dati sono in formato GS1, ma il simbolo è un Data Matrix generico: manca il carattere FNC1 iniziale che lo rende un GS1 DataMatrix. Molti lettori GS1 non riconoscono i dati.')
  }
  if (/^QR Code$|^Micro QR$|^rMQR$/i.test(s) || /Codice con dati GS1/i.test(s)) {
    return t('I dati sono in formato GS1, ma il QR Code non segue lo standard: manca il carattere FNC1 iniziale e non contiene un GS1 Digital Link. Non è un QR Code Standard GS1.')
  }
  if (/^Code 128$/i.test(s)) {
    return t('I dati sono in formato GS1, ma il simbolo è un Code 128 senza il carattere FNC1 iniziale: non è un GS1-128.')
  }
  if (/^ITF$/i.test(s)) {
    return t('Il codice ITF non contiene esattamente 14 cifre: solo l’ITF-14 fa parte degli standard GS1.')
  }
  if (/Aztec|PDF417|MaxiCode|Code 39|Code 93|Codabar/i.test(s)) {
    return t('I dati sono in formato GS1, ma {symbology} non è una simbologia degli standard GS1.', { symbology: s })
  }
  return t('I dati sono in formato GS1, ma il simbolo non è codificato secondo gli standard GS1.')
}

export type Explained = { title: string; detail: string; fix: string; original?: string }

/** Spiegazione completa di un motivo di errore, per chi deve correggere il codice. */
export function explain(reason: ErrorReason): Explained {
  if (reason.tipo === 'cifra') {
    return {
      title: t('Cifra di controllo errata'),
      detail: t('L’ultima cifra del numero non corrisponde a quella calcolata dalle altre: il codice è stato generato male, oppure è stampato in modo che il lettore lo interpreta in modo sbagliato.'),
      fix: t('Ricalcolare la cifra di controllo nel software che genera il codice e verificare la qualità di stampa.'),
    }
  }
  if (reason.tipo === 'sintassi') {
    const translated = reason.errore ? translateSyntax(reason.errore) : null
    return {
      title: t('Dati non conformi alle regole GS1'),
      detail: translated ?? t('La GS1 Barcode Syntax Engine segnala che i dati non rispettano il GS1 Barcode Syntax Dictionary.'),
      fix: t('Correggere i dati nel software di etichettatura secondo le regole degli Application Identifier (AI) indicati.'),
      original: reason.errore && (!translated || translated === reason.errore) && lang() === 'it' ? reason.errore : undefined,
    }
  }
  return {
    title: t('Simbolo non standard GS1'),
    detail: nonStandardReason(reason.simbologia),
    fix: t('Stampare i dati in una simbologia GS1 (GS1 DataMatrix, QR Code Standard GS1, GS1-128, ITF-14 o EAN/UPC) con le impostazioni GS1 attive.'),
  }
}

/** Motivi ricavati dai soli conteggi, quando il database non restituisce ancora il dettaglio. */
export function reasonsFromCounts(q: { errori_cifra: number; errori_sintassi: number; non_standard: number }): ErrorReason[] {
  const out: ErrorReason[] = []
  if (q.errori_cifra) out.push({ tipo: 'cifra', simbologia: null, errore: null, letture: q.errori_cifra, esempio: null })
  if (q.errori_sintassi) out.push({ tipo: 'sintassi', simbologia: null, errore: null, letture: q.errori_sintassi, esempio: null })
  if (q.non_standard) out.push({ tipo: 'non_standard', simbologia: null, errore: null, letture: q.non_standard, esempio: null })
  return out
}

type Company = DashboardData['qualita'][number]
export type ErrorRow = { company: Company; reason: ErrorReason }

/** Una riga per ogni motivo di errore di ogni azienda (dal database, o ricavata dai conteggi). */
export function errorRows(companies: Company[]): ErrorRow[] {
  return companies.flatMap((company) => (company.motivi?.length ? company.motivi : reasonsFromCounts(company)).map((reason) => ({ company, reason })))
}
