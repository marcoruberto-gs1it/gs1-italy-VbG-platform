import { fillDays } from '../../lib/days'
import { day, num, pct } from '../../lib/format'
import type { DashboardData } from '../../lib/types'
import { DailyChart, DataTable, RingGauge, SymbologyGrid } from '../charts'
import { Panel, SectionHeader } from '../ui'
import { t } from '../../i18n'

/** Adozione dei codici 2D: quota sul totale, andamento giornaliero, simbologie lette. */
export function Adoption({ data, days }: { data: DashboardData; days: number }) {
  const k = data.kpi
  return (
    <section className="section">
      <SectionHeader id="adozione" title={t('Adozione dei codici 2D')} />
      <div className="grid g-adoption">
        <Panel title={t('Quota sul totale')}>
          <RingGauge value={k.letture_2d} total={k.letture_simbolo} label={t('codici 2D')} caption={t('{a} codici 2D su {b} codici letti con fotocamera o da foto.', { a: num(k.letture_2d), b: num(k.letture_simbolo) })} />
        </Panel>
        <Panel
          title={t('Scansioni al giorno')}
          subtitle={t('Barcode 1D e codici 2D letti; esclusi gli inserimenti a mano.')}
          table={
            <DataTable
              rows={data.giornaliero.filter((r) => r.letture_1d + r.letture_2d + r.manuali)}
              rowKey={(r) => r.giorno}
              columns={[
                { label: t('Giorno'), render: (r) => day(r.giorno) },
                { label: t('Barcode 1D'), render: (r) => num(r.letture_1d), numeric: true },
                { label: t('Codici 2D'), render: (r) => num(r.letture_2d), numeric: true },
                { label: t('Quota 2D'), render: (r) => pct(r.letture_2d, r.letture_1d + r.letture_2d), numeric: true },
                { label: t('A mano'), render: (r) => num(r.manuali), numeric: true },
              ]}
            />
          }
        >
          <DailyChart data={fillDays(data.giornaliero, days)} />
        </Panel>
      </div>
      <Panel title={t('Simbologie lette')} subtitle={t('Prima le simbologie degli standard GS1 (in blu), poi gli altri codici. La torta indica la quota sul totale delle scansioni.')}>
        <SymbologyGrid data={data.simbologie} />
      </Panel>
    </section>
  )
}
