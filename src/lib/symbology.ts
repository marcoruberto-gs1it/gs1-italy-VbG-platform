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

/** La simbologia appartiene agli standard GS1? (Un QR Code o un link senza dati GS1 no.) */
export function isGs1Symbology(symbology: string): boolean {
  if (/a mano|Codice con/i.test(symbology)) return false
  return /GS1|EAN|UPC|ITF-14/i.test(symbology)
}
