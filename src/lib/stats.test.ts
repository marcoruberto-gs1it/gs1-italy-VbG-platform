import { describe, expect, it } from 'vitest'
import { mapClass, mapLegend, niceScale, pieSlice, prevShare, share } from './stats'

describe('quote', () => {
  it('share e prevShare gestiscono il totale zero', () => {
    expect(share(1, 4)).toBe(0.25)
    expect(share(1, 0)).toBe(0)
    expect(prevShare(1, 0)).toBeNull()
    expect(prevShare(undefined, 10)).toBeNull()
    expect(prevShare(5, 10)).toBe(0.5)
  })
})

describe('niceScale', () => {
  it('produce tacche tonde che coprono il massimo', () => {
    expect(niceScale(27)).toEqual({ max: 30, ticks: [0, 10, 20, 30] })
    expect(niceScale(0).max).toBeGreaterThan(0)
    const { max, ticks } = niceScale(1234)
    expect(max).toBeGreaterThanOrEqual(1234)
    expect(ticks[0]).toBe(0)
  })
})

describe('mapClass', () => {
  it('quota 2D su scala fissa a passi di 10 punti', () => {
    expect(mapClass('quota', 0.05, 1)).toBe(0)
    expect(mapClass('quota', 0.481, 1)).toBe(4)
    expect(mapClass('quota', 2 / 12, 1)).toBe(1)
    expect(mapClass('quota', 0.9, 1)).toBe(5)
  })
  it('scansioni in sei classi fino al massimo', () => {
    expect(mapClass('letture', 27, 27)).toBe(5)
    expect(mapClass('letture', 12, 27)).toBe(2)
    expect(mapClass('letture', 0, 27)).toBe(0)
  })
  it('le due misure danno colori diversi sui dati reali (Lombardia 27/13, Piemonte 12/2)', () => {
    expect([mapClass('letture', 27, 27), mapClass('letture', 12, 27)]).not.toEqual([mapClass('quota', 13 / 27, 1), mapClass('quota', 2 / 12, 1)])
  })
  it('legenda della quota', () => {
    expect(mapLegend('quota', 1, String)).toEqual(['0–10%', '10–20%', '20–30%', '30–40%', '40–50%', 'oltre 50%'])
  })
})

describe('pieSlice', () => {
  it('usa l’arco grande oltre metà', () => {
    expect(pieSlice(0.25, 20, 22)).toContain(' 0 0 1 ')
    expect(pieSlice(0.75, 20, 22)).toContain(' 0 1 1 ')
  })
})
