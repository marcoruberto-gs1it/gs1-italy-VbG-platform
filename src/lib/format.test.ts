import { describe, expect, it } from 'vitest'
import { fillDays } from './days'
import { flag, gtinDisplay, num, numShort, pct, regionName } from './format'
import { countryRanking, regionRanking } from './regions'

describe('formati', () => {
  it('numeri e percentuali in italiano', () => {
    expect(num(11445)).toBe('11.445')
    expect(num(null)).toBe('–')
    expect(pct(1, 3)).toBe('33,3%')
    expect(pct(1, 0)).toBe('–')
  })
  it('numeri brevi per gli spazi stretti', () => {
    expect(numShort(99_999)).toBe('99.999')
    expect(numShort(123_456)).toMatch(/^123,5\s?mila$/)
    expect(numShort(2_400_000)).toMatch(/^2,4\s?Mln$/)
    expect(flag('IT')).toBe('🇮🇹')
    expect(flag(null)).toBe('')
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
  it('classifica dei paesi con il nome in italiano', () => {
    const rows = countryRanking([{ country: 'DE', letture: 5, letture_2d: 1, conformi: 5 }, { country: 'IT', letture: 9, letture_2d: 2, conformi: 9 }], 'letture')
    expect(rows[0].label).toContain('Italia')
    expect(rows[1].label).toContain('Germania')
  })
})
