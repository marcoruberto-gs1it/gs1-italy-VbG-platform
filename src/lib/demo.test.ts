import { describe, expect, it } from 'vitest'
import { demoData, demoEvents, scaleDemo } from './demo'

const none = { q: '', symbology: '', compliance: '', vbg_state: '', link_level: '', source: '', licence: '', assoc: '' }

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
    const notices = demoEvents(90, { ...none, assoc: 'any' }, 200, 0)
    expect(notices.rows.length > 0 && notices.rows.every((r) => r.assoc_notices?.length)).toBe(true)
    const declined = demoEvents(90, { ...none, assoc: 'declined' }, 200, 0)
    expect(declined.rows.every((r) => r.assoc_outcome === 'declined')).toBe(true)
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

describe('demoEvents: licenze', () => {
  it('il filtro licenza separa attive e non attive', () => {
    const inactive = demoEvents(90, { ...none, licence: 'inactive' }, 500, 0)
    expect(inactive.total).toBeGreaterThan(0)
    expect(inactive.rows.every((r) => r.vbg_licence_status === 'INACTIVE')).toBe(true)
    const active = demoEvents(90, { ...none, licence: 'active' }, 500, 0)
    expect(active.rows.some((r) => r.vbg_licence_status === 'INACTIVE')).toBe(false)
  })
})

describe('scaleDemo', () => {
  it('moltiplica i conteggi ma non medie e numero di paesi', () => {
    const d = demoData(7)
    const big = scaleDemo(d, 1000)
    expect(big.kpi.letture).toBe(d.kpi.letture * 1000)
    expect(big.kpi.paesi).toBe(d.kpi.paesi)
    expect(big.categorie[0].media_dati).toBe(d.categorie[0].media_dati)
    expect(big.regioni[0].region_code).toBe(d.regioni[0].region_code)
  })
})
