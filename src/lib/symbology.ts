import { t } from '../i18n'

export type GlyphKind = 'ean' | 'gs1128' | 'databar' | 'datamatrix' | 'qr' | 'link' | 'keyboard'

/** Glifo da mostrare per il nome di una simbologia. */
export function glyphFor(symbology: string): GlyphKind {
  if (/a mano/i.test(symbology)) return 'keyboard'
  if (/Codice con/i.test(symbology)) return 'link'
  if (/QR/i.test(symbology)) return 'qr'
  if (/Matrix|Aztec|PDF417|MaxiCode/i.test(symbology)) return 'datamatrix'
  if (/DataBar/i.test(symbology)) return 'databar'
  if (/128|39|93|ITF|Codabar/i.test(symbology)) return 'gs1128'
  return 'ean'
}

/**
 * Simbologie degli standard GS1, secondo le GS1 General Specifications (§5.1.1):
 * EAN/UPC (EAN-13, EAN-8, UPC-A, UPC-E, con eventuali add-on), ITF-14, GS1-128, famiglia GS1 DataBar
 * (anche Composite), GS1 DataMatrix, GS1 QR Code, GS1 DotCode, e Data Matrix / QR Code con GS1 Digital Link.
 * Non ne fanno parte: Code 128 senza FNC1, Code 39, Code 93, Codabar, ITF di lunghezza diversa da 14,
 * QR Code e Data Matrix senza dati GS1, Aztec (anche con dati GS1), PDF417, MaxiCode, Micro QR, rMQR.
 * I nomi sono quelli registrati dall'app di scansione.
 */
const GS1_SYMBOLOGIES = /^(EAN-13|EAN-8|UPC-A|UPC-E|ITF-14|GS1-128|GS1 DataBar( .+)?|GS1 Composite( .+)?|GS1 DataMatrix|QR Code Standard GS1|Data Matrix con GS1 Digital Link|GS1 DotCode)$/

export const isGs1Symbology = (symbology: string) => GS1_SYMBOLOGIES.test(symbology)

/** Nome da mostrare: le simbologie vere restano col loro nome; i casi descritti dall'app si traducono. */
export function symbologyName(symbology: string | null): string {
  switch (symbology) {
    case 'Codice con link': return t('Codice con link')
    case 'Codice con dati GS1': return t('Codice con dati GS1')
    case 'Codice con testo': return t('Codice con testo')
    case 'Inserito a mano': return t('Inserito a mano')
    case 'Data Matrix con GS1 Digital Link': return t('Data Matrix con GS1 Digital Link')
    default: return symbology ?? '–'
  }
}
