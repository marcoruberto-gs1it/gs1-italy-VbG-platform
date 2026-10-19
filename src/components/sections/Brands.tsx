import { num, pct } from '../../lib/format'
import { share } from '../../lib/stats'
import type { DashboardData } from '../../lib/types'
import { DataTable, RankingList } from '../charts'
import { Panel, SectionHeader } from '../ui'
import { t } from '../../i18n'

/** Brand più scansionati, con il titolare del codice. */
export function Brands({ data }: { data: DashboardData }) {
  const brands = data.brand ?? []
  return (
    <section className="section">
      <SectionHeader id="brand" title={t('Brand più scansionati')} />
      <Panel
        title={t('Classifica dei brand')}
        subtitle={t('Per numero di scansioni nel periodo.')}
        table={
          <DataTable
            rows={brands}
            rowKey={(b) => b.brand}
            columns={[
              { label: t('Brand'), render: (b) => b.brand },
              { label: t('Titolare'), render: (b) => b.titolare ?? '–' },
              { label: t('Scansioni'), render: (b) => num(b.letture), numeric: true },
              { label: t('Prodotti'), render: (b) => num(b.prodotti), numeric: true },
              { label: t('Quota 2D'), render: (b) => pct(b.letture_2d, b.letture), numeric: true },
              { label: t('Schede complete'), render: (b) => pct(b.schede_complete, b.letture), numeric: true },
            ]}
          />
        }
      >
        <RankingList
          empty={t('Nessun brand nel periodo: il marchio viene registrato con le scansioni dei prodotti presenti su Verified by GS1.')}
          rows={brands.map((b) => ({
            key: b.brand,
            label: b.brand,
            sub: b.titolare,
            value: b.letture,
            stats: [
              { label: t('Prodotti'), value: num(b.prodotti) },
              { label: t('Quota 2D'), value: pct(b.letture_2d, b.letture) },
              { label: t('Schede complete'), value: pct(b.schede_complete, b.letture), meter: share(b.schede_complete, b.letture) },
            ],
          }))}
        />
      </Panel>
    </section>
  )
}
