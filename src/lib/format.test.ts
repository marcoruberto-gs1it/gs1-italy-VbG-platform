import { describe, expect, it } from 'vitest'
import { fillDays } from './days'
import { gtinDisplay, num, pct, regionName } from './format'
import { regionRanking } from './regions'

describe('formati', () => {
  it('numeri e percentuali in italiano', () => {
    expect(num(11445)).toBe('11.445')
    expect(num(null)).toBe('–')
    expect(pct(1, 3)).toBe('33,3%')
    expect(pct(1, 0)).toBe('–')
  })
  it('GTIN senza lo zero iniziale', () => {
    expect(gtinDisplay('08076802085738')).toBe('8076802085738')
    expect(gtinDisplay('18076802085735')).toBe('18076802085735')
  })
  it('nomi delle regioni', () => {
    expect(regionName('IT', '25', 'Lombardy')).toBe('Lombardia')
    expect(regionName('FR', 'IDF', 'Île-de-France')).toContain('Francia')
  })
})

describe('fillDays', () => {
  it('un elemento per giorno, anche senza scansioni', () => {
    const days = fillDays([], 7)
    expect(days).toHaveLength(7)
    expect(days.every((d) => d.letture_1d === 0)).toBe(true)
  })
})

describe('regionRanking', () => {
  const regions = [
    { country: 'IT', region_code: '25', region: 'Lombardy', letture: 27, letture_2d: 13, conformi: 17 },
    { country: 'IT', region_code: '21', region: 'Piedmont', letture: 12, letture_2d: 2, conformi: 8 },
  ]
  it('per quota 2D ordina per percentuale', () => {
    const rows = regionRanking(regions, 'quota')
    expect(rows[0].label).toBe('Lombardia')
    expect(rows[0].value).toBeCloseTo(13 / 27)
    expect(rows[1].note).toBe('2 su 12')
  })
})
