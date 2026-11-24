import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import SpeciesCard from '../components/SpeciesCard.jsx'
import FadeImage from '../components/FadeImage.jsx'
import { CLASSIFICATION_STYLES } from '../components/Classification.jsx'
import { butterflies, families } from '../data'
import { asset } from '../config.js'

/*
  Butterfly family — the same field-guide layout as the bee and butterfly pages.
  Name (above the photo on phones, beside it on desktop), photo, classification, about,
  field notes (species count, groups, sizes, flight season across the family), then every
  species in the family as Beedex cards, and previous / next family.
*/
const SERIF = '"Fraunces", Georgia, serif'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const CLASS_KEY = 'bee-classification-style' // same layout as chosen on the bee pages
// Spelling fixes for group names in the data
const GROUP_FIX = { Cresent: 'Crescent' }
const months = (a, b) => (a && b ? `${a.slice(0, 3)} – ${b.slice(0, 3)}` : null)

const SectionTitle = ({ children }) => (
  <h2 className="text-2xl text-brown" style={{ fontFamily: SERIF, fontWeight: 600 }}>{children}</h2>
)
const Label = ({ children }) => (
  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brown-soft/60">{children}</dt>
)
const Row = ({ label, children }) => (
  <div className="grid grid-cols-[110px_1fr] items-baseline py-1.5">
    <Label>{label}</Label>
    <dd className="text-brown">{children}</dd>
  </div>
)

