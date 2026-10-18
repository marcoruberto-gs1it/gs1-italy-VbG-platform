import { LogOut } from 'lucide-react'
import logo from '../../assets/gs1-italy-logo.png'
import type { Section, SectionId } from '../../lib/config'

type Props = { sections: Section[]; active: SectionId; demo: boolean; email?: string; onSignOut: () => void }

/** Barra laterale (computer): marchio, sezioni della pagina, account. */
export function Sidebar({ sections, active, demo, email, onSignOut }: Props) {
  return (
    <aside className="sidebar">
      <div className="side-brand">
        <img src={logo} alt="GS1 Italy" width={52} height={36} />
        <span><b>VbG</b> Platform</span>
      </div>
      <p className="side-version" title={`build ${__APP_VERSION__}`}>v. {__APP_RELEASE__}</p>
      <nav aria-label="Sezioni">
        <p className="side-group">Analisi</p>
        {sections.map(({ id, label, icon: Icon }) => (
          <div key={id} className="side-entry">
            {id === 'dati' && <p className="side-group">Dati</p>}
            <a href={`#${id}`} className={`side-item ${active === id ? 'is-active' : ''}`} aria-current={active === id ? 'location' : undefined}>
              <Icon size={19} strokeWidth={1.9} /> <span>{label}</span>
            </a>
          </div>
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
  )
}
