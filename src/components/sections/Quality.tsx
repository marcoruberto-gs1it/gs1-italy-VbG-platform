import { errorRows, explain, translateSyntax, type ErrorRow } from '../../lib/errors'
import { gtinDisplay, num, pct } from '../../lib/format'
import type { DashboardData } from '../../lib/types'
import { ComplianceBar, Empty } from '../charts'
import { InfoPopover, Panel, SectionHeader, StatusPill } from '../ui'

const TONE = { cifra: 'critical', sintassi: 'critical', non_standard: 'warning' } as const
const TAG = { cifra: 'Cifra di controllo', sintassi: 'Sintassi GS1', non_standard: 'Non standard' } as const

type Row = ErrorRow

/** Tabella compatta degli errori: tutto su una riga; il motivo si apre dall'icona. */
function ErrorTable({ rows }: { rows: Row[] }) {
  if (!rows.length) return <Empty text="Nessun errore nel periodo." />
  return (
    <div className="err-table-wrap">
      <table className="err-table">
        <thead>
          <tr>
            <th className="c-company">Azienda</th>
            <th className="c-type">Errore</th>
            <th className="c-reason">Motivo</th>
            <th className="c-symbol">Simbologia</th>
            <th className="c-count num">Scansioni</th>
            <th className="c-info"><span className="visually-hidden">Spiegazione</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ company: c, reason: r }, i) => {
            const e = explain(r)
            return (
              <tr key={`${c.company_prefix}-${r.tipo}-${r.simbologia}-${i}`}>
                <td className="err-company" title={`${c.titolare ?? 'Titolare non disponibile'} · prefisso ${c.company_prefix}`}>
                  <b>{c.titolare ?? 'Titolare non disponibile'}</b> <small>{c.company_prefix}</small>
                </td>
                <td className="err-type"><StatusPill tone={TONE[r.tipo]}>{TAG[r.tipo]}</StatusPill></td>
                <td className="err-reason" title={e.title}>{e.title}</td>
                <td className="err-symbol">{r.simbologia ?? '–'}</td>
                <td className="num err-count" title={`${num(r.letture)} su ${num(c.letture)} scansioni dell’azienda (${pct(r.letture, c.letture)})`}>{num(r.letture)}</td>
                <td className="err-info">
                  <InfoPopover label={`Perché è un errore: ${e.title}${r.simbologia ? `, ${r.simbologia}` : ''}`}>
                    <b className="info-title">{e.title}</b>
                    <span className="info-text">{e.detail}</span>
                    {e.original && <code className="info-code">{e.original}</code>}
                    <span className="info-text"><b>Come correggere:</b> {e.fix}</span>
                    <span className="info-muted">
                      {c.titolare ?? 'Titolare non disponibile'} · {num(r.letture)} su {num(c.letture)} scansioni
                      {r.esempio && <> · esempio <code>{gtinDisplay(r.esempio)}</code></>}
                    </span>
                  </InfoPopover>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Errori di sintassi più frequenti, tradotti, con il dettaglio dall'icona. */
function SyntaxTable({ rows }: { rows: DashboardData['errori_sintassi'] }) {
  if (!rows.length) return <Empty text="Nessun errore di sintassi nel periodo." />
  return (
    <div className="err-table-wrap">
      <table className="err-table is-syntax">
        <thead>
          <tr>
            <th className="c-reason">Errore</th>
            <th className="c-count num">Scansioni</th>
            <th className="c-info"><span className="visually-hidden">Spiegazione</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => {
            const text = translateSyntax(x.errore) ?? 'Dati non conformi alle regole GS1'
            return (
              <tr key={x.errore}>
                <td className="err-reason" title={text}>{text}</td>
                <td className="num err-count">{num(x.letture)}</td>
                <td className="err-info">
                  <InfoPopover label={`Perché è un errore: ${text}`}>
                    <b className="info-title">Dati non conformi alle regole GS1</b>
                    <span className="info-text">La verifica dei dati GS1 (GS1 Barcode Syntax Engine) ha trovato un valore che non rispetta le regole degli Application Identifier (AI). {translateSyntax(x.errore) ?? ''}</span>
                    <code className="info-code">{x.errore}</code>
                    <span className="info-text"><b>Come correggere:</b> correggere i dati nel software che genera il codice, secondo le regole dell’AI indicato.</span>
                  </InfoPopover>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Qualità dei codici: conformità, errori di sintassi, aziende con errori. */
export function Quality({ data }: { data: DashboardData }) {
  return (
    <section className="section">
      <SectionHeader id="qualita" title="Qualità dei codici" />
      <div className="grid g-two">
        <Panel title="Conformità agli standard GS1">
          <ComplianceBar data={data.conformita} />
        </Panel>
        <Panel title="Errori di sintassi più frequenti" subtitle="Clicca l’icona per la spiegazione.">
          <SyntaxTable rows={data.errori_sintassi} />
        </Panel>
      </div>
      <Panel title="Aziende con errori nei codici" subtitle="Una riga per ogni motivo di errore. Clicca l’icona per il motivo e la correzione.">
        <ErrorTable rows={errorRows(data.qualita)} />
      </Panel>
    </section>
  )
}
