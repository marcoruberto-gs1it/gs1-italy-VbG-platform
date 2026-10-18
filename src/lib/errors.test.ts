import { describe, expect, it } from 'vitest'
import { errorRows, explain, reasonsFromCounts, translateSyntax } from './errors'

describe('translateSyntax', () => {
  it('traduce i messaggi noti della GS1 Barcode Syntax Engine', () => {
    expect(translateSyntax('AI (17): The date contains an illegal month of the year.')).toBe('AI (17): il mese della data non esiste.')
    expect(translateSyntax('It is invalid to pair AI (01) with AI (02)')).toBe('Gli AI (01) e (02) non possono comparire nello stesso codice.')
    expect(translateSyntax('Required AIs for AI (10) are not satisfied: 01,02')).toContain('L’AI (10) richiede')
  })
  it('restituisce null per i messaggi sconosciuti', () => {
    expect(translateSyntax('Something completely different')).toBeNull()
    expect(translateSyntax('AI (99): unexpected')).toBeNull()
  })
})

describe('explain', () => {
  it('spiega la cifra di controllo errata', () => {
    expect(explain({ tipo: 'cifra', simbologia: 'EAN-13', errore: null, letture: 3, esempio: null }).title).toBe('Cifra di controllo errata')
  })
  it('distingue il simbolo non standard per simbologia', () => {
    const dm = explain({ tipo: 'non_standard', simbologia: 'Data Matrix', errore: null, letture: 1, esempio: null })
    expect(dm.detail).toContain('FNC1')
    const itf = explain({ tipo: 'non_standard', simbologia: 'ITF', errore: null, letture: 1, esempio: null })
    expect(itf.detail).toContain('ITF-14')
  })
  it('mostra il messaggio originale solo se non tradotto', () => {
    expect(explain({ tipo: 'sintassi', simbologia: null, errore: 'Unknown problem', letture: 1, esempio: null }).original).toBe('Unknown problem')
    expect(explain({ tipo: 'sintassi', simbologia: null, errore: 'AI (17): The date contains an illegal day of the month.', letture: 1, esempio: null }).original).toBeUndefined()
  })
})

describe('errorRows', () => {
  const base = { company_prefix: '8012345', titolare: 'Esempio', letture: 100, errori_cifra: 2, errori_sintassi: 0, non_standard: 1, errori: 3 }
  it('usa i motivi del database quando ci sono', () => {
    const rows = errorRows([{ ...base, motivi: [{ tipo: 'sintassi', simbologia: 'GS1-128', errore: 'x', letture: 3, esempio: null }] }])
    expect(rows).toHaveLength(1)
    expect(rows[0].reason.tipo).toBe('sintassi')
  })
  it('ricava i motivi dai conteggi altrimenti', () => {
    expect(reasonsFromCounts(base).map((r) => r.tipo)).toEqual(['cifra', 'non_standard'])
    expect(errorRows([base])).toHaveLength(2)
  })
})
