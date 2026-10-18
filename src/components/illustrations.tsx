/* Illustrazioni e glifi in SVG, con la palette GS1, condivisi con l'app di scansione.
   Le classi `ga-*` sono i bersagli delle animazioni GSAP. */

const NAVY = '#002c6c'
const ORANGE = '#f26334'

function pattern(count: number, seed = 7) {
  const out: number[] = []
  let s = seed
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280
    out.push(1 + Math.floor((s / 233280) * 3))
  }
  return out
}

export function BarsGlyph({ x, y, w, h, color = NAVY, count = 14, seed }: { x: number; y: number; w: number; h: number; color?: string; count?: number; seed?: number }) {
  const widths = pattern(count, seed)
  const total = widths.reduce((a, b) => a + b * 2, 0)
  const unit = w / total
  const starts = widths.map((_, i) => x + widths.slice(0, i).reduce((a, b) => a + b * 2, 0) * unit)
  return <g fill={color}>{widths.map((bw, i) => <rect key={i} x={starts[i]} y={y} width={bw * unit} height={h} />)}</g>
}

function Modules({ x, y, size, cells, color = NAVY, seed = 3 }: { x: number; y: number; size: number; cells: number; color?: string; seed?: number }) {
  const unit = size / cells
  const rects = []
  let s = seed
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      s = (s * 9301 + 49297) % 233280
      const finder = c === 0 || r === cells - 1
      const timing = (r === 0 && c % 2 === 0) || (c === cells - 1 && r % 2 === 1)
      if (finder || timing || s / 233280 > 0.55) rects.push(<rect key={`${r}-${c}`} x={x + c * unit} y={y + r * unit} width={unit} height={unit} />)
    }
  }
  return <g fill={color}>{rects}</g>
}

function QrGlyph({ x, y, size, color = NAVY }: { x: number; y: number; size: number; color?: string }) {
  const u = size / 7
  const eye = (ex: number, ey: number) => (
    <g key={`${ex}-${ey}`}>
      <rect x={ex} y={ey} width={u * 3} height={u * 3} rx={u * 0.6} fill="none" stroke={color} strokeWidth={u * 0.8} />
      <rect x={ex + u} y={ey + u} width={u} height={u} fill={color} />
    </g>
  )
  return (
    <g>
      {eye(x, y)}
      {eye(x + u * 4, y)}
      {eye(x, y + u * 4)}
      <g fill={color}>
        <rect x={x + u * 4} y={y + u * 4} width={u} height={u} />
        <rect x={x + u * 6} y={y + u * 4} width={u} height={u} />
        <rect x={x + u * 5} y={y + u * 5} width={u} height={u} />
        <rect x={x + u * 4} y={y + u * 6} width={u} height={u} />
        <rect x={x + u * 6} y={y + u * 6} width={u} height={u} />
      </g>
    </g>
  )
}

import type { GlyphKind } from '../lib/symbology'

/** Glifo di una simbologia, per le schede dell'infografica. */
export function SymbologyGlyph({ kind, size = 44 }: { kind: GlyphKind; size?: number }) {
  return (
    <svg className="glyph" viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      {kind === 'ean' && <><BarsGlyph x={8} y={10} w={32} h={24} count={11} seed={4} /><rect x="8" y="37" width="32" height="3" rx="1.5" fill={ORANGE} /></>}
      {kind === 'gs1128' && <BarsGlyph x={4} y={16} w={40} h={16} count={18} seed={8} />}
      {kind === 'databar' && <><BarsGlyph x={8} y={11} w={32} h={11} count={10} seed={13} /><BarsGlyph x={8} y={26} w={32} h={11} count={10} seed={17} color={ORANGE} /></>}
      {kind === 'datamatrix' && <Modules x={10} y={10} size={28} cells={10} seed={6} />}
      {kind === 'qr' && <QrGlyph x={10} y={10} size={28} />}
      {kind === 'link' && (
        <g fill="none" stroke={NAVY} strokeWidth="3" strokeLinecap="round">
          <path d="M20 28l8-8" stroke={ORANGE} />
          <path d="M18 23l-4 4a6 6 0 0 0 8.5 8.5l4-4" />
          <path d="M30 25l4-4a6 6 0 0 0-8.5-8.5l-4 4" />
        </g>
      )}
      {kind === 'keyboard' && (
        <g fill="none" stroke={NAVY} strokeWidth="2.6" strokeLinecap="round">
          <rect x="6" y="13" width="36" height="22" rx="5" />
          <path d="M13 21h.1M19 21h.1M25 21h.1M31 21h.1M35 21h.1M15 28h18" stroke={ORANGE} />
        </g>
      )}
    </svg>
  )
}

