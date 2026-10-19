import type { ReactNode } from 'react'
import { num, pct, regionName } from '../../lib/format'
import type { DashboardData } from '../../lib/types'
import { Empty } from './Empty'
import { t } from '../../i18n'

export type Column<T> = { label: string; render: (row: T) => ReactNode; numeric?: boolean }

type Props<T> = { rows: T[]; columns: Column<T>[]; empty?: string; rowKey?: (row: T, index: number) => string | number }

/**
 * Tabella dati. Sul telefono ogni riga diventa una scheda con le etichette delle colonne
 * (data-label), così non serve scorrere in orizzontale.
 */
export function DataTable<T>({ rows, columns, empty, rowKey = (_, i) => i }: Props<T>) {
  if (!rows.length) return <Empty text={empty} />
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.label} className={c.numeric ? 'num' : undefined}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey(row, i)}>
              {columns.map((c) => <td key={c.label} data-label={c.label} className={c.numeric ? 'num' : undefined}>{c.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Tabella "regione per regione": vista accessibile della mappa. */
export function RegionTable({ data }: { data: DashboardData['regioni'] }) {
  return (
    <DataTable
      rows={data}
      rowKey={(r) => `${r.country}-${r.region_code}`}
      columns={[
        { label: t('Regione'), render: (r) => regionName(r.country, r.region_code, r.region) },
        { label: t('Scansioni'), render: (r) => num(r.letture), numeric: true },
        { label: t('Quota 2D'), render: (r) => pct(r.letture_2d, r.letture), numeric: true },
        { label: t('Conformi GS1'), render: (r) => pct(r.conformi, r.letture), numeric: true },
      ]}
    />
  )
}
