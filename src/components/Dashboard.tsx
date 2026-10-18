import { LogOut, RefreshCw } from 'lucide-react'
import logo from '../assets/gs1-italy-logo.png'
import { dateTime, day, gtinDisplay, num, pct, regionName } from '../lib/format'
import type { DashboardData } from '../lib/types'
import { fillDays } from '../lib/days'
import { BarList, ComplianceBar, DailyChart, DataTable, Panel, StatTile } from './charts'

export const PERIODS = [
  { days: 7, label: '7 giorni' },
  { days: 30, label: '30 giorni' },
  { days: 90, label: '90 giorni' },
  { days: 365, label: '12 mesi' },
] as const

type Props = {
  data: DashboardData | null
  loading: boolean
  error: string | null
  days: number
  country: string
  demo: boolean
  email?: string
  onDays: (days: number) => void
  onCountry: (country: string) => void
  onReload: () => void
  onSignOut: () => void
}

export function Dashboard({ data, loading, error, days, country, demo, email, onDays, onCountry, onReload, onSignOut }: Props) {
  const k = data?.kpi
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <img src={logo} alt="GS1 Italy" width={56} height={38} />
          <span><b>VbG Platform</b> Analytics</span>
        </div>
        <div className="topbar-right">
          {demo ? <span className="demo-badge">Dati dimostrativi</span> : <span className="user">{email}</span>}
          {demo ? <a className="ghost-btn" href="./">Accedi</a> : (
            <button className="ghost-btn" type="button" onClick={onSignOut}><LogOut size={16} /> Esci</button>
          )}
        </div>
      </header>

      <main className="content">
        <div className="filters" role="toolbar" aria-label="Filtri">
          <div className="segmented" role="radiogroup" aria-label="Periodo">
            {PERIODS.map((p) => (
              <button key={p.days} type="button" role="radio" aria-checked={days === p.days} className={days === p.days ? 'is-active' : ''} onClick={() => onDays(p.days)}>{p.label}</button>
            ))}
          </div>
          <select value={country} onChange={(e) => onCountry(e.target.value)} aria-label="Paese">
            <option value="">Tutti i paesi</option>
            <option value="IT">Italia</option>
          </select>
          <button className="ghost-btn" type="button" onClick={onReload} disabled={loading} aria-label="Aggiorna i dati">
            <RefreshCw size={16} className={loading ? 'spin' : undefined} /> Aggiorna
          </button>
        </div>

        {error && <p className="notice is-error" role="alert">{error}</p>}

        {k && data && (
          <>
            <div className="stats">
              <StatTile label="Scansioni" value={num(k.letture)} detail={`${num(k.prodotti_distinti)} prodotti diversi`} />
              <StatTile label="Quota codici 2D" value={pct(k.letture_2d, k.letture_simbolo)} detail={`${num(k.letture_2d)} su ${num(k.letture_simbolo)} codici letti`} />
              <StatTile label="Conformi agli standard GS1" value={pct(k.conformi, k.letture_simbolo)} detail={`${num(k.con_errori)} con errori · ${num(k.non_gs1)} non GS1`} />
              <StatTile label="Schede VbG complete (7/7)" value={pct(k.schede_complete, k.schede_valutate)} detail={`${num(k.verificati)} prodotti verificati`} />
              <StatTile label="Allerte di brand protection" value={num(k.allerte_link)} detail={`${num(k.link_sospetti)} link sospetti`} tone={k.allerte_link ? 'alert' : undefined} />
            </div>

            <div className="grid">
              <Panel
                wide
                title="Scansioni al giorno"
                subtitle="Barcode 1D e codici 2D letti con la fotocamera o da foto; esclusi gli inserimenti a mano."
                table={
                  <DataTable rows={data.giornaliero.filter((r) => r.letture_1d + r.letture_2d + r.manuali)} columns={[
                    { label: 'Giorno', render: (r) => day(r.giorno) },
                    { label: 'Barcode 1D', render: (r) => num(r.letture_1d), numeric: true },
                    { label: 'Codici 2D', render: (r) => num(r.letture_2d), numeric: true },
                    { label: 'Quota 2D', render: (r) => pct(r.letture_2d, r.letture_1d + r.letture_2d), numeric: true },
                    { label: 'A mano', render: (r) => num(r.manuali), numeric: true },
                  ]} />
                }
              >
                <DailyChart data={fillDays(data.giornaliero, days)} />
              </Panel>

              <Panel title="Scansioni per regione" subtitle="Regione dedotta da Cloudflare dalla connessione; con le reti mobili può risultare la sede del gestore.">
                <BarList rows={data.regioni.slice(0, 12).map((r) => ({
                  key: `${r.country}-${r.region_code}`,
                  label: regionName(r.country, r.region_code, r.region),
                  value: r.letture,
                  note: `2D ${pct(r.letture_2d, r.letture)}`,
                }))} />
              </Panel>

              <Panel title="Conformità agli standard GS1" subtitle="Esito del controllo su simbologia, dati e sintassi (GS1 Barcode Syntax Engine).">
                <ComplianceBar data={data.conformita} />
              </Panel>

              <Panel title="Simbologie lette">
                <BarList rows={data.simbologie.map((s) => ({ key: s.simbologia, label: s.simbologia, value: s.letture, sub: s.is_2d == null ? undefined : s.is_2d ? '2D' : '1D' }))} />
              </Panel>

              <Panel title="Categorie di prodotto (GPC)" subtitle="Le più lette, con la completezza delle schede Verified by GS1.">
                <BarList rows={data.categorie.map((c) => ({
                  key: c.gpc_brick,
                  label: c.categoria ?? `GPC ${c.gpc_brick}`,
                  sub: c.segmento ?? undefined,
                  value: c.letture,
                  note: `${pct(c.schede_complete, c.letture)} complete · media ${c.media_dati?.toLocaleString('it-IT') ?? '–'}/7`,
                }))} />
              </Panel>

              <Panel wide title="Allerte di brand protection" subtitle="Codici autentici, verificati su VbG, che puntano a domini non registrati dal titolare.">
                <DataTable rows={data.allerte} empty="Nessuna allerta nel periodo." columns={[
                  { label: 'Titolare', render: (a) => <><b>{a.titolare ?? '–'}</b><small className="cell-sub">prefisso {a.company_prefix ?? '–'}</small></> },
                  { label: 'GTIN', render: (a) => <code>{gtinDisplay(a.gtin)}</code> },
                  { label: 'Dominio nel QR Code Standard GS1', render: (a) => <><code>{a.dominio}</code>{a.somiglia_a && <small className="cell-sub">somiglia a {a.somiglia_a}</small>}</> },
                  { label: 'Esito', render: (a) => <span className={`pill ${a.sospetto ? 'is-critical' : 'is-warning'}`}>{a.sospetto ? 'Sospetto' : 'Non riconosciuto'}{a.segnalato_google ? ' · segnalato da Google' : ''}</span> },
                  { label: 'Letture', render: (a) => num(a.letture), numeric: true },
                  { label: 'Regioni', render: (a) => (a.regioni ?? []).map((r) => regionName('IT', r, r)).join(', ') || '–' },
                  { label: 'Ultima lettura', render: (a) => dateTime(a.ultima) },
                ]} />
              </Panel>

              <Panel title="Qualità dei codici per azienda" subtitle="Prefissi con errori di stampa o di codifica nei codici letti.">
                <DataTable rows={data.qualita} empty="Nessun errore nel periodo." columns={[
                  { label: 'Titolare', render: (q) => <><b>{q.titolare ?? '–'}</b><small className="cell-sub">prefisso {q.company_prefix}</small></> },
                  { label: 'Cifra di controllo', render: (q) => num(q.errori_cifra), numeric: true },
                  { label: 'Sintassi', render: (q) => num(q.errori_sintassi), numeric: true },
                  { label: 'Non standard', render: (q) => num(q.non_standard), numeric: true },
                  { label: 'Errori', render: (q) => pct(q.errori, q.letture), numeric: true },
                ]} />
              </Panel>

              <Panel title="Errori di sintassi più frequenti" subtitle="Messaggi della GS1 Barcode Syntax Engine.">
                <DataTable rows={data.errori_sintassi} empty="Nessun errore di sintassi nel periodo." columns={[
                  { label: 'Errore', render: (x) => <code className="wrap">{x.errore}</code> },
                  { label: 'Letture', render: (x) => num(x.letture), numeric: true },
                ]} />
              </Panel>

              <Panel title="Numeri mai assegnati da GS1" subtitle="Possibili codici abusivi: numeri che non risultano assegnati a nessuna azienda (E039).">
                <DataTable rows={data.non_assegnati} empty="Nessun numero non assegnato nel periodo." columns={[
                  { label: 'Inizio del codice', render: (n) => <code>{n.inizio_codice}…</code> },
                  { label: 'Codici diversi', render: (n) => num(n.codici), numeric: true },
                  { label: 'Letture', render: (n) => num(n.letture), numeric: true },
                  { label: 'Ultima lettura', render: (n) => dateTime(n.ultima) },
                ]} />
              </Panel>

              <Panel title="Domini nei link">
                <DataTable rows={data.domini} empty="Nessun link nel periodo." columns={[
                  { label: 'Dominio', render: (d) => <code>{d.dominio}</code> },
                  { label: 'Letture', render: (d) => num(d.letture), numeric: true },
                  { label: 'Verificati', render: (d) => pct(d.verificati, d.letture), numeric: true },
                  { label: 'Sospetti', render: (d) => (d.sospetti ? <span className="pill is-critical">{num(d.sospetti)}</span> : '0'), numeric: true },
                ]} />
              </Panel>
            </div>
          </>
        )}
        {!data && loading && <p className="empty">Caricamento dei dati…</p>}
      </main>
    </div>
  )
}
