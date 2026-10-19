import { errorRows, explain, translateSyntax, type ErrorRow } from '../../lib/errors'
import { gtinDisplay, num, pct } from '../../lib/format'
import type { DashboardData } from '../../lib/types'
import { ComplianceBar, Empty } from '../charts'
import { InfoPopover, Panel, SectionHeader, StatusPill } from '../ui'
import { t } from '../../i18n'
import { symbologyName } from '../../lib/symbology'

const TONE = { cifra: 'critical', sintassi: 'critical', non_standard: 'warning' } as const
const TAG = {
  get cifra() { return t('Cifra di controllo') },
  get sintassi() { return t('Sintassi GS1') },
  get non_standard() { return t('Non standard') },
}

type Row = ErrorRow

/** Tabella compatta degli errori: tutto su una riga; il motivo si apre dall'icona. */
function ErrorTable({ rows }: { rows: Row[] }) {
  if (!rows.length) return <Empty text={t('Nessun errore nel periodo.')} />
  return (
    <div className="err-table-wrap">
      <table className="err-table">
        <thead>
          <tr>
            <th className="c-company">{t('Azienda')}</th>
            <th className="c-type">{t('Errore')}</th>
            <th className="c-reason">{t('Motivo')}</th>
            <th className="c-symbol">{t('Simbologia')}</th>
            <th className="c-count num">{t('Scansioni')}</th>
            <th className="c-info"><span className="visually-hidden">{t('Spiegazione')}</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ company: c, reason: r }, i) => {
            const e = explain(r)
            return (
              <tr key={`${c.company_prefix}-${r.tipo}-${r.simbologia}-${i}`}>
                <td className="err-company" title={t('{owner} · prefisso {prefix}', { owner: c.titolare ?? t('Titolare non disponibile'), prefix: c.company_prefix })}>
                  <b>{c.titolare ?? t('Titolare non disponibile')}</b> <small>{c.company_prefix}</small>
                </td>
                <td className="err-type"><StatusPill tone={TONE[r.tipo]}>{TAG[r.tipo]}</StatusPill></td>
                <td className="err-reason" title={e.title}>{e.title}</td>
                <td className="err-symbol">{symbologyName(r.simbologia)}</td>
                <td data-unit={t('scansioni')} className="num err-count" title={t('{a} su {b} scansioni dell’azienda ({pct})', { a: num(r.letture), b: num(c.letture), pct: pct(r.letture, c.letture) })}>{num(r.letture)}</td>
                <td className="err-info">
                  <InfoPopover label={t('Perché è un errore: {reason}', { reason: `${e.title}${r.simbologia ? `, ${symbologyName(r.simbologia)}` : ''}` })}>
                    <b className="info-title">{e.title}</b>
                    <span className="info-text">{e.detail}</span>
                    {e.original && <code className="info-code">{e.original}</code>}
                    <span className="info-text"><b>{t('Come correggere:')}</b> {e.fix}</span>
                    <span className="info-muted">
                      {c.titolare ?? t('Titolare non disponibile')} · {t('{a} su {b} scansioni', { a: num(r.letture), b: num(c.letture) })}
                      {r.esempio && <> {t('· esempio')} <code>{gtinDisplay(r.esempio)}</code></>}
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
  if (!rows.length) return <Empty text={t('Nessun errore di sintassi nel periodo.')} />
  return (
    <div className="err-table-wrap">
      <table className="err-table is-syntax">
        <thead>
          <tr>
            <th className="c-reason">{t('Errore')}</th>
            <th className="c-count num">{t('Scansioni')}</th>
            <th className="c-info"><span className="visually-hidden">{t('Spiegazione')}</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => {
            const text = translateSyntax(x.errore) ?? t('Dati non conformi alle regole GS1')
            return (
              <tr key={x.errore}>
                <td className="err-reason" title={text}>{text}</td>
                <td data-unit={t('scansioni')} className="num err-count">{num(x.letture)}</td>
                <td className="err-info">
                  <InfoPopover label={t('Perché è un errore: {reason}', { reason: text })}>
                    <b className="info-title">{t('Dati non conformi alle regole GS1')}</b>
                    <span className="info-text">{t('La verifica dei dati GS1 (GS1 Barcode Syntax Engine) ha trovato un valore che non rispetta le regole degli Application Identifier (AI).')} {translateSyntax(x.errore) ?? ''}</span>
                    <code className="info-code">{x.errore}</code>
                    <span className="info-text"><b>{t('Come correggere:')}</b> {t('correggere i dati nel software che genera il codice, secondo le regole dell’AI indicato.')}</span>
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
      <SectionHeader id="qualita" title={t('Qualità dei codici')} />
      <div className="grid g-two">
        <Panel title={t('Conformità agli standard GS1')}>
          <ComplianceBar data={data.conformita} />
        </Panel>
        <Panel title={t('Errori di sintassi più frequenti')} subtitle={t('Clicca l’icona per la spiegazione.')}>
          <SyntaxTable rows={data.errori_sintassi} />
        </Panel>
      </div>
      <Panel title={t('Aziende con errori nei codici')} subtitle={t('Una riga per ogni motivo di errore. Clicca l’icona per il motivo e la correzione.')}>
        <ErrorTable rows={errorRows(data.qualita)} />
      </Panel>
    </section>
  )
}