export default function FamilyDetail() {
  const { name } = useParams()
  const i = families.findIndex((x) => x.name === name)
  const f = families[i]
  if (!f) {
    return (
      <div className="bleed min-h-dvh w-auto bg-[#fbf8f1] px-6 pt-16 text-center text-brown-soft">
        Family not found. <Link to="/beedex?tab=butterflies" className="font-semibold text-amber hover:underline">Back to the Beedex</Link>
      </div>
    )
  }
  let style = 'breadcrumb'
  try { const s = localStorage.getItem(CLASS_KEY); if (CLASSIFICATION_STYLES[s]) style = s } catch {}
  const ClassificationView = CLASSIFICATION_STYLES[style].Component

  const prev = families[(i - 1 + families.length) % families.length]
  const next = families[(i + 1) % families.length]
  const list = butterflies.filter((b) => b.family === f.name).sort((x, y) => x.species.localeCompare(y.species))

  // Groups (subfamilies) with how many species each, most first
  const groups = Object.entries(list.reduce((m, b) => (b.subfamily ? { ...m, [b.subfamily]: (m[b.subfamily] || 0) + 1 } : m), {}))
    .sort((a, b) => b[1] - a[1])
  const sizes = [...new Set(list.map((b) => b.wing_size).filter(Boolean))]
  const withTails = list.filter((b) => b.tails === 'Yes').length
  // Months when at least one species in the family flies, and how many
  const perMonth = MONTHS.map((_, k) => list.filter((b) => {
    const s = MONTHS.indexOf(b.active_start), e = MONTHS.indexOf(b.active_end)
    return s >= 0 && e >= 0 && k >= s && k <= e
  }).length)
  const most = Math.max(1, ...perMonth)

  const classification = [
    ['Order', 'Lepidoptera'],
    ['Family', f.name],
  ]

  return (
    <div className="bleed min-h-dvh w-auto bg-[#fbf8f1]">
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-8 md:px-10">
        <Link to={`/beedex?tab=butterflies&family=${f.name}`}
          className="inline-flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3.5 text-sm font-medium text-brown-soft transition hover:bg-[#e9dcc4]/60">
          <ArrowLeft size={16} /> Beedex
        </Link>

        {/* ---------- Name + photo + notes ---------- */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-0">
          {/* Name: above the photo on phones and tablets, beside it on desktop */}
          <div className="lg:col-start-2 lg:row-start-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">Lepidoptera · Butterfly family</p>
            <h1 className="mt-2 text-5xl italic leading-none text-brown md:text-6xl"
              style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>
              {f.name}
            </h1>
            <p className="mt-3 text-xl text-brown-soft">{f.subtitle}</p>
          </div>

          <figure className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <div className="overflow-hidden rounded-[28px] bg-brown/5 shadow-md ring-1 ring-brown/10">
              <FadeImage src={asset(f.image)} alt={f.subtitle} priority
                frameClassName="aspect-[4/5]" className="h-full w-full object-cover" />
            </div>
          </figure>

          <div className="-mt-4 lg:col-start-2 lg:row-start-2 lg:mt-0">
            {/* Classification */}
            <section className="mt-8">
              <SectionTitle>Classification</SectionTitle>
              <div className="mt-3"><ClassificationView items={classification} /></div>
            </section>

            {/* About */}
            <section className="mt-8">
              <SectionTitle>About</SectionTitle>
              <p className="mt-3 max-w-prose leading-relaxed text-brown-soft">{f.description}</p>
            </section>

            {/* Field notes */}
            <section className="mt-8">
              <SectionTitle>Field notes</SectionTitle>
              <dl className="mt-3 divide-y divide-brown/10 border-y border-brown/10">
                <Row label="In the Beedex">{list.length} species</Row>
                {groups.length > 0 && (
                  <div className="grid grid-cols-[110px_1fr] items-baseline py-2">
                    <Label>Groups</Label>
                    <dd className="flex flex-wrap gap-1.5">
                      {groups.map(([g, n]) => (
                        <span key={g} className="rounded-full bg-white px-2.5 py-0.5 text-sm text-brown ring-1 ring-brown/15">
                          {GROUP_FIX[g] || g} <span className="text-brown-soft/60">{n}</span>
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {sizes.length > 0 && <Row label="Size">{sizes.join(' and ')}</Row>}
                <Row label="Tails">{withTails ? `${withTails} of ${list.length} species` : 'None'}</Row>
                <div className="py-2.5">
                  <Label>Flight season</Label>
                  <p className="mt-1 text-sm text-brown-soft/70">Darker months have more species flying</p>
                  <div className="mt-2 grid grid-cols-12 gap-1" role="img" aria-label="Number of species flying each month">
                    {MONTHS.map((m, k) => {
                      const n = perMonth[k]
                      return (
                        <div key={m} className="text-center" title={`${m}: ${n} species`}>
                          <div className="h-5 rounded" style={{ background: n ? `rgba(163, 90, 0, ${0.25 + 0.75 * (n / most)})` : 'rgba(43, 29, 14, 0.07)' }} />
                          <span className={`mt-1 block text-[10px] ${n ? 'font-semibold text-brown' : 'text-brown-soft/50'}`}>{m[0]}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </dl>
            </section>
          </div>
        </div>

        {/* ---------- Species ---------- */}
        <section className="mt-14 border-t border-brown/10 pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">In this family</p>
          <h2 className="mt-1 flex items-baseline gap-3 text-4xl text-brown" style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Species <span className="font-sans text-base font-normal tracking-normal text-brown-soft/60">{list.length}</span>
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((b, n) => (
              <SpeciesCard key={b.id} variant="editorial" priority={n < 8} to={`/beedex/butterfly/${b.id}`} image={asset(b.butterfly_image_src[0])}
                title={b.species} subtitle={b.common_names[0]} meta={months(b.active_start, b.active_end)} />
            ))}
          </div>
        </section>

        {/* Previous / next family */}
        <nav className="mt-12 grid grid-cols-2 gap-3 border-t border-brown/10 pt-6" aria-label="More families">
          {[{ dir: 'Previous', x: prev, Icon: ArrowLeft }, { dir: 'Next', x: next, Icon: ArrowRight }].map(({ dir, x, Icon }) => (
            <Link key={dir} to={`/beedex/family/${x.name}`}
              className={`flex items-center gap-3 rounded-2xl p-3 transition hover:bg-[#e9dcc4]/50 ${dir === 'Next' ? 'flex-row-reverse text-right' : ''}`}>
              <Icon size={18} className="shrink-0 text-brown-soft/60" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brown-soft/60">{dir}</p>
                <p className="truncate italic text-brown" style={{ fontFamily: SERIF, fontWeight: 600 }}>{x.name}</p>
              </div>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
