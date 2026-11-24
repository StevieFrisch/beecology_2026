import { useId } from 'react'
import { PATTERN_COLORS } from '../data/beePatterns.js'

/*
  Schematic top-down bumble bee colored by a pattern from src/data/beePatterns.js.
  labeled: adds leader-line labels (Head, Thorax, T1–T6) on the right.
  Small (unlabeled) versions are used for look-alike comparisons.
*/
const INK = '#2a2118'
// 'U' (not sure) is drawn with diagonal hatching so it can't be mistaken for white/pale (W)
const fillOf = (c, uid) => (c === 'U' && uid ? `url(#hatch-${uid})` : PATTERN_COLORS[c]?.fill || PATTERN_COLORS.B.fill)

// Hatch pattern for 'U'; every diagram SVG includes one in its <defs>
function Hatch({ uid }) {
  return (
    <pattern id={`hatch-${uid}`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="5" height="5" fill={PATTERN_COLORS.U.fill} />
      <line x1="0" y1="0" x2="0" y2="5" stroke="#b5a990" strokeWidth="1.6" />
    </pattern>
  )
}

// Body geometry (viewBox units)
const CX = 100
const HEAD = { cy: 42, rx: 20, ry: 16 }
const THORAX = { cy: 96, rx: 36, ry: 34 } // y 62–130
const ABD = { cy: 197, rx: 44, ry: 66, top: 131, bottom: 263 }
const SEG_H = (ABD.bottom - ABD.top) / 6

/*
  Head seen from above: black, with a yellow patch on top (the vertex, between and behind the
  eyes, next to the thorax) when head is 'Y'. Eyes are drawn on the sides.
*/
function Head({ head, uid }) {
  return (
    <g>
      <defs><clipPath id={`hd-${uid}`}><ellipse cx={CX} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} /></clipPath></defs>
      {/* 'U' = not sure: the whole head pale grey */}
      <ellipse cx={CX} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} fill={fillOf(head === 'U' ? 'U' : 'B', uid)} />
      {head === 'Y' && (
        <ellipse cx={CX} cy={HEAD.cy + 7} rx={11} ry={9} fill={fillOf('Y', uid)} clipPath={`url(#hd-${uid})`} />
      )}
      <ellipse cx={CX - HEAD.rx + 3} cy={HEAD.cy - 1} rx={5} ry={9} fill="#0f0b07" clipPath={`url(#hd-${uid})`} />
      <ellipse cx={CX + HEAD.rx - 3} cy={HEAD.cy - 1} rx={5} ry={9} fill="#0f0b07" clipPath={`url(#hd-${uid})`} />
      <ellipse cx={CX} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} fill="none" stroke={INK} strokeOpacity=".55" strokeWidth="1.5" />
    </g>
  )
}

