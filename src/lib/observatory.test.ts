import { describe, expect, it } from 'vitest'
import { PERIODS } from './config'
import { toCsv } from './csv'
import { demoData } from './demo'
import { keyFacts, sourceLine } from './observatory'

describe('keyFacts', () => {
  it('genera frasi complete dai dati', () => {
    const facts = keyFacts(demoData(30), PERIODS[1])
    expect(facts.map((f) => f.id)).toEqual(expect.arrayContaining(['scansioni', '2d', 'conformi', 'regione', 'categoria']))
    expect(facts[0].text).toMatch(/^Negli ultimi 30 giorni sono stati scansionati/)
    expect(facts.every((f) => f.text.endsWith('.'))).toBe(true)
  })
  it('nessuna frase senza scansioni', () => {
    const empty = demoData(7)
    expect(keyFacts({ ...empty, kpi: { ...empty.kpi, letture: 0 } }, PERIODS[0])).toEqual([])
  })
  it('la fonte cita GS1 Italy e il periodo', () => {
    expect(sourceLine(30, new Date('2026-10-18T12:00:00Z'))).toContain('GS1 Italy')
  })
})

describe('toCsv', () => {
  it('usa punto e virgola, virgola decimale e virgolette quando servono', () => {
    const csv = toCsv([{ a: 'Salse; sughi', b: 0.5 }], [{ label: 'Nome', value: (r) => r.a }, { label: 'Quota', value: (r) => r.b }])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv).toContain('Nome;Quota')
    expect(csv).toContain('"Salse; sughi";0,5')
  })
})
