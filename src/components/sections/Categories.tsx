import { dec1, num, pct } from '../../lib/format'
import { share } from '../../lib/stats'
import type { DashboardData } from '../../lib/types'
import { DataTable, RankingList } from '../charts'
import { Panel, SectionHeader } from '../ui'
import { t } from '../../i18n'

const average = (n: number | null) => `${n == null ? '–' : dec1(n)}/7`

/** Categorie di prodotto (GPC) in classifica. */
export function Categories({ data }: { data: DashboardData }) {
  return (
    <section className="section">
      <SectionHeader id="categorie" title={t('Categorie di prodotto (GPC)')} />
      <Panel
        title={t('Classifica delle categorie')}
        subtitle={t('Per numero di scansioni. Schede complete: quota di scansioni con tutti i 7 attributi essenziali su Verified by GS1.')}
        table={
          <DataTable
            rows={data.categorie}
            rowKey={(c) => c.gpc_brick}
            columns={[
              { label: t('Categoria'), render: (c) => c.categoria ?? `GPC ${c.gpc_brick}` },
              { label: t('Brick GPC'), render: (c) => c.gpc_brick },
              { label: t('Scansioni'), render: (c) => num(c.letture), numeric: true },
              { label: t('Prodotti'), render: (c) => num(c.gtin_distinti), numeric: true },
              { label: t('Schede complete'), render: (c) => pct(c.schede_complete, c.letture), numeric: true },
              { label: t('Media attributi'), render: (c) => average(c.media_dati), numeric: true },
            ]}
          />
        }
      >
        <RankingList
          empty={t('Nessuna categoria nel periodo: la categoria arriva dalle schede dei prodotti su Verified by GS1.')}
          rows={data.categorie.map((c) => ({
            key: c.gpc_brick,
            label: c.categoria ?? `GPC ${c.gpc_brick}`,
            sub: c.segmento,
            value: c.letture,
            stats: [
              { label: t('Prodotti'), value: num(c.gtin_distinti) },
              { label: t('Schede complete'), value: pct(c.schede_complete, c.letture), meter: share(c.schede_complete, c.letture) },
              { label: t('Media attributi'), value: average(c.media_dati) },
            ],
          }))}
        />
      </Panel>
    </section>
  )
}
