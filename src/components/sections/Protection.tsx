import { Link2 } from 'lucide-react'
import { dateTime, gtinDisplay, num, pct, regionName } from '../../lib/format'
import type { DashboardData } from '../../lib/types'
import { DataTable } from '../charts'
import { ShieldArt } from '../illustrations'
import { Panel, SectionHeader, StatusPill } from '../ui'

/** Brand protection: link verso domini non del titolare, numeri mai assegnati, domini letti. */
export function Protection({ data }: { data: DashboardData }) {
  return (
    <section className="section">
      <SectionHeader id="protezione" title="Brand protection" text="Codici autentici, verificati su Verified by GS1, che puntano a domini non registrati dal titolare." />
      {data.allerte.length ? (
        <ul className="alert-grid">
          {data.allerte.map((a) => (
            <li key={`${a.gtin}-${a.dominio}`} className={`alert-card reveal ${a.sospetto ? 'is-critical' : 'is-warning'}`}>
              <div className="alert-top">
                <StatusPill tone={a.sospetto ? 'critical' : 'warning'}>{a.sospetto ? 'Link sospetto' : 'Dominio non riconosciuto'}</StatusPill>
                {a.segnalato_google && <StatusPill tone="critical">Segnalato da Google</StatusPill>}
              </div>
              <div className="alert-head">
                <p className="alert-domain"><Link2 size={16} /> <code>{a.dominio}</code></p>
                {a.somiglia_a && <p className="alert-like">imita <code>{a.somiglia_a}</code></p>}
              </div>
              <dl>
                <div><dt>Titolare</dt><dd>{a.titolare ?? '–'}</dd></div>
                <div><dt>GTIN</dt><dd><code>{gtinDisplay(a.gtin)}</code></dd></div>
                <div><dt>Letture</dt><dd>{num(a.letture)}</dd></div>
                <div><dt>Regioni</dt><dd>{(a.regioni ?? []).map((r) => regionName('IT', r, r)).join(', ') || '–'}</dd></div>
              </dl>
              <p className="alert-when">Ultima lettura {dateTime(a.ultima)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="panel reveal all-clear">
          <ShieldArt />
          <div>
            <h3>Nessuna allerta nel periodo</h3>
            <p>Tutti i link letti nei QR Code Standard GS1 puntano a domini registrati dai titolari dei codici.</p>
          </div>
        </div>
      )}
      <div className="grid g-two">
        <Panel title="Numeri mai assegnati da GS1" subtitle="Possibili codici abusivi o contraffatti (errore E039).">
          <DataTable
            rows={data.non_assegnati}
            rowKey={(n) => n.inizio_codice}
            empty="Nessun numero non assegnato nel periodo."
            columns={[
              { label: 'Inizio del codice', render: (n) => <code>{n.inizio_codice}…</code> },
              { label: 'Codici', render: (n) => num(n.codici), numeric: true },
              { label: 'Letture', render: (n) => num(n.letture), numeric: true },
              { label: 'Ultima', render: (n) => dateTime(n.ultima) },
            ]}
          />
        </Panel>
        <Panel title="Domini nei link">
          <DataTable
            rows={data.domini}
            rowKey={(d) => d.dominio}
            empty="Nessun link nel periodo."
            columns={[
              { label: 'Dominio', render: (d) => <code>{d.dominio}</code> },
              { label: 'Letture', render: (d) => num(d.letture), numeric: true },
              { label: 'Verificati', render: (d) => pct(d.verificati, d.letture), numeric: true },
              { label: 'Sospetti', render: (d) => (d.sospetti ? <StatusPill tone="critical">{num(d.sospetti)}</StatusPill> : '0'), numeric: true },
            ]}
          />
        </Panel>
      </div>
    </section>
  )
}
