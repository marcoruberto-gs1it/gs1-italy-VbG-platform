import { describe, expect, it } from 'vitest'
import { isLicenceInactive, licenceLabel } from './licence'

describe('isLicenceInactive', () => {
  it('attiva quando gli stati mancano o sono attivi', () => {
    expect(isLicenceInactive(null, null)).toBe(false)
    expect(isLicenceInactive(undefined, 'OK')).toBe(false)
    expect(isLicenceInactive('active', 'ok')).toBe(false)
  })
  it('non attiva quando licenza o scheda lo indicano', () => {
    expect(isLicenceInactive('INACTIVE', 'OK')).toBe(true)
    expect(isLicenceInactive('LAPSED', null)).toBe(true)
    expect(isLicenceInactive(null, 'INACTIVE')).toBe(true)
  })
  it('etichetta leggibile', () => {
    expect(licenceLabel('INACTIVE', null)).toBe('Licenza non attiva')
    expect(licenceLabel(null, 'LAPSED')).toBe('Scheda scaduta')
    expect(licenceLabel('SOMETHING', null)).toBe('Licenza something')
    expect(licenceLabel(null, null)).toBe('Attiva')
  })
})
