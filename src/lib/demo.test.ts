import { describe, expect, it } from 'vitest'
import { demoEvents } from './demo'

const none = { q: '', symbology: '', compliance: '', vbg_state: '', link_level: '', source: '' }

describe('demoEvents', () => {
  it('pagina e conta le righe', () => {
    const page = demoEvents(90, none, 25, 0)
    expect(page.rows).toHaveLength(25)
    expect(page.total).toBeGreaterThan(25)
  })
  it('applica i filtri come il database', () => {
    const errors = demoEvents(90, { ...none, compliance: 'error' }, 200, 0)
    expect(errors.rows.every((r) => r.compliance === 'error')).toBe(true)
    const noLink = demoEvents(90, { ...none, link_level: 'none' }, 200, 0)
    expect(noLink.rows.every((r) => r.link_domain == null)).toBe(true)
    const search = demoEvents(90, { ...none, q: '8076802085738' }, 200, 0)
    expect(search.rows.every((r) => r.primary_key?.includes('8076802085738'))).toBe(true)
  })
  it('i GTIN dimostrativi hanno la cifra di controllo corretta', () => {
    const check = (k: string) => {
      const digits = k.slice(0, 13).split('').reverse().map(Number)
      const sum = digits.reduce((a, d, i) => a + d * (i % 2 === 0 ? 3 : 1), 0)
      return (10 - (sum % 10)) % 10 === Number(k[13])
    }
    const keys = new Set(demoEvents(90, none, 500, 0).rows.filter((r) => r.vbg_state === 'verified').map((r) => r.primary_key!))
    expect([...keys].every(check)).toBe(true)
  })
})
