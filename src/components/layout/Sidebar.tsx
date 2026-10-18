import { LogOut } from 'lucide-react'
import logo from '../../assets/gs1-italy-logo.png'
import { SECTIONS, type SectionId } from '../../lib/config'

type Props = { active: SectionId; demo: boolean; email?: string; onSignOut: () => void }

/** Barra laterale (computer): marchio, sezioni della pagina, account. */
export function Sidebar({ active, demo, email, onSignOut }: Props) {
  return (
    <aside className="sidebar">
      <div className="side-brand">
        <img src={logo} alt="GS1 Italy" width={52} height={36} />
        <span><b>VbG</b> Platform</span>
      </div>
      <nav aria-label="Sezioni">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <a key={id} href={`#${id}`} className={`side-item ${active === id ? 'is-active' : ''}`} aria-current={active === id ? 'location' : undefined}>
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
  )
}
