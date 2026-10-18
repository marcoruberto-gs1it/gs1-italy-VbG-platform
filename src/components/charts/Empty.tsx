import { EmptyArt } from '../illustrations'

/** Stato vuoto di un grafico o di una tabella. */
export function Empty({ text = 'Nessun dato nel periodo selezionato.' }: { text?: string }) {
  return (
    <div className="empty">
      <EmptyArt />
      <p>{text}</p>
    </div>
  )
}
