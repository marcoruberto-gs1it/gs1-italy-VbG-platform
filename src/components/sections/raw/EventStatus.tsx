import { labelFor, type LabelMap } from '../../../lib/eventLabels'
import { StatusPill } from '../../ui'

/** Etichetta di stato per un campo della scansione. */
export function EventStatus({ map, value }: { map: LabelMap; value: string | null }) {
  const [label, tone] = labelFor(map, value)
  return <StatusPill tone={tone}>{label}</StatusPill>
}