/** Onde del logo GS1 attorno a un nucleo: illustrazione dell'intestazione. */
export function RippleArt() {
  return (
    <svg className="ripple-art" viewBox="0 0 320 260" aria-hidden="true">
      <defs>
        <radialGradient id="ra-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5f8fd6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#5f8fd6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ra-core" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e3ebf8" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="130" r="128" fill="url(#ra-glow)" />
      {[0, 1, 2, 3].map((i) => <circle key={i} className="ga-wave" cx="160" cy="130" r="54" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.5" />)}
      <g className="ga-core">
        <circle cx="160" cy="130" r="54" fill="url(#ra-core)" />
        <BarsGlyph x={136} y={112} w={48} h={36} count={11} seed={11} />
        <rect className="ga-scanline" x="128" y="128" width="64" height="3" rx="1.5" fill={ORANGE} />
      </g>
      <g className="ga-float-a">
        <rect x="236" y="34" width="54" height="54" rx="12" fill="#ffffff" />
        <QrGlyph x={245} y={43} size={36} />
      </g>
      <g className="ga-float-b">
        <rect x="30" y="54" width="46" height="46" rx="11" fill="#ffffff" />
        <Modules x={38} y={62} size={30} cells={10} seed={9} />
      </g>
      <g className="ga-float-c">
        <rect x="222" y="178" width="70" height="44" rx="11" fill={ORANGE} />
        <BarsGlyph x={232} y={188} w={50} h={24} count={10} seed={21} color="#ffffff" />
      </g>
      <g className="ga-float-b">
        <circle cx="64" cy="196" r="20" fill={ORANGE} />
        <path d="M55 196.5l6 6 12-12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

/** Scudo con spunta: brand protection senza allerte. */
export function ShieldArt({ alert = false }: { alert?: boolean }) {
  return (
    <svg className="shield-art" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="62" r="50" fill={alert ? '#fdecec' : '#e3ebf8'} />
      <g className="ga-float-a">
        <path d="M60 18l32 11v24c0 23-14 38-32 46-18-8-32-23-32-46V29z" fill={alert ? '#b42318' : NAVY} />
        <path d="M60 25l25 9v19c0 18-10 30-25 37z" fill={alert ? '#d03b3b' : '#1d4f9a'} />
        {alert ? (
          <g stroke="#fff" strokeWidth="6" strokeLinecap="round"><path d="M60 42v18" /><path d="M60 72v.5" /></g>
        ) : (
          <path d="M47 59l9 9 18-19" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </g>
      <g fill={ORANGE}>
        <path className="ga-spark" d="M101 24l2 5.5 5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2z" />
        <circle className="ga-spark" cx="18" cy="78" r="3.5" />
      </g>
    </svg>
  )
}

/** Stato vuoto: lente su un barcode. */
export function EmptyArt() {
  return (
    <svg className="empty-art" viewBox="0 0 120 96" aria-hidden="true">
      <rect x="14" y="20" width="70" height="50" rx="10" fill="#e8edf5" />
      <BarsGlyph x={26} y={32} w={46} h={26} count={11} seed={5} color="#b7c1d1" />
      <circle cx="82" cy="58" r="17" fill="#ffffff" stroke={NAVY} strokeWidth="5" />
      <path d="M94 70l12 12" stroke={NAVY} strokeWidth="6" strokeLinecap="round" />
      <circle cx="82" cy="58" r="5" fill={ORANGE} />
    </svg>
  )
}