export default function BeeDiagram({ pattern, labeled = false, className = '', title }) {
  const uid = useId().replace(/:/g, '')
  if (!pattern) return null
  const { head, thorax, abdomen } = pattern
  const segY = (i) => ABD.top + i * SEG_H

  return (
    <svg
      viewBox={labeled ? '20 0 220 272' : '50 0 100 272'}
      className={className}
      role="img"
      aria-label={title || 'Schematic bee color pattern'}
    >
      <defs>
        <Hatch uid={uid} />
        <clipPath id={`thx-${uid}`}><ellipse cx={CX} cy={THORAX.cy} rx={THORAX.rx} ry={THORAX.ry} /></clipPath>
        <clipPath id={`abd-${uid}`}><ellipse cx={CX} cy={ABD.cy} rx={ABD.rx} ry={ABD.ry} /></clipPath>
      </defs>

      {/* Antennae */}
      <path d={`M${CX - 7} 30 Q ${CX - 14} 14 ${CX - 22} 6`} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d={`M${CX + 7} 30 Q ${CX + 14} 14 ${CX + 22} 6`} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />

      {/* Wings (behind the abdomen so its pattern stays visible) */}
      <ellipse cx={CX - 44} cy={128} rx={34} ry={13} transform={`rotate(-28 ${CX - 44} 128)`} fill="#ffffff" fillOpacity=".6" stroke={INK} strokeOpacity=".25" />
      <ellipse cx={CX + 44} cy={128} rx={34} ry={13} transform={`rotate(28 ${CX + 44} 128)`} fill="#ffffff" fillOpacity=".6" stroke={INK} strokeOpacity=".25" />

      {/* Abdomen: six segments T1–T6 */}
      <g clipPath={`url(#abd-${uid})`}>
        {abdomen.map((c, i) => {
          const [side, middle] = c.split('/')
          return (
            <g key={i}>
              <rect x={CX - ABD.rx} y={segY(i)} width={ABD.rx * 2} height={SEG_H + 0.5} fill={fillOf(side, uid)} />
              {middle && <rect x={CX - 18} y={segY(i)} width={36} height={SEG_H + 0.5} rx="6" fill={fillOf(middle, uid)} />}
            </g>
          )
        })}
        {abdomen.slice(1).map((_, i) => (
          <line key={i} x1={CX - ABD.rx} x2={CX + ABD.rx} y1={segY(i + 1)} y2={segY(i + 1)} stroke={INK} strokeOpacity=".22" strokeWidth="1.2" />
        ))}
      </g>
      <ellipse cx={CX} cy={ABD.cy} rx={ABD.rx} ry={ABD.ry} fill="none" stroke={INK} strokeOpacity=".55" strokeWidth="1.5" />

      {/* Thorax: base color, black spot or band between the wings, rear (scutellum) */}
      <g clipPath={`url(#thx-${uid})`}>
        <rect x={CX - THORAX.rx} y={THORAX.cy - THORAX.ry} width={THORAX.rx * 2} height={THORAX.ry * 2} fill={fillOf(thorax.base, uid)} />
        {thorax.mark === 'band' && <rect x={CX - THORAX.rx} y={THORAX.cy - 9} width={THORAX.rx * 2} height={22} fill={fillOf('B', uid)} />}
        <rect x={CX - THORAX.rx} y={THORAX.cy + 16} width={THORAX.rx * 2} height={THORAX.ry} fill={fillOf(thorax.rear, uid)} />
        {thorax.mark === 'spot' && <ellipse cx={CX} cy={THORAX.cy + 1} rx={12} ry={10} fill={fillOf('B', uid)} />}
      </g>
      <ellipse cx={CX} cy={THORAX.cy} rx={THORAX.rx} ry={THORAX.ry} fill="none" stroke={INK} strokeOpacity=".55" strokeWidth="1.5" />

      {/* Head */}
      <Head head={head} uid={uid} />

      {/* Labels */}
      {labeled && (
        <g fontFamily="system-ui, -apple-system, sans-serif" fontSize="9.5" fill="#3d2a12">
          {[
            { y: HEAD.cy, from: CX + HEAD.rx, text: 'Head' },
            { y: THORAX.cy, from: CX + THORAX.rx, text: 'Thorax' },
            ...abdomen.map((_, i) => ({
              y: segY(i) + SEG_H / 2,
              // right edge of the abdomen ellipse at this height
              from: CX + ABD.rx * Math.sqrt(Math.max(0, 1 - ((segY(i) + SEG_H / 2 - ABD.cy) / ABD.ry) ** 2)),
              text: `T${i + 1}`,
            })),
          ].map((l) => (
            <g key={l.text}>
              <line x1={l.from + 3} x2={196} y1={l.y} y2={l.y} stroke="#3d2a12" strokeOpacity=".3" strokeWidth=".8" strokeDasharray="2 2" />
              <text x={200} y={l.y + 3.3} fontWeight={l.text.startsWith('T') ? 500 : 600}>{l.text}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}

/* Color swatches for the colors a pattern uses */
/*
  Just the abdomen (T1–T6), for picking a pattern in the collect flow: an egg-shaped abdomen
  tapering to a point, with six curved segments. `abdomen` is a six-color list from
  beePatterns.js ('side/middle' paints a patch in the middle of that segment). Fills its box.
  A faint, uncolored thorax and wing tips peek in at the top, so it reads as the back half
  of a bee (and which end is which) without suggesting thorax colors.
*/
const ABDO_OUTLINE = 'M50 3 C 79 3 95 24 95 50 C 95 84 72 110 50 129 C 28 110 5 84 5 50 C 5 24 21 3 50 3 Z'
const ABDO_TOP = 3
const ABDO_SEG = 20.5 // height of each segment; segment lines bow down by ABDO_BOW
const ABDO_BOW = 9
const bandPath = (i) => {
  const y1 = i === 0 ? -20 : ABDO_TOP + i * ABDO_SEG
  const y2 = i === 5 ? 160 : ABDO_TOP + (i + 1) * ABDO_SEG
  return `M0 ${y1} Q50 ${y1 + ABDO_BOW * 2} 100 ${y1} L100 ${y2} Q50 ${y2 + ABDO_BOW * 2} 0 ${y2} Z`
}

export function AbdomenDiagram({ abdomen, className = 'size-full', title }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg viewBox="-6 -36 112 168" preserveAspectRatio="xMidYMid meet" className={className} role="img" aria-label={title || 'Abdomen color pattern'}>
      <defs>
        <Hatch uid={uid} />
        <clipPath id={`abdo-${uid}`}><path d={ABDO_OUTLINE} /></clipPath>
        <clipPath id={`mid-${uid}`}><rect x="31" y="-20" width="38" height="180" rx="10" /></clipPath>
        {/* Fades the ghosted thorax and wings out toward the top */}
        <linearGradient id={`fade-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="-36" x2="0" y2="6">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id={`ghost-${uid}`} maskUnits="userSpaceOnUse" x="-10" y="-40" width="120" height="180">
          <rect x="-10" y="-40" width="120" height="180" fill={`url(#fade-${uid})`} />
        </mask>
      </defs>
      {/* Hint of the rest of the bee: wing tips and the back of the thorax, ghosted */}
      <g mask={`url(#ghost-${uid})`} fill={INK} fillOpacity=".05" stroke={INK} strokeOpacity=".25" strokeWidth="1.2">
        <ellipse cx="8" cy="10" rx="30" ry="11" transform="rotate(-32 8 10)" />
        <ellipse cx="92" cy="10" rx="30" ry="11" transform="rotate(32 92 10)" />
        <ellipse cx="50" cy="-14" rx="31" ry="21" />
      </g>
      <g clipPath={`url(#abdo-${uid})`}>
        {abdomen.map((c, i) => {
          const [side, middle] = c.split('/')
          return (
            <g key={i}>
              <path d={bandPath(i)} fill={fillOf(side, uid)} />
              {middle && <path d={bandPath(i)} fill={fillOf(middle, uid)} clipPath={`url(#mid-${uid})`} />}
            </g>
          )
        })}
        {/* Segment lines */}
        {abdomen.slice(1).map((_, i) => {
          const y = ABDO_TOP + (i + 1) * ABDO_SEG
          return <path key={i} d={`M0 ${y} Q50 ${y + ABDO_BOW * 2} 100 ${y}`} fill="none" stroke={INK} strokeOpacity=".3" strokeWidth="1.3" />
        })}
      </g>
      <path d={ABDO_OUTLINE} fill="none" stroke={INK} strokeOpacity=".6" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

/*
  Just the thorax, for picking a thorax pattern in the collect flow: colored by `thorax`
  ({ base, mark, rear } from beePatterns.js), with the head, wings and top of the abdomen
  ghosted around it so it reads as the middle of a bee. Fills its box.
*/
export function ThoraxDiagram({ thorax, className = 'size-full', title }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg viewBox="8 8 184 170" preserveAspectRatio="xMidYMid meet" className={className} role="img" aria-label={title || 'Thorax color pattern'}>
      <defs>
        <Hatch uid={uid} />
        <clipPath id={`thxo-${uid}`}><ellipse cx={CX} cy={THORAX.cy} rx={THORAX.rx} ry={THORAX.ry} /></clipPath>
        {/* Fades the ghosted abdomen out toward the bottom */}
        <linearGradient id={`tfade-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="135" x2="0" y2="178">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`tghost-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
          <rect x="0" y="0" width="200" height="200" fill={`url(#tfade-${uid})`} />
        </mask>
      </defs>

      {/* Ghosted parts: antennae, head, wings, top of the abdomen */}
      <g fill={INK} fillOpacity=".05" stroke={INK} strokeOpacity=".25" strokeWidth="1.3">
        <path d={`M${CX - 7} 30 Q ${CX - 14} 14 ${CX - 22} 8`} fill="none" strokeLinecap="round" />
        <path d={`M${CX + 7} 30 Q ${CX + 14} 14 ${CX + 22} 8`} fill="none" strokeLinecap="round" />
        <ellipse cx={CX} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} />
        <g mask={`url(#tghost-${uid})`}>
          <ellipse cx={CX - 48} cy={124} rx={38} ry={14} transform={`rotate(-28 ${CX - 48} 124)`} />
          <ellipse cx={CX + 48} cy={124} rx={38} ry={14} transform={`rotate(28 ${CX + 48} 124)`} />
          <ellipse cx={CX} cy={ABD.cy} rx={ABD.rx} ry={ABD.ry} />
        </g>
      </g>

      {/* Thorax: base color, black spot or band between the wings, rear (scutellum) */}
      <g clipPath={`url(#thxo-${uid})`}>
        <rect x={CX - THORAX.rx} y={THORAX.cy - THORAX.ry} width={THORAX.rx * 2} height={THORAX.ry * 2} fill={fillOf(thorax.base, uid)} />
        {thorax.mark === 'band' && <rect x={CX - THORAX.rx} y={THORAX.cy - 9} width={THORAX.rx * 2} height={22} fill={fillOf('B', uid)} />}
        <rect x={CX - THORAX.rx} y={THORAX.cy + 16} width={THORAX.rx * 2} height={THORAX.ry} fill={fillOf(thorax.rear, uid)} />
        {thorax.mark === 'spot' && <ellipse cx={CX} cy={THORAX.cy + 1} rx={12} ry={10} fill={fillOf('B', uid)} />}
      </g>
      <ellipse cx={CX} cy={THORAX.cy} rx={THORAX.rx} ry={THORAX.ry} fill="none" stroke={INK} strokeOpacity=".6" strokeWidth="1.6" />
    </svg>
  )
}

/*
  Just the head, for picking a head pattern in the collect flow: colored by `head` ('B' or 'Y'),
  with the antennae drawn and the thorax and wings ghosted below so it reads as the front of a
  bee. Fills its box.
*/
export function HeadDiagram({ head, className = 'size-full', title }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg viewBox="58 0 84 92" preserveAspectRatio="xMidYMid meet" className={className} role="img" aria-label={title || 'Head color pattern'}>
      <defs>
        <Hatch uid={uid} />
        <linearGradient id={`hfade-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="62" x2="0" y2="92">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`hghost-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
          <rect x="0" y="0" width="200" height="200" fill={`url(#hfade-${uid})`} />
        </mask>
      </defs>
      {/* Ghosted thorax and wings */}
      <g mask={`url(#hghost-${uid})`} fill={INK} fillOpacity=".05" stroke={INK} strokeOpacity=".25" strokeWidth="1.3">
        <ellipse cx={CX - 44} cy={118} rx={34} ry={13} transform={`rotate(-28 ${CX - 44} 118)`} />
        <ellipse cx={CX + 44} cy={118} rx={34} ry={13} transform={`rotate(28 ${CX + 44} 118)`} />
        <ellipse cx={CX} cy={THORAX.cy} rx={THORAX.rx} ry={THORAX.ry} />
      </g>
      {/* Antennae */}
      <path d={`M${CX - 7} 30 Q ${CX - 14} 14 ${CX - 22} 6`} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d={`M${CX + 7} 30 Q ${CX + 14} 14 ${CX + 22} 6`} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <Head head={head} uid={uid} />
    </svg>
  )
}

export function PatternLegend({ pattern }) {
  if (!pattern) return null
  // Yellow and black are self-explanatory; only the other colors get a key
  const used = new Set([pattern.head, pattern.thorax.base, pattern.thorax.rear,
    ...(pattern.thorax.mark !== 'none' ? ['B'] : []), ...pattern.abdomen.flatMap((c) => c.split('/'))])
  if (![...used].some((k) => k !== 'Y' && k !== 'B')) return null
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
      {Object.entries(PATTERN_COLORS).filter(([k]) => used.has(k) && k !== 'Y' && k !== 'B').map(([k, v]) => (
        <li key={k} className="flex items-center gap-1.5 text-xs text-brown-soft">
          <span className="size-3 rounded-full ring-1 ring-brown/20" style={{ background: v.fill }} /> {v.label}
        </li>
      ))}
    </ul>
  )
}
