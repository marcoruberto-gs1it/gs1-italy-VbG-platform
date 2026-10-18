import { useEffect, useRef, useState } from 'react'
import {
  BadgeCheck, ChevronRight, Globe2, LayoutDashboard, LogOut, Map as MapIcon, QrCode, RefreshCw,
  ShieldAlert, Tags, Link2, TriangleAlert, MapPin, Table2,
} from 'lucide-react'
import logo from '../assets/gs1-italy-logo.png'
import { fillDays } from '../lib/days'
import { dateTime, day, gtinDisplay, num, pct, regionName } from '../lib/format'
import { gsap, motionOk, useGSAP } from '../lib/motion'
import type { DashboardData, Kpi } from '../lib/types'
import { BarList, ComplianceBar, DailyChart, DataTable, Empty, ItalyMap, RegionTable, RingGauge, SymbologyGrid } from './charts'
import { RippleArt, ShieldArt } from './illustrations'
import { RawData } from './RawData'
import { Counter, Delta, Panel, SectionHeader, Select, StatusPill } from './ui'

const PERIODS = [
  { days: 7, label: '7 giorni', long: 'negli ultimi 7 giorni' },
  { days: 30, label: '30 giorni', long: 'negli ultimi 30 giorni' },
  { days: 90, label: '90 giorni', long: 'negli ultimi 90 giorni' },
  { days: 365, label: '12 mesi', long: 'negli ultimi 12 mesi' },
] as const

const SECTIONS = [
  { id: 'panoramica', label: 'Panoramica', icon: LayoutDashboard },
  { id: 'adozione', label: 'Adozione 2D', icon: QrCode },
  { id: 'territorio', label: 'Territorio', icon: MapIcon },
  { id: 'qualita', label: 'Qualità dei codici', icon: BadgeCheck },
  { id: 'categorie', label: 'Categorie', icon: Tags },
  { id: 'protezione', label: 'Brand protection', icon: ShieldAlert },
  { id: 'dati', label: 'Dati grezzi', icon: Table2 },
] as const

