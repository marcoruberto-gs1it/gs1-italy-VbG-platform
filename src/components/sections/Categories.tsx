import { num, pct } from '../../lib/format'
import { share } from '../../lib/stats'
import type { DashboardData } from '../../lib/types'
import { DataTable, RankingList } from '../charts'
import { Panel, SectionHeader } from '../ui'

const average = (n: number | null) => `${n?.toLocaleString('it-IT') ?? '–'}/7`

/** Categorie di prodotto (GPC) in classifica. */
export function Categories({ data }: { data: DashboardData }) {
  return (
    <section className="section">
      <SectionHeader id="categorie" title="Categorie di prodotto (GPC)" />
      <Panel
        title="Classifica delle categorie"
        subtitle="Per numero di scansioni. Schede complete: quota di scansioni con tutti i 7 attributi essenziali su Verified by GS1."
        table={
          <DataTable
            rows={data.categorie}
            rowKey={(c) => c.gpc_brick}
            columns={[
              { label: 'Categoria', render: (c) => c.categoria ?? `GPC ${c.gpc_brick}` },
              { label: 'Brick GPC', render: (c) => c.gpc_brick },
              { label: 'Scansioni', render: (c) => num(c.letture), numeric: true },
              { label: 'Prodotti', render: (c) => num(c.gtin_distinti), numeric: true },
              { label: 'Schede complete', render: (c) => pct(c.schede_complete, c.letture), numeric: true },
              { label: 'Media attributi', render: (c) => average(c.media_dati), numeric: true },
            ]}
          />
        }
      >
        <RankingList
          empty="Nessuna categoria nel periodo: la categoria arriva dalle schede dei prodotti su Verified by GS1."
          rows={data.categorie.map((c) => ({
            key: c.gpc_brick,
            label: c.categoria ?? `GPC ${c.gpc_brick}`,
            sub: c.segmento,
            value: c.letture,
            stats: [
              { label: 'Prodotti', value: num(c.gtin_distinti) },
              { label: 'Schede complete', value: pct(c.schede_complete, c.letture), meter: share(c.schede_complete, c.letture) },
              { label: 'Media attributi', value: average(c.media_dati) },
            ],
          }))}
        />
      </Panel>
    </section>
  )
}
