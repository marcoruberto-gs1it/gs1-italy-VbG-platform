import { SECTIONS, type SectionId } from '../../lib/config'

/** Menu delle sezioni per telefono e tablet: scorre in orizzontale e resta fisso in alto. */
export function MobileNav({ active }: { active: SectionId }) {
  return (
    <nav className="mobile-nav" aria-label="Sezioni">
      {SECTIONS.map(({ id, label, icon: Icon }) => (
        <a key={id} href={`#${id}`} className={active === id ? 'is-active' : ''} aria-current={active === id ? 'location' : undefined}><Icon size={15} /> {label}</a>
      ))}
    </nav>
  )
}
