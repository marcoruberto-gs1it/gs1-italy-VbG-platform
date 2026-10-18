/** Barra al 100% a segmenti, compatta: per la conformità nelle card in evidenza. */
export function MiniStack({ parts, label }: { parts: { value: number; color: string; title: string }[]; label: string }) {
  const visible = parts.filter((p) => p.value > 0)
  return (
    <div className="mini-stack" role="img" aria-label={label}>
      {visible.map((p) => <span key={p.title} style={{ flexGrow: p.value, background: p.color }} title={p.title} />)}
    </div>
  )
}
