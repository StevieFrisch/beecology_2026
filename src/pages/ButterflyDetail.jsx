import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { butterflies, families, licenseLabel } from '../data'
import { CLASSIFICATION_STYLES } from '../components/Classification.jsx'
import FadeImage from '../components/FadeImage.jsx'
import { asset } from '../config.js'

/*
  Butterfly detail — the same field-guide layout as the bee page.
  Photo + credit, Latin name, classification, field notes (size, wings, antennae, flight season),
  then "Field marks": upperside and underside colors and patterns, then similar butterflies from
  the same group, and previous / next in Beedex order.
*/
const SERIF = '"Fraunces", Georgia, serif'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const CLASS_KEY = 'bee-classification-style' // same layout as chosen on the bee pages

// Swatch colors for the color names in the data
const SWATCH = {
  Orange: '#e48a2b', Black: '#221a14', Brown: '#7a5230', White: '#faf7ef', Copper: '#b8693a', Grey: '#9b9b98',
  Purple: '#7d5ba6', Blue: '#4f7fd1', Yellow: '#f0c93f', Red: '#c0392b', Green: '#5d8a3a',
}
// A couple of entries in the data are two names run together ("BrownYellow", "Black Red")
const colorList = (arr = []) => [...new Set(arr.flatMap((c) => c.match(/[A-Z][a-z]+/g) || []))]
const PATTERN_FIX = { Camoflauge: 'Camouflage' }

// Beedex order: by family (the Beedex's order), then A–Z by Latin name
const ORDERED = families.flatMap((f) =>
  butterflies.filter((b) => b.family === f.name).sort((x, y) => x.species.localeCompare(y.species)))

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

