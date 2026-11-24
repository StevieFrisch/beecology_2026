import { ChevronRight } from 'lucide-react'

/*
  Genus → Subgenus → Species, in several layouts.
  CLASSIFICATION EXPERIMENT — pick one, then delete the other variants and the picker.
  items: [[rank, value], …] — values are scientific names (set in italic serif).
*/
const SERIF = '"Fraunces", Georgia, serif'
const sci = { fontFamily: SERIF, fontWeight: 600, fontStyle: 'italic' }
const Rank = ({ children, className = '' }) => (
  <span className={`block text-[11px] font-semibold uppercase tracking-[0.14em] text-brown-soft/60 ${className}`}>{children}</span>
)

// 1. Breadcrumb: rank labels above names, chevrons between
function Breadcrumb({ items }) {
  return (
    <div className="flex flex-wrap items-end gap-x-2 gap-y-3 border-y border-brown/10 py-3">
      {items.map(([rank, value], i) => (
        <div key={rank} className="flex items-end gap-2">
          {i > 0 && <ChevronRight size={18} className="mb-1 text-brown-soft/40" />}
          <div>
            <Rank>{rank}</Rank>
            <span className="text-lg text-brown" style={sci}>{value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// 2. Columns: three equal columns separated by thin vertical rules
function Columns({ items }) {
  return (
    <div className="grid grid-cols-3 divide-x divide-brown/10 border-y border-brown/10">
      {items.map(([rank, value]) => (
        <div key={rank} className="px-3 py-3 first:pl-0">
          <Rank>{rank}</Rank>
          <span className="mt-0.5 block truncate text-lg text-brown" style={sci}>{value}</span>
        </div>
      ))}
    </div>
  )
}

// 3. Chips: tan pills joined by arrows, rank inside each pill
function Chips({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map(([rank, value], i) => (
        <div key={rank} className="flex items-center gap-2">
          {i > 0 && <span className="text-brown-soft/40">→</span>}
          <span className="inline-flex items-baseline gap-2 rounded-full bg-[#e9dcc4] px-3.5 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brown-soft/70">{rank}</span>
            <span className="text-brown" style={sci}>{value}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

// 4. Line: a horizontal rule with nodes; ranks above, names below (like a cladogram axis)
function Line({ items }) {
  return (
    <div className="grid grid-cols-3">
      {items.map(([rank, value], i) => (
        <div key={rank} className="relative">
          <Rank>{rank}</Rank>
          <div className="relative my-2 h-3">
            <span className={`absolute top-1/2 h-px -translate-y-1/2 bg-brown/25 ${i === 0 ? 'left-1.5' : 'left-0'} ${i === items.length - 1 ? 'right-auto w-1.5' : 'right-0'}`} />
            <span className={`absolute left-0 top-1/2 size-3 -translate-y-1/2 rounded-full ring-2 ring-[#fbf8f1] ${i === items.length - 1 ? 'bg-amber' : 'bg-brown'}`} />
          </div>
          <span className="block truncate pr-2 text-lg text-brown" style={sci}>{value}</span>
        </div>
      ))}
    </div>
  )
}

// 5. Nested: one line of names, each rank smaller and lighter until the species (scientific-name style)
function Nested({ items }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-brown/10">
      <p className="flex flex-wrap items-baseline gap-x-2 text-brown">
        {items.map(([rank, value], i) => (
          <span key={rank} className="inline-flex items-baseline gap-2">
            {i > 0 && <span className="text-brown-soft/30">/</span>}
            <span className={i === items.length - 1 ? 'text-xl' : 'text-base text-brown-soft'} style={sci}>{value}</span>
          </span>
        ))}
      </p>
      <p className="mt-1 flex flex-wrap gap-x-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brown-soft/50">
        {items.map(([rank]) => rank).join('  ·  ')}
      </p>
    </div>
  )
}

// 6. Original vertical table, for comparison
function Table({ items }) {
  return (
    <dl className="divide-y divide-brown/10 border-y border-brown/10">
      {items.map(([rank, value]) => (
        <div key={rank} className="grid grid-cols-[110px_1fr] items-baseline py-1.5">
          <dt><Rank>{rank}</Rank></dt>
          <dd className="text-brown" style={sci}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export const CLASSIFICATION_STYLES = {
  breadcrumb: { label: 'Breadcrumb', Component: Breadcrumb },
  columns: { label: 'Columns', Component: Columns },
  chips: { label: 'Chips', Component: Chips },
  line: { label: 'Line', Component: Line },
  nested: { label: 'One line', Component: Nested },
  table: { label: 'Vertical (current)', Component: Table },
}