type Props = {
  data: DashboardData | null
  previous: Kpi | null
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

const share = (part: number, total: number) => (total ? part / total : 0)
/** Quota del periodo precedente solo se c'era una base su cui calcolarla (altrimenti nessun confronto). */
const prevShare = (part: number | undefined, total: number | undefined) => (part != null && total ? part / total : null)
const pctNum = (n: number) => `${(Math.round(n * 10) / 10).toLocaleString('it-IT')}%`

/**
 * Sezione attiva nel menu, aggiornata durante lo scorrimento: è l'ultima sezione il cui inizio ha
 * superato la parte alta dello schermo; in fondo alla pagina è sempre l'ultima.
 */
function useActiveSection(ready: boolean) {
  const [active, setActive] = useState<string>(SECTIONS[0].id)
  useEffect(() => {
    if (!ready) return
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * 0.3
      let current: string = SECTIONS[0].id
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= line) current = s.id
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = SECTIONS[SECTIONS.length - 1].id
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [ready])
  return active
}

/** Nel menu orizzontale (telefono) la voce attiva resta sempre visibile. */
function useKeepActiveVisible(active: string) {
  useEffect(() => {
    const chip = document.querySelector<HTMLElement>(`.mobile-nav a[href="#${active}"]`)
    const bar = chip?.parentElement
    if (!chip || !bar || bar.scrollWidth <= bar.clientWidth) return
    const offset = chip.getBoundingClientRect().left - bar.getBoundingClientRect().left
    bar.scrollTo({ left: bar.scrollLeft + offset - (bar.clientWidth - chip.clientWidth) / 2, behavior: 'smooth' })
  }, [active])
}

export function Dashboard({ data, previous, loading, error, days, country, demo, email, onDays, onCountry, onReload, onSignOut }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const active = useActiveSection(Boolean(data))
  useKeepActiveVisible(active)
  const k = data?.kpi
  const period = PERIODS.find((p) => p.days === days) ?? PERIODS[1]

  // Ingresso della pagina: barra laterale, intestazione, indicatori; onde GS1 in loop; sezioni allo scorrimento.
  useGSAP(
    () => {
      if (!motionOk()) return
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.side-item', { x: -14, opacity: 0, duration: 0.45, stagger: 0.05 })
        .from('.hero', { y: 24, opacity: 0, duration: 0.7 }, 0.1)
        .from('.hero-copy > *', { y: 16, opacity: 0, duration: 0.5, stagger: 0.08 }, 0.3)
        .from('.ga-core', { scale: 0.5, opacity: 0, transformOrigin: '50% 50%', duration: 0.8, ease: 'back.out(1.8)' }, 0.35)
        .from('.kpi', { y: 22, opacity: 0, duration: 0.55, stagger: 0.07 }, 0.45)
      gsap.to('.ga-wave', { attr: { r: 128 }, strokeOpacity: 0, duration: 3.2, ease: 'sine.out', stagger: { each: 0.8, repeat: -1 } })
      gsap.fromTo('.ga-scanline', { y: -16 }, { y: 16, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      // Comparsa allo scorrimento: anima solo ciò che entra davvero sullo schermo. Con un salto lungo
      // (link del menu, ricarica a metà pagina) non si accoda tutto ciò che è stato saltato.
      const reveal = gsap.utils.toArray<HTMLElement>('.reveal')
      gsap.set(reveal, { opacity: 0, y: 26 })
      const io = new IntersectionObserver(
        (entries) => {
          const shown = entries.filter((e) => e.isIntersecting).map((e) => e.target)
          if (!shown.length) return
          shown.forEach((el) => io.unobserve(el))
          gsap.to(shown, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.08 })
        },
        { rootMargin: '0px 0px -8% 0px' },
      )
      reveal.forEach((el) => io.observe(el))
      return () => io.disconnect()
    },
    // revertOnUpdate: quando arrivano i dati si riparte da zero, senza ereditare stati a metà animazione.
    { scope: root, dependencies: [Boolean(data)], revertOnUpdate: true },
  )

  // Senza scansioni nel periodo precedente un confronto sarebbe fuorviante: non lo mostriamo.
  const prev = previous && previous.letture > 0 ? previous : null
  const regionsIt = data?.regioni.filter((r) => r.country === 'IT' && r.region_code).length ?? 0

  return (
    <div className="layout" ref={root}>
      {/* ───── Barra laterale ───── */}
      <aside className="sidebar">
        <div className="side-brand">
          <img src={logo} alt="GS1 Italy" width={52} height={36} />
          <span><b>VbG</b> Platform</span>
        </div>
        <nav aria-label="Sezioni">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <a key={id} href={`#${id}`} className={`side-item ${active === id ? 'is-active' : ''}`} aria-current={active === id ? 'true' : undefined}>
              <Icon size={19} strokeWidth={2.1} /> <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="side-foot side-item">
          {demo ? <span className="badge is-demo">Dati dimostrativi</span> : <span className="side-user" title={email}>{email}</span>}
          {demo ? (
            <a className="btn ghost" href="./">Accedi</a>
          ) : (
            <button className="btn ghost" type="button" onClick={onSignOut}><LogOut size={16} /> Esci</button>
          )}
        </div>
      </aside>

      <div className="main">
        {/* ───── Barra superiore: filtri ───── */}
        <header className="topbar">
          <div className="topbar-brand">
            <img src={logo} alt="GS1 Italy" width={46} height={32} />
          </div>
          <div className="filters" role="toolbar" aria-label="Filtri">
            <div className="segmented" role="radiogroup" aria-label="Periodo">
              {PERIODS.map((p) => (
                <button key={p.days} type="button" role="radio" aria-checked={days === p.days} className={days === p.days ? 'is-active' : ''} onClick={() => onDays(p.days)}>{p.label}</button>
              ))}
            </div>
            <Select
              label="Paese"
              value={country}
              onChange={onCountry}
              options={[
                { value: '', label: 'Tutti i paesi', hint: 'Scansioni da ogni paese', icon: Globe2 },
                { value: 'IT', label: 'Italia', hint: 'Solo scansioni dall’Italia', icon: MapPin },
              ]}
            />
            <button className="btn ghost icon-only" type="button" onClick={onReload} disabled={loading} aria-label="Aggiorna i dati" title="Aggiorna i dati">
              <RefreshCw size={17} className={loading ? 'spin' : undefined} />
            </button>
          </div>
          <nav className="mobile-nav" aria-label="Sezioni">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <a key={id} href={`#${id}`} className={active === id ? 'is-active' : ''}><Icon size={15} /> {label}</a>
            ))}
          </nav>
        </header>

        <main className="content">
          {error && <p className="notice is-error" role="alert"><TriangleAlert size={18} /> {error}</p>}
          {!data && loading && <div className="skeleton-hero" aria-busy="true" />}

          {k && data && (
            <>
              {/* ───── Panoramica ───── */}
              <section id="panoramica" className="section">
                <div className="hero">
                  <div className="hero-copy">
                    <p className="eyebrow light">Panoramica · {period.label}{country ? ' · Italia' : ''}</p>
                    <h1>
                      <Counter value={k.letture} format={num} /> scansioni {period.long}
                    </h1>
                    <p className="hero-text">
                      {num(k.prodotti_distinti)} prodotti diversi in {regionsIt} {regionsIt === 1 ? 'regione' : 'regioni'}. Il <b>{pct(k.letture_2d, k.letture_simbolo)}</b> dei codici letti è 2D
                      e il <b>{pct(k.conformi, k.letture_simbolo)}</b> rispetta gli standard GS1.
                      {k.allerte_link > 0 && <> <b className="hero-alert">{num(k.allerte_link)} {k.allerte_link === 1 ? 'allerta' : 'allerte'}</b> di brand protection da verificare.</>}
                    </p>
                    <div className="hero-actions">
                      <a className="btn light" href="#adozione">Esplora l’adozione 2D <ChevronRight size={17} /></a>
                      {k.allerte_link > 0 && <a className="btn outline-light" href="#protezione"><ShieldAlert size={16} /> Vedi le allerte</a>}
                    </div>
                  </div>
                  <RippleArt />
                </div>

                <div className="kpis">
                  <article className="kpi">
                    <p className="kpi-label">Scansioni</p>
                    <p className="kpi-value"><Counter value={k.letture} format={num} /></p>
                    {prev ? <Delta now={k.letture} before={prev.letture} good="neutral" /> : <span className="delta is-neutral">Periodo precedente senza dati</span>}
                  </article>
                  <article className="kpi">
                    <p className="kpi-label">Quota codici 2D</p>
                    <p className="kpi-value"><Counter value={share(k.letture_2d, k.letture_simbolo) * 100} format={pctNum} /></p>
                    <Delta now={share(k.letture_2d, k.letture_simbolo)} before={prevShare(prev?.letture_2d, prev?.letture_simbolo)} mode="points" good="up" />
                  </article>
                  <article className="kpi">
                    <p className="kpi-label">Conformi agli standard GS1</p>
                    <p className="kpi-value"><Counter value={share(k.conformi, k.letture_simbolo) * 100} format={pctNum} /></p>
                    <Delta now={share(k.conformi, k.letture_simbolo)} before={prevShare(prev?.conformi, prev?.letture_simbolo)} mode="points" good="up" />
                  </article>
                  <article className="kpi">
                    <p className="kpi-label">Schede VbG complete (7/7)</p>
                    <p className="kpi-value"><Counter value={share(k.schede_complete, k.schede_valutate) * 100} format={pctNum} /></p>
                    <Delta now={share(k.schede_complete, k.schede_valutate)} before={prevShare(prev?.schede_complete, prev?.schede_valutate)} mode="points" good="up" />
                  </article>
                  <article className={`kpi ${k.allerte_link ? 'is-alert' : ''}`}>
                    <p className="kpi-label">Allerte di brand protection</p>
                    <p className="kpi-value"><Counter value={k.allerte_link} format={num} /></p>
                    <Delta now={k.allerte_link} before={prev?.allerte_link} good="down" />
                  </article>
                </div>
              </section>

              {/* ───── Adozione 2D ───── */}
              <section className="section">
                <SectionHeader id="adozione" title="Adozione dei codici 2D" text="Quanto i codici 2D (QR Code Standard GS1, GS1 DataMatrix) stanno affiancando i barcode tradizionali." />
                <div className="grid g-adoption">
                  <Panel title="Quota sul totale">
                    <RingGauge value={k.letture_2d} total={k.letture_simbolo} label="codici 2D" caption={`${num(k.letture_2d)} codici 2D su ${num(k.letture_simbolo)} codici letti con fotocamera o da foto.`} />
                  </Panel>
                  <Panel
                    title="Scansioni al giorno"
                    subtitle="Barcode 1D e codici 2D letti; esclusi gli inserimenti a mano."
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
                </div>
                <Panel title="Simbologie lette" subtitle="In blu le simbologie degli standard GS1.">
                  <SymbologyGrid data={data.simbologie} />
                </Panel>
              </section>

              {/* ───── Territorio ───── */}
              <section className="section">
                <SectionHeader id="territorio" title="Dove si scansiona" text="Regione dedotta da Cloudflare dalla connessione: con le reti mobili può risultare la sede del gestore." />
                <Panel title="Mappa delle regioni" className="map-panel" table={<RegionTable data={data.regioni} />}>
                  <div className="map-layout">
                    <ItalyMap data={data.regioni} />
                    <div className="map-side">
                      <h4>Classifica regioni</h4>
                      <BarList rows={data.regioni.slice(0, 8).map((r) => ({
                        key: `${r.country}-${r.region_code}`,
                        label: regionName(r.country, r.region_code, r.region),
                        value: r.letture,
                        note: `2D ${pct(r.letture_2d, r.letture)}`,
                      }))} />
                    </div>
                  </div>
                  <p className="map-source">Confini regionali: ISTAT, CC BY 4.0</p>
                </Panel>
              </section>

              {/* ───── Qualità ───── */}
              <section className="section">
                <SectionHeader id="qualita" title="Qualità dei codici" text="Quanti codici letti rispettano gli standard GS1 e quali errori ricorrono." />
                <div className="grid g-two">
                  <Panel title="Conformità agli standard GS1">
                    <ComplianceBar data={data.conformita} />
                  </Panel>
                  <Panel title="Errori di sintassi più frequenti">
                    <DataTable rows={data.errori_sintassi} empty="Nessun errore di sintassi nel periodo." columns={[
                      { label: 'Errore', render: (x) => <code className="wrap">{x.errore}</code> },
                      { label: 'Letture', render: (x) => num(x.letture), numeric: true },
                    ]} />
                  </Panel>
                </div>
                <Panel title="Aziende con errori nei codici" subtitle="Prefissi aziendali con errori di stampa o di codifica.">
                  <DataTable rows={data.qualita} empty="Nessun errore nel periodo." columns={[
                    { label: 'Titolare', render: (q) => <><b>{q.titolare ?? '–'}</b><small className="cell-sub">prefisso {q.company_prefix}</small></> },
                    { label: 'Cifra di controllo', render: (q) => num(q.errori_cifra), numeric: true },
                    { label: 'Sintassi', render: (q) => num(q.errori_sintassi), numeric: true },
                    { label: 'Non standard', render: (q) => num(q.non_standard), numeric: true },
                    { label: 'Letture', render: (q) => num(q.letture), numeric: true },
                    { label: 'Errori', render: (q) => <StatusPill tone={q.errori / q.letture > 0.03 ? 'critical' : 'warning'}>{pct(q.errori, q.letture)}</StatusPill>, numeric: true },
                  ]} />
                </Panel>
              </section>

              {/* ───── Categorie ───── */}
              <section className="section">
                <SectionHeader id="categorie" title="Categorie di prodotto (GPC)" text="Le categorie più lette, con la completezza delle schede Verified by GS1." />
                {data.categorie.length ? (
                  <ul className="cat-grid">
                    {data.categorie.map((c, i) => {
                      const complete = share(c.schede_complete, c.letture)
                      return (
                        <li key={c.gpc_brick} className="cat-card reveal">
                          <span className="cat-rank">{i + 1}</span>
                          <p className="cat-segment">{c.segmento ?? 'GPC'}</p>
                          <h3>{c.categoria ?? `GPC ${c.gpc_brick}`}</h3>
                          <p className="cat-reads"><b>{num(c.letture)}</b> scansioni · {num(c.gtin_distinti)} prodotti</p>
                          <div className="cat-meter" aria-label={`Schede complete: ${pct(c.schede_complete, c.letture)}`}>
                            <span style={{ width: `${complete * 100}%` }} />
                          </div>
                          <p className="cat-foot"><span>Schede complete <b>{pct(c.schede_complete, c.letture)}</b></span><span>Media <b>{c.media_dati?.toLocaleString('it-IT') ?? '–'}/7</b></span></p>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <Panel title="Categorie"><Empty /></Panel>
                )}
              </section>

              {/* ───── Brand protection ───── */}
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
                    <DataTable rows={data.non_assegnati} empty="Nessun numero non assegnato nel periodo." columns={[
                      { label: 'Inizio del codice', render: (n) => <code>{n.inizio_codice}…</code> },
                      { label: 'Codici', render: (n) => num(n.codici), numeric: true },
                      { label: 'Letture', render: (n) => num(n.letture), numeric: true },
                      { label: 'Ultima', render: (n) => dateTime(n.ultima) },
                    ]} />
                  </Panel>
                  <Panel title="Domini nei link">
                    <DataTable rows={data.domini} empty="Nessun link nel periodo." columns={[
                      { label: 'Dominio', render: (d) => <code>{d.dominio}</code> },
                      { label: 'Letture', render: (d) => num(d.letture), numeric: true },
                      { label: 'Verificati', render: (d) => pct(d.verificati, d.letture), numeric: true },
                      { label: 'Sospetti', render: (d) => (d.sospetti ? <StatusPill tone="critical">{num(d.sospetti)}</StatusPill> : '0'), numeric: true },
                    ]} />
                  </Panel>
                </div>
              </section>

              {/* ───── Dati grezzi ───── */}
              <section className="section">
                <SectionHeader id="dati" title="Dati grezzi" text="Le singole scansioni del periodo, filtrabili. Aprire un dettaglio interroga Verified by GS1 senza registrare una nuova scansione." />
                <RawData days={days} country={country} demo={demo} symbologies={data.simbologie.map((s) => s.simbologia)} />
              </section>

              <footer className="page-foot">
                <span>GS1 Italy · VbG Platform</span>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