// One side of the wings: color swatches + pattern chips
function WingSide({ title, primary, secondary, patterns }) {
  const main = colorList(primary)
  const accent = colorList(secondary).filter((c) => !main.includes(c))
  const marks = (patterns || []).map((p) => PATTERN_FIX[p] || p)
  return (
    <div className="rounded-2xl bg-[#fbf8f1] p-5 ring-1 ring-brown/10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brown-soft/70">{title}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {[...main.map((c) => [c, false]), ...accent.map((c) => [c, true])].map(([c, isAccent]) => (
          <span key={c} className="flex items-center gap-2 text-sm text-brown">
            <span className="size-6 rounded-full ring-1 ring-brown/20" style={{ background: SWATCH[c] || '#ccc' }} />
            {c}{isAccent && <span className="text-xs text-brown-soft/60">accent</span>}
          </span>
        ))}
        {!main.length && !accent.length && <span className="text-sm text-brown-soft/70">Colors not recorded</span>}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {marks.length
          ? marks.map((m) => <span key={m} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-brown ring-1 ring-brown/15">{m}</span>)
          : <span className="text-sm text-brown-soft/70">No distinct pattern</span>}
      </div>
    </div>
  )
}

export default function ButterflyDetail() {
  const { id } = useParams()
  const i = ORDERED.findIndex((x) => x.id === id)
  const b = ORDERED[i]
  if (!b) {
    return (
      <div className="bleed min-h-dvh w-auto bg-[#fbf8f1] px-6 pt-16 text-center text-brown-soft">
        Species not found. <Link to="/beedex?tab=butterflies" className="font-semibold text-amber hover:underline">Back to the Beedex</Link>
      </div>
    )
  }
  let style = 'breadcrumb'
  try { const s = localStorage.getItem(CLASS_KEY); if (CLASSIFICATION_STYLES[s]) style = s } catch {}
  const ClassificationView = CLASSIFICATION_STYLES[style].Component

  const prev = ORDERED[(i - 1 + ORDERED.length) % ORDERED.length]
  const next = ORDERED[(i + 1) % ORDERED.length]
  const family = families.find((f) => f.name === b.family)
  const [genus] = b.species.split(' ')

  const start = MONTHS.indexOf(b.active_start)
  const end = MONTHS.indexOf(b.active_end)
  const hasSeason = start >= 0 && end >= 0
  const yearRound = start === 0 && end === 11

  const owner = b.butterfly_image_own?.[0]
  const license = b.butterfly_image_url?.[0]
  const hasDescription = b.description && !/no description/i.test(b.description)

  // Similar: same group (subfamily) first, then the rest of the family
  const similar = [
    ...ORDERED.filter((x) => x.id !== b.id && x.family === b.family && x.subfamily === b.subfamily),
    ...ORDERED.filter((x) => x.id !== b.id && x.family === b.family && x.subfamily !== b.subfamily),
  ].slice(0, 4)

  const classification = [
    ['Family', b.family],
    ['Genus', genus],
    ['Species', b.species],
  ]

  return (
    <div className="bleed min-h-dvh w-auto bg-[#fbf8f1]">
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-8 md:px-10">
        <Link to="/beedex?tab=butterflies"
          className="inline-flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3.5 text-sm font-medium text-brown-soft transition hover:bg-[#e9dcc4]/60">
          <ArrowLeft size={16} /> Beedex
        </Link>

        {/* ---------- Photo + identity ---------- */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-0">
          {/* Name: above the photo on phones and tablets, beside it on desktop */}
          <div className="lg:col-start-2 lg:row-start-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">Lepidoptera · {b.family}</p>
            <h1 className="mt-2 text-5xl italic leading-none text-brown md:text-6xl"
              style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>
              {b.species}
            </h1>
            <p className="mt-3 text-xl text-brown-soft">{b.common_names[0]}</p>
          </div>

          <figure className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <div className="overflow-hidden rounded-[28px] bg-brown/5 shadow-md ring-1 ring-brown/10">
              <FadeImage src={asset(b.butterfly_image_src[0])} alt={b.common_names[0]} priority
                frameClassName="aspect-[4/5]" className="h-full w-full object-cover" />
            </div>
            {owner && (
              <figcaption className="mt-2.5 text-xs text-brown-soft/70">
                Photo by {owner} ·{' '}
                <a className="font-medium text-amber hover:underline" target="_blank" rel="noreferrer" href={license}>{licenseLabel(license)}</a>
              </figcaption>
            )}
          </figure>

          <div className="-mt-4 lg:col-start-2 lg:row-start-2 lg:mt-0">
            {/* Classification */}
            <section className="mt-8">
              <SectionTitle>Classification</SectionTitle>
              <div className="mt-3"><ClassificationView items={classification} /></div>
            </section>

            {/* Field notes */}
            <section className="mt-8">
              <SectionTitle>Field notes</SectionTitle>
              <dl className="mt-3 divide-y divide-brown/10 border-y border-brown/10">
                {family && <Row label="Family">{family.subtitle.replace(/^The /, '')}</Row>}
                {b.subfamily && <Row label="Group">{b.subfamily === 'Cresent' ? 'Crescent' : b.subfamily}</Row>}
                <Row label="Size">{b.wing_size || 'Not recorded'}</Row>
                <Row label="Wings">{b.wing_shape ? `${b.wing_shape} shape` : 'Not recorded'}{b.tails === 'Yes' ? ', with tails' : b.tails === 'No' ? ', no tails' : ''}</Row>
                <Row label="Antennae">{b.antennae ? b.antennae[0].toUpperCase() + b.antennae.slice(1) : 'Not recorded'}</Row>
                <div className="py-2.5">
                  <Label>Flight season</Label>
                  {!hasSeason && <p className="mt-1 text-sm text-brown-soft/70">Not recorded</p>}
                  {yearRound && <p className="mt-1 text-sm text-brown-soft/70">Recorded all year</p>}
                  <div className="mt-2 grid grid-cols-12 gap-1" role="img"
                    aria-label={hasSeason ? `Active from ${b.active_start} to ${b.active_end}` : 'Flight season not recorded'}>
                    {MONTHS.map((m, k) => {
                      const on = hasSeason && k >= start && k <= end
                      return (
                        <div key={m} className="text-center">
                          <div className={`h-5 rounded ${on ? 'bg-amber' : 'bg-brown/[0.07]'}`} />
                          <span className={`mt-1 block text-[10px] ${on ? 'font-semibold text-brown' : 'text-brown-soft/50'}`}>{m[0]}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </dl>
            </section>
          </div>
        </div>

        {/* ---------- Field marks: upperside / underside ---------- */}
        <section className="mt-14 border-t border-brown/10 pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">Identification</p>
          <h2 className="mt-1 text-4xl text-brown" style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.01em' }}>Field marks</h2>

          <div className="mt-6 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-brown/10 md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <WingSide title="Upperside · wings open" primary={b.dorsalPrimaryColor} secondary={b.dorsalSecondaryColor} patterns={b.dorsalPattern} />
              <WingSide title="Underside · wings closed" primary={b.ventralPrimaryColor} secondary={b.ventralSecondaryColor} patterns={b.ventralPattern} />
            </div>
            {hasDescription && <p className="mt-6 max-w-prose leading-relaxed text-brown-soft">{b.description}</p>}
            {family && <p className="mt-6 max-w-prose leading-relaxed text-brown-soft"><span className="font-semibold text-brown">{family.subtitle}.</span> {family.description}</p>}
          </div>
        </section>

        {/* ---------- Similar butterflies ---------- */}
        {similar.length > 0 && (
          <section className="mt-12">
            <div className="flex items-baseline justify-between gap-4">
              <SectionTitle>Similar butterflies</SectionTitle>
              <Link to={`/beedex/family/${b.family}`} className="shrink-0 text-sm font-medium text-amber hover:underline">See all</Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {similar.map((x) => (
                <Link key={x.id} to={`/beedex/butterfly/${x.id}`}
                  className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-brown/10 transition hover:ring-brown/30">
                  <div className="aspect-square overflow-hidden bg-brown/5">
                    <img src={asset(x.butterfly_image_src[0])} alt="" loading="lazy" className="size-full object-cover transition group-hover:scale-[1.03]" />
                  </div>
                  <div className="p-3">
                    <p className="truncate italic text-brown group-hover:text-amber" style={{ fontFamily: SERIF, fontWeight: 600 }}>{x.species}</p>
                    <p className="truncate text-xs text-brown-soft/70">{x.common_names[0]}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Previous / next */}
        <nav className="mt-12 grid grid-cols-2 gap-3 border-t border-brown/10 pt-6" aria-label="More butterflies">
          {[{ dir: 'Previous', x: prev, Icon: ArrowLeft }, { dir: 'Next', x: next, Icon: ArrowRight }].map(({ dir, x, Icon }) => (
            <Link key={dir} to={`/beedex/butterfly/${x.id}`}
              className={`flex items-center gap-3 rounded-2xl p-3 transition hover:bg-[#e9dcc4]/50 ${dir === 'Next' ? 'flex-row-reverse text-right' : ''}`}>
              <Icon size={18} className="shrink-0 text-brown-soft/60" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brown-soft/60">{dir}</p>
                <p className="truncate italic text-brown" style={{ fontFamily: SERIF, fontWeight: 600 }}>{x.species}</p>
              </div>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
