/*
 * Avvisi sulle associazioni obbligatorie tra AI (GS1 General Specifications, Release 26.0, §4.13.2):
 * l'app li salva come codici stabili (regola:AI), qui diventano titolo, spiegazione e correzione.
 */
import { t } from '../i18n'

export type NoticeText = { title: string; detail: string; fix: string }

/** Spiegazione di un codice di avviso, es. missing:3922 o variable-measure:01. */
export function describeNotice(code: string): NoticeText {
  const [rule, ai = ''] = code.split(':')
  switch (rule) {
    case 'missing':
      return {
        title: t('AI ({ai}) senza l’AI obbligatorio associato', { ai }),
        detail: t('Secondo le GS1 General Specifications l’AI ({ai}) va usato insieme ad altri AI sullo stesso articolo, ma la scansione non li conteneva.', { ai }),
        fix: t('aggiungere l’AI mancante nello stesso barcode o in un altro barcode dello stesso articolo.'),
      }
    case 'variable-measure':
      return {
        title: t('GTIN a peso variabile (indicatore 9) senza misura'),
        detail: t('Un GTIN con indicatore 9 identifica un prodotto a peso variabile: va insieme alla quantità variabile (30), a una misura commerciale (31nn, 32nn, 35nn, 36nn) o alle dimensioni del rotolo (8001); se è un prodotto su ordinazione, al numero di variante (242).'),
        fix: t('aggiungere la misura (per esempio il peso netto) nello stesso barcode o in un altro barcode dello stesso articolo.'),
      }
    case 'mto-gtin':
      return {
        title: t('Variante su ordinazione (242) senza GTIN con indicatore 9'),
        detail: t('Il numero di variante su ordinazione (242) si usa solo con un GTIN con indicatore 9, che identifica un prodotto su ordinazione.'),
        fix: t('usare il GTIN con indicatore 9 assegnato al prodotto su ordinazione, oppure togliere l’AI (242).'),
      }
    case 'fixed-gtin':
      return {
        title: t('Dati di peso variabile ({ai}) con GTIN di imballo', { ai }),
        detail: t('L’AI ({ai}) riguarda prodotti a peso variabile, ma il GTIN ha indicatore da 1 a 8, che identifica un imballo a quantità fissa (per il peso variabile l’indicatore è 9).', { ai }),
        fix: t('usare un GTIN con indicatore 9 per il prodotto a peso variabile, oppure togliere il dato di peso variabile.'),
      }
    default:
      return { title: code, detail: '', fix: '' }
  }
}
