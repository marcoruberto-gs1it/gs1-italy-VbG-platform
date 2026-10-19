import { Link2 } from 'lucide-react'
import { countryName, dateTime, gtinDisplay, num, pct, regionName } from '../../lib/format'
import { licenceLabel } from '../../lib/licence'
import type { DashboardData } from '../../lib/types'
import { DataTable } from '../charts'
import { ShieldArt } from '../illustrations'
import { InfoPopover, Panel, SectionHeader, StatusPill } from '../ui'
import { t } from '../../i18n'

/** Brand protection: link verso domini non del titolare, numeri mai assegnati, domini letti. */
export function Protection({ data }: { data: DashboardData }) {
  return (
    <section className="section">
      <SectionHeader id="protezione" title={t('Brand protection')} />
      {data.allerte.length ? (
        <ul className="alert-grid">
          {data.allerte.map((a) => (
            <li key={`${a.gtin}-${a.dominio}`} className={`alert-card reveal ${a.sospetto ? 'is-critical' : 'is-warning'}`}>
              <div className="alert-top">
                <StatusPill tone={a.sospetto ? 'critical' : 'warning'}>{a.sospetto ? t('Link sospetto') : t('Dominio non riconosciuto')}</StatusPill>
                {a.segnalato_google && <StatusPill tone="critical">{t('Segnalato da Google')}</StatusPill>}
              </div>
              <div className="alert-head">
                <p className="alert-domain"><Link2 size={16} /> <code>{a.dominio}</code></p>
                {a.somiglia_a && <p className="alert-like">imita <code>{a.somiglia_a}</code></p>}
              </div>
              <dl>
                <div><dt>{t('Titolare')}</dt><dd>{a.titolare ?? '–'}</dd></div>
                <div><dt>GTIN</dt><dd><code>{gtinDisplay(a.gtin)}</code></dd></div>
                <div><dt>{t('Letture')}</dt><dd>{num(a.letture)}</dd></div>
                <div><dt>{t('Regioni')}</dt><dd>{(a.regioni ?? []).map((r) => regionName('IT', r, r)).join(', ') || '–'}</dd></div>
              </dl>
              <p className="alert-when">{t('Ultima lettura {when}', { when: dateTime(a.ultima) })}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="panel reveal all-clear">
          <ShieldArt />
          <div>
            <h3>{t('Nessuna allerta nel periodo')}</h3>
            <p>{t('Tutti i link letti nei QR Code Standard GS1 puntano a domini registrati dai titolari dei codici.')}</p>
          </div>
        </div>
      )}
      <Panel
        title={t('Licenze GS1 scadute o non attive')}
        subtitle={t('Prodotti scansionati il cui codice appartiene a una licenza GS1 che Verified by GS1 non riporta come attiva.')}
      >
        <DataTable
          rows={data.licenze ?? []}
          rowKey={(l) => l.company_prefix ?? l.titolare ?? ''}
          empty={t('Nessuna licenza scaduta o non attiva tra i codici letti nel periodo.')}
          columns={[
            { label: t('Titolare'), render: (l) => <><b>{l.titolare ?? 'Titolare non disponibile'}</b><small className="cell-sub">prefisso {l.company_prefix ?? '–'}</small></> },
            { label: t('Stato'), render: (l) => <StatusPill tone="critical">{licenceLabel(l.stato_licenza, l.stato_scheda)}</StatusPill> },
            { label: t('Scansioni'), render: (l) => num(l.letture), numeric: true },
            { label: t('Prodotti'), render: (l) => num(l.prodotti), numeric: true },
            { label: t('Paesi'), render: (l) => (l.paesi ?? []).map((c) => countryName(c)).join(', ') || '–' },
            { label: t('Ultima'), render: (l) => dateTime(l.ultima) },
            { label: t('Perché conta'), render: () => (
              <InfoPopover label={t('Perché una licenza non attiva è un problema')}>
                <b className="info-title">{t('Licenza GS1 non attiva')}</b>
                <span className="info-text">{t('Il prefisso aziendale di questo codice non risulta più attivo: l’azienda potrebbe aver chiuso, non aver rinnovato la licenza, o il codice potrebbe essere usato senza diritto.')}</span>
                <span className="info-text"><b>{t('Cosa fare:')}</b> {t('GS1 Italy può contattare il titolare per il rinnovo; i distributori possono verificare il fornitore prima di accettare la merce.')}</span>
              </InfoPopover>
            ) },
          ]}
        />
      </Panel>
      <div className="grid g-two">
        <Panel title={t('Numeri mai assegnati da GS1')} subtitle={t('Possibili codici abusivi o contraffatti (errore E039).')}>
          <DataTable
            rows={data.non_assegnati}
            rowKey={(n) => n.inizio_codice}
            empty={t('Nessun numero non assegnato nel periodo.')}
            columns={[
              { label: t('Inizio del codice'), render: (n) => <code>{n.inizio_codice}…</code> },
              { label: t('Codici'), render: (n) => num(n.codici), numeric: true },
              { label: t('Letture'), render: (n) => num(n.letture), numeric: true },
              { label: t('Ultima'), render: (n) => dateTime(n.ultima) },
            ]}
          />
        </Panel>
        <Panel title={t('Domini nei link')}>
          <DataTable
            rows={data.domini}
            rowKey={(d) => d.dominio}
            empty={t('Nessun link nel periodo.')}
            columns={[
              { label: t('Dominio'), render: (d) => <code>{d.dominio}</code> },
              { label: t('Letture'), render: (d) => num(d.letture), numeric: true },
              { label: t('Verificati'), render: (d) => pct(d.verificati, d.letture), numeric: true },
              { label: t('Sospetti'), render: (d) => (d.sospetti ? <StatusPill tone="critical">{num(d.sospetti)}</StatusPill> : '0'), numeric: true },
            ]}
          />
        </Panel>
      </div>
    </section>
  )
}
