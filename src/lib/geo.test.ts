import { describe, expect, it } from 'vitest'
import { shapeViewBox } from './geo'
import world from './world-countries.json'

describe('shapeViewBox', () => {
  it('inquadra un paese con un margine', () => {
    expect(shapeViewBox('M10,10L110,10L110,60L10,60Z', 0)).toBe('10.0 10.0 100.0 50.0')
  })
  it('i paesi piccoli hanno una dimensione minima', () => {
    const [, , w] = shapeViewBox('M100,100L101,101Z', 0)!.split(' ').map(Number)
    expect(w).toBe(36)
  })
  it('inquadra la parte più grande del paese', () => {
    const fr = world.countries.find((c) => c.code === 'FR')!
    const [x, , w] = shapeViewBox(fr.d)!.split(' ').map(Number)
    expect(w).toBeLessThan(world.width * 0.15)
    expect(x).toBeGreaterThan(world.width * 0.4)
  })
  it('l’Italia nella mappa del mondo è in Europa', () => {
    const it = world.countries.find((c) => c.code === 'IT')!
    const [x, y] = shapeViewBox(it.d)!.split(' ').map(Number)
    expect(x).toBeGreaterThan(world.width * 0.4)
    expect(y).toBeLessThan(world.height * 0.4)
  })
})
