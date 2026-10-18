import { describe, expect, it } from 'vitest'
import { glyphFor, isGs1Symbology } from './symbology'

describe('isGs1Symbology (GS1 General Specifications §5.1.1)', () => {
  it.each(['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E', 'ITF-14', 'GS1-128', 'GS1 DataBar', 'GS1 DataBar Expanded', 'GS1 DataMatrix', 'QR Code Standard GS1', 'Data Matrix con GS1 Digital Link', 'GS1 DotCode'])(
    '%s è uno standard GS1',
    (s) => expect(isGs1Symbology(s)).toBe(true),
  )
  it.each(['ITF', 'Code 128', 'Code 39', 'Codabar', 'QR Code', 'Data Matrix', 'GS1 Aztec', 'Aztec', 'PDF417', 'Codice con link', 'Codice con dati GS1', 'Inserito a mano'])(
    '%s non è uno standard GS1',
    (s) => expect(isGs1Symbology(s)).toBe(false),
  )
})

describe('glyphFor', () => {
  it('sceglie il disegno giusto', () => {
    expect(glyphFor('QR Code Standard GS1')).toBe('qr')
    expect(glyphFor('Data Matrix con GS1 Digital Link')).toBe('datamatrix')
    expect(glyphFor('Inserito a mano')).toBe('keyboard')
    expect(glyphFor('Codice con link')).toBe('link')
    expect(glyphFor('ITF-14')).toBe('gs1128')
    expect(glyphFor('EAN-13')).toBe('ean')
  })
})
