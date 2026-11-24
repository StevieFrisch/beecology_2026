import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, ChevronDown } from 'lucide-react'
import SpeciesCard from '../components/SpeciesCard.jsx'
import { bees, butterflies, families } from '../data'
import { asset } from '../config.js'

// Original grid (still used by the family detail page): centered, 24px gap, 1 → 4 columns.
export const gridCls = 'mx-auto grid justify-items-center gap-6 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'

const SERIF = '"Fraunces", Georgia, serif'

// "April" + "October" → "Apr – Oct"
const months = (a, b) => (a && b ? `${a.slice(0, 3)} – ${b.slice(0, 3)}` : null)

const COLLAPSE_KEY = 'beedex-collapsed-families'

// The first cards on screen (two rows on desktop) load right away at high priority;
// the rest load lazily as they near the screen.
const PRIORITY_CARDS = 8

// Editorial cards: 2 → 3 → 4 columns, generous row spacing for the captions.
const cardGrid = 'grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4'

export default function Beedex() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'bees'
  const family = params.get('family') // butterflies: null = all families
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()

  // Butterflies: families the user has collapsed (remembered in this browser).
  // While searching, every family with matches is shown open so results aren't hidden.
  const [collapsed, setCollapsed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(COLLAPSE_KEY)) || []) } catch { return new Set() }
  })
  const saveCollapsed = (next) => {
    setCollapsed(next)
    try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...next])) } catch {}
  }
  const toggleFamily = (name) => {
    const next = new Set(collapsed)
    next.has(name) ? next.delete(name) : next.add(name)
    saveCollapsed(next)
  }
  const isOpen = (name) => !!term || !collapsed.has(name)
  const match = (s) => !term || s.some((x) => x?.toLowerCase().includes(term))

  const beeList = useMemo(() => bees.filter((b) => match([b.species, `bombus ${b.species}`, ...b.common_names])), [term])

  // Butterflies: every species, grouped by family (in the families' order), A–Z by Latin name
  // (the card title) within each.
  // Search matches species names and family names; the chips narrow to one family.
  const groups = useMemo(
    () =>
      families
        .filter((f) => !family || f.name === family)
        .map((f) => ({
          ...f,
          species: butterflies
            .filter((b) => b.family === f.name && match([b.species, ...b.common_names, f.name, f.subtitle]))
            .sort((x, y) => x.species.localeCompare(y.species)),
        }))
        .filter((g) => g.species.length),
    [term, family]
  )

  // Butterflies: the first PRIORITY_CARDS species across the open families, in display order
  const priorityIds = new Set(
    groups.filter((g) => isOpen(g.name)).flatMap((g) => g.species).slice(0, PRIORITY_CARDS).map((b) => b.id)
  )

  const select = (t) => setParams(t === 'bees' ? {} : { tab: t })
  const pickFamily = (f) => setParams(f ? { tab, family: f } : { tab })
  const card = { variant: 'editorial' }

  const count = tab === 'bees' ? beeList.length : groups.reduce((n, g) => n + g.species.length, 0)

  return (
    <div className="bleed min-h-dvh w-auto bg-[#fbf8f1]">
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-10 md:px-10">
        {/* Page header */}
        <header className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">Field guide</p>
            <h1 className="mt-2 text-5xl leading-none text-brown md:text-6xl"
              style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>
              The <span className="italic text-amber">Bee</span>dex
            </h1>
          </div>
          <Toggle tab={tab} select={select} />
        </header>

        {/* Search */}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-brown/10 pt-6">
          <label className="flex h-11 w-full max-w-md items-center gap-2 rounded-full bg-white px-4 text-sm text-brown shadow-sm ring-1 ring-brown/10 focus-within:ring-2 focus-within:ring-amber/40">
            <Search size={16} className="text-brown-soft/60" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={tab === 'bees' ? 'Search bees by name' : 'Search butterflies or families'}
              className="h-full w-full bg-transparent outline-none placeholder:text-brown-soft/50" />
          </label>
          <span className="ml-auto text-sm text-brown-soft/70">{count} species</span>
        </div>

        {/* Butterflies: family filter chips — "All" plus one per family, with species counts */}
        {tab === 'butterflies' && (
          <div className="mt-4 flex flex-wrap gap-2">
            {[{ name: null, label: 'All families', n: butterflies.length },
              ...families.map((f) => ({ name: f.name, label: f.name, n: butterflies.filter((b) => b.family === f.name).length }))].map((c) => {
              const on = (family || null) === c.name
              return (
                <button key={c.label} onClick={() => pickFamily(c.name)} aria-pressed={on}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                    on ? 'bg-brown font-semibold text-honey shadow-sm' : 'bg-white text-brown-soft ring-1 ring-brown/10 hover:bg-[#e9dcc4]/60'}`}>
                  {c.label}
                  <span className={`rounded-full px-1.5 text-xs ${on ? 'bg-white/15' : 'bg-brown/5'}`}>{c.n}</span>
                </button>
              )
            })}
            {groups.length > 1 && !term && (
              <button
                onClick={() => saveCollapsed(groups.every((g) => collapsed.has(g.name)) ? new Set() : new Set(families.map((f) => f.name)))}
                className="ml-auto rounded-full px-3 py-2 text-sm font-medium text-amber hover:bg-[#e9dcc4]/60">
                {groups.every((g) => collapsed.has(g.name)) ? 'Expand all' : 'Collapse all'}
              </button>
            )}
          </div>
        )}

        {/* Bees */}
        {tab === 'bees' && (
          <div className={`mt-8 grid ${cardGrid}`}>
            {beeList.map((b, n) => (
              <SpeciesCard key={b.id} {...card} priority={n < PRIORITY_CARDS} to={`/beedex/bee/${b.species}`} image={asset(b.image)}
                title={`Bombus ${b.species}`} subtitle={b.common_names[0]} meta={months(b.active_start, b.active_end)} />
            ))}
          </div>
        )}

        {/* Butterflies: one section per family */}
        {tab === 'butterflies' &&
          groups.map((g) => {
            const open = isOpen(g.name)
            return (
              <section key={g.name} className={open ? 'mt-12' : 'mt-6'}>
                <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-brown/10 pb-3 ${open ? 'mb-6' : ''}`}>
                  {/* The whole title area toggles the section. Hover highlight: the title sits 8px from the top and bottom
                      edges, 8px left (the chevron's own blank space adds ~3px) and 12px right, so it looks even. */}
                  <button onClick={() => toggleFamily(g.name)} aria-expanded={open} aria-controls={`family-${g.name}`}
                    className="group -ml-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-2xl pb-[9px] pl-2 pr-3 pt-[11px] text-left hover:bg-[#e9dcc4]/40">
                    <ChevronDown size={22}
                      className={`self-center text-brown-soft/70 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
                    <h2 className="text-3xl leading-none text-brown" style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.01em' }}>
                      {g.name}
                    </h2>
                    <span className="text-brown-soft/80">{g.subtitle}</span>
                    <span className="text-sm text-brown-soft/60">· {g.species.length} species</span>
                  </button>
                  <Link to={`/beedex/family/${g.name}`} className="ml-auto text-sm font-medium text-amber hover:underline">
                    About this family →
                  </Link>
                </div>
                {open && (
                  <div id={`family-${g.name}`} className={`grid ${cardGrid}`}>
                    {g.species.map((b) => (
                      <SpeciesCard key={b.id} {...card} priority={priorityIds.has(b.id)} to={`/beedex/butterfly/${b.id}`} image={asset(b.butterfly_image_src[0])}
                        title={b.species} subtitle={b.common_names[0]} meta={months(b.active_start, b.active_end)} />
                    ))}
                  </div>
                )}
              </section>
            )
          })}

        {count === 0 && (
          <p className="mt-10 text-center text-brown-soft/70">Nothing matches “{q}”.</p>
        )}
      </div>
    </div>
  )
}

/* Bees / Butterflies toggle — same scheme as the family chips:
   white track with a faint brown ring; selected option is dark brown with honey text
   (semibold), the other is brown-soft text with a tan hover. A bit larger than the chips
   since it switches the whole page. */
const OPTIONS = [
  { key: 'bees', label: 'Bees' },
  { key: 'butterflies', label: 'Butterflies' },
]

function Toggle({ tab, select }) {
  return (
    <div className="flex shrink-0 gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-brown/10" role="tablist">
      {OPTIONS.map((o) => {
        const on = tab === o.key
        return (
          <button key={o.key} onClick={() => select(o.key)} role="tab" aria-selected={on}
            className={`rounded-full px-6 py-2 text-base transition ${
              on ? 'bg-brown font-semibold text-honey shadow-sm' : 'text-brown-soft hover:bg-[#e9dcc4]/60'}`}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
