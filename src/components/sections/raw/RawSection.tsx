import { SectionHeader } from '../../ui'
import { RawData } from './RawData'

type Props = { days: number; country: string; demo: boolean; symbologies: string[]; search: string }

/** Sezione dei dati grezzi; `search` precompila la ricerca (es. il prefisso dalla vista Produttori). */
export function RawSection({ days, country, demo, symbologies, search }: Props) {
  return (
    <section className="section">
      <SectionHeader id="dati" title="Dati grezzi" />
      <RawData key={search} days={days} country={country} demo={demo} symbologies={symbologies} initialSearch={search} />
    </section>
  )
}
