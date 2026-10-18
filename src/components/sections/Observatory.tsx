import { useState } from 'react'
import { Check, Copy, Download } from 'lucide-react'
import type { Period } from '../../lib/config'
import { download, toCsv } from '../../lib/csv'
import { regionName } from '../../lib/format'
import { keyFacts, sourceLine } from '../../lib/observatory'
import type { DashboardData } from '../../lib/types'
import { Empty } from '../charts'
import { Panel, SectionHeader } from '../ui'

/** Copia negli appunti con conferma visiva. */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setDone(true)
      setTimeout(() => setDone(false), 1600)
    } catch {
      window.prompt('Copia il testo:', text)
    }
  }
  return (
    <button className={`chip-btn ${done ? 'is-done' : ''}`} type="button" onClick={() => void copy()} aria-label={label}>
      {done ? <><Check size={14} /> Copiato</> : <><Copy size={14} /> Copia</>}
    </button>
  )
}

/** Osservatorio: numeri pronti da citare, dati scaricabili e metodo. */
export function Observatory({ data, period, days }: { data: DashboardData; period: Period; days: number }) {
  const facts = keyFacts(data, period)
  const source = sourceLine(days)
  const stamp = new Date().toISOString().slice(0, 10)
  const exports = [
    { name: 'Andamento giornaliero', file: 'giornaliero', csv: () => toCsv(data.giornaliero, [
      { label: 'Giorno', value: (r) => r.giorno }, { label: 'Barcode 1D', value: (r) => r.letture_1d }, { label: 'Codici 2D', value: (r) => r.letture_2d }, { label: 'Inseriti a mano', value: (r) => r.manuali },
    ]) },
    { name: 'Regioni', file: 'regioni', csv: () => toCsv(data.regioni, [
      { label: 'Regione', value: (r) => regionName(r.country, r.region_code, r.region) }, { label: 'Paese', value: (r) => r.country }, { label: 'Scansioni', value: (r) => r.letture }, { label: 'Codici 2D', value: (r) => r.letture_2d }, { label: 'Conformi GS1', value: (r) => r.conformi },
    ]) },
    { name: 'Simbologie', file: 'simbologie', csv: () => toCsv(data.simbologie, [
      { label: 'Simbologia', value: (r) => r.simbologia }, { label: 'Scansioni', value: (r) => r.letture },
    ]) },
    { name: 'Categorie GPC', file: 'categorie', csv: () => toCsv(data.categorie, [
      { label: 'Brick GPC', value: (r) => r.gpc_brick }, { label: 'Categoria', value: (r) => r.categoria }, { label: 'Segmento', value: (r) => r.segmento }, { label: 'Scansioni', value: (r) => r.letture }, { label: 'Prodotti', value: (r) => r.gtin_distinti }, { label: 'Schede complete', value: (r) => r.schede_complete },
    ]) },
    { name: 'Brand', file: 'brand', csv: () => toCsv(data.brand ?? [], [
      { label: 'Brand', value: (r) => r.brand }, { label: 'Titolare', value: (r) => r.titolare }, { label: 'Scansioni', value: (r) => r.letture }, { label: 'Prodotti', value: (r) => r.prodotti }, { label: 'Codici 2D', value: (r) => r.letture_2d },
    ]) },
  ]

  return (
    <section className="section">
      <SectionHeader id="osservatorio" title="Osservatorio" />
      <div className="grid g-observatory">
        <Panel title="Numeri chiave da citare" subtitle={source}>
          {facts.length ? (
            <>
              <ul className="facts">
                {facts.map((f) => (
                  <li key={f.id}>
                    <p>{f.text}</p>
                    <CopyButton text={`${f.text} ${source}`} label="Copia la frase con la fonte" />
                  </li>
                ))}
              </ul>
              <div className="facts-all"><CopyButton text={`${facts.map((f) => f.text).join('\n')}\n${source}`} label="Copia tutti i numeri con la fonte" /> <span>tutti i numeri, con la fonte</span></div>
            </>
          ) : (
            <Empty text="Nessuna scansione nel periodo: nessun numero da citare." />
          )}
        </Panel>
        <div className="grid">
          <Panel title="Scarica i dati" subtitle="File CSV con i dati aggregati del periodo (nessun dato personale), pronti per Excel.">
            <ul className="downloads">
              {exports.map((x) => (
                <li key={x.file}>
                  <button className="btn ghost" type="button" onClick={() => download(`osservatorio-vbg-${x.file}-${stamp}.csv`, x.csv())}>
                    <Download size={16} /> {x.name}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Metodo e limiti">
            <ul className="method">
              <li><b>Fonte.</b> Le scansioni fatte con l’app VbG Scan di GS1 Italy: chi la usa, non un campione statistico di tutto il mercato.</li>
              <li><b>Verifiche.</b> Ogni codice è controllato con la GS1 Barcode Syntax Engine e, per i prodotti, su Verified by GS1.</li>
              <li><b>Posizione.</b> Solo la regione, dedotta dalla connessione: con le reti mobili può risultare la sede del gestore.</li>
              <li><b>Privacy.</b> Nessun dato personale: niente indirizzo IP né identificativi, dei link solo il dominio.</li>
              <li><b>Aggiornamento.</b> In tempo reale; i numeri si riferiscono al periodo scelto in alto.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </section>
  )
}
