import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { bees } from '../data'
import { beePatterns } from '../data/beePatterns.js'
import BeeDiagram, { PatternLegend } from '../components/BeeDiagram.jsx'
import { CLASSIFICATION_STYLES } from '../components/Classification.jsx'
import FadeImage from '../components/FadeImage.jsx'
import { asset } from '../config.js'

/*
  Bee detail — field-guide style.
  Photo + credit, Latin name, taxonomic classification, field notes (tongue, life history,
  flight season), then "Field marks": a labeled schematic of the typical color pattern next
  to the written description, and look-alikes shown with their own schematics for comparison.
*/
const SERIF = '"Fraunces", Georgia, serif'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

// Small edit distance so look-alike names with typos in the data (e.g. "greseocollis") still link
function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}
const findBee = (name) =>
  bees.find((b) => b.species === name) || bees.find((b) => distance(b.species, name.toLowerCase()) <= 2)

const SectionTitle = ({ children }) => (
  <h2 className="text-2xl text-brown" style={{ fontFamily: SERIF, fontWeight: 600 }}>{children}</h2>
)
const Label = ({ children }) => (
  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brown-soft/60">{children}</dt>
)

const CLASS_KEY = 'bee-classification-style'
const loadClass = () => { try { return localStorage.getItem(CLASS_KEY) } catch { return null } }

export default function BeeDetail() {
  // Classification layout experiment (temporary picker at the bottom right)
  const [classStyle, setClassStyle] = useState(() => (CLASSIFICATION_STYLES[loadClass()] ? loadClass() : 'breadcrumb'))
  const chooseClass = (k) => { setClassStyle(k); try { localStorage.setItem(CLASS_KEY, k) } catch {} }
  const ClassificationView = CLASSIFICATION_STYLES[classStyle].Component

  const { species } = useParams()
  const i = bees.findIndex((x) => x.species === species)
  const b = bees[i]
  if (!b) {
    return (
      <div className="bleed min-h-dvh w-auto bg-[#fbf8f1] px-6 pt-16 text-center text-brown-soft">
        Species not found. <Link to="/beedex" className="font-semibold text-amber hover:underline">Back to the Beedex</Link>
      </div>
    )
  }
  const prev = bees[(i - 1 + bees.length) % bees.length]
  const next = bees[(i + 1) % bees.length]
  const pattern = beePatterns[b.species]

  const start = MONTHS.indexOf(b.active_start)
  const end = MONTHS.indexOf(b.active_end)
  const hasSeason = start >= 0 && end >= 0
  const lookalikes = (b.confused_with || []).map((n) => ({ name: n, bee: findBee(n) }))

  const classification = [
    ['Genus', 'Bombus', true],
    ['Subgenus', cap(b.subgenus), true],
    ['Species', `B. ${b.species}`, true],
  ]

  return (
    <div className="bleed min-h-dvh w-auto bg-[#fbf8f1]">
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-8 md:px-10">
        <Link to="/beedex"
          className="inline-flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3.5 text-sm font-medium text-brown-soft transition hover:bg-[#e9dcc4]/60">
          <ArrowLeft size={16} /> Beedex
        </Link>

        {/* ---------- Photo + identity ---------- */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-0">
          {/* Name: above the photo on phones and tablets, beside it on desktop */}
          <div className="lg:col-start-2 lg:row-start-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">Hymenoptera · Apidae</p>
            <h1 className="mt-2 text-5xl italic leading-none text-brown md:text-6xl"
              style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>
              Bombus {b.species}
            </h1>
            <p className="mt-3 text-xl text-brown-soft">
              {b.common_names[0]}
              {b.cuckoo && <span className="ml-2 rounded-full bg-[#e9dcc4] px-2.5 py-0.5 align-middle text-xs font-semibold text-brown">Cuckoo</span>}
            </p>
          </div>

          <figure className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <div className="overflow-hidden rounded-[28px] bg-brown/5 shadow-md ring-1 ring-brown/10">
              <FadeImage src={asset(b.image)} alt={`Bombus ${b.species}`} priority
                frameClassName="aspect-[4/5]" className="h-full w-full object-cover" />
            </div>
            {b.image_credit && (
              <figcaption className="mt-2.5 text-xs text-brown-soft/70">
                Photo by {b.image_credit} via iNaturalist ·{' '}
                <a className="font-medium text-amber hover:underline" target="_blank" rel="noreferrer" href={b.image_license_url}>{b.image_license}</a>
                {b.image_source_url && (
                  <> · <a className="font-medium text-amber hover:underline" target="_blank" rel="noreferrer" href={b.image_source_url}>Original</a></>
                )}
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
                <div className="grid grid-cols-[110px_1fr] items-baseline py-1.5">
                  <Label>Tongue</Label>
                  <dd className="text-brown">{b.tongue_length ? cap(b.tongue_length) : 'Not recorded'}</dd>
                </div>
                <div className="grid grid-cols-[110px_1fr] items-baseline py-1.5">
                  <Label>Life history</Label>
                  <dd className="text-brown">
                    {b.cuckoo
                      ? 'Social parasite: no worker caste; females lay eggs in the nests of other Bombus species'
                      : 'Social: a queen founds an annual colony of workers'}
                  </dd>
                </div>
                <div className="py-2.5">
                  <Label>Flight season</Label>
                  {!hasSeason && <p className="mt-1 text-sm text-brown-soft/70">Not recorded</p>}
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

        {/* ---------- Field marks: diagram + description ---------- */}
        <section className="mt-14 border-t border-brown/10 pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">Identification</p>
          <h2 className="mt-1 text-4xl text-brown" style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.01em' }}>Field marks</h2>

          <div className="mt-6 grid items-center gap-8 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-brown/10 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:p-8">
            <div className="mx-auto w-full max-w-[340px]">
              <BeeDiagram pattern={pattern} labeled className="w-full" title={`Color pattern of Bombus ${b.species}`} />
            </div>
            <div>
              <p className="inline-block whitespace-nowrap rounded-full bg-[#e9dcc4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-brown sm:text-sm sm:tracking-[0.12em]">
                Typical {b.cuckoo ? 'female' : 'worker'} · dorsal view
              </p>
              <ol className="mt-3 space-y-2 text-brown">
                {pattern && (
                  <>
                    <li><span className="font-semibold">Thorax:</span>{' '}
                      {pattern.thorax.mark === 'spot' ? 'black spot between the wings' : pattern.thorax.mark === 'band' ? 'black band between the wings' : 'no black mark between the wings'}
                      {pattern.thorax.rear === 'B' ? '; black at the rear' : ''}.</li>
                    <li><span className="font-semibold">Abdomen:</span> {describeAbdomen(pattern.abdomen)}.</li>
                  </>
                )}
              </ol>
              <p className="mt-4 max-w-prose leading-relaxed text-brown-soft">{b.description}</p>
              <div className="mt-5"><PatternLegend pattern={pattern} /></div>
            </div>
          </div>
        </section>

        {/* ---------- Look-alikes, compared side by side ---------- */}
        {lookalikes.length > 0 && (
          <section className="mt-12">
            <SectionTitle>Compare with look-alikes</SectionTitle>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {/* This species first, for reference */}
              <div className="rounded-2xl bg-[#e9dcc4]/50 p-4 ring-1 ring-brown/15">
                <BeeDiagram pattern={pattern} className="mx-auto h-36" title={`Bombus ${b.species}`} />
                <p className="mt-3 text-center italic text-brown" style={{ fontFamily: SERIF, fontWeight: 600 }}>B. {b.species}</p>
                <p className="text-center text-xs text-brown-soft/70">This species</p>
              </div>
              {lookalikes.map(({ name, bee }) =>
                bee ? (
                  <Link key={name} to={`/beedex/bee/${bee.species}`}
                    className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brown/10 transition hover:ring-brown/30">
                    <BeeDiagram pattern={beePatterns[bee.species]} className="mx-auto h-36" title={`Bombus ${bee.species}`} />
                    <p className="mt-3 text-center italic text-brown group-hover:text-amber" style={{ fontFamily: SERIF, fontWeight: 600 }}>B. {bee.species}</p>
                    <p className="truncate text-center text-xs text-brown-soft/70">{bee.common_names[0]}</p>
                  </Link>
                ) : (
                  <div key={name} className="grid place-items-center rounded-2xl bg-white p-4 text-brown-soft ring-1 ring-brown/10">B. {name}</div>
                )
              )}
            </div>
          </section>
        )}

        {/* Previous / next */}
        <nav className="mt-12 grid grid-cols-2 gap-3 border-t border-brown/10 pt-6" aria-label="More bees">
          {[{ dir: 'Previous', bee: prev, Icon: ArrowLeft }, { dir: 'Next', bee: next, Icon: ArrowRight }].map(({ dir, bee, Icon }) => (
            <Link key={dir} to={`/beedex/bee/${bee.species}`}
              className={`flex items-center gap-3 rounded-2xl p-3 transition hover:bg-[#e9dcc4]/50 ${dir === 'Next' ? 'flex-row-reverse text-right' : ''}`}>
              <Icon size={18} className="shrink-0 text-brown-soft/60" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brown-soft/60">{dir}</p>
                <p className="truncate italic text-brown" style={{ fontFamily: SERIF, fontWeight: 600 }}>Bombus {bee.species}</p>
              </div>
            </Link>
          ))}
        </nav>
      </div>

      {/* Classification layout picker — remove once a layout is chosen */}
      <div className="fixed bottom-4 right-4 z-50 hidden max-w-[260px] flex-wrap gap-1 rounded-2xl bg-white/90 p-1 text-sm shadow-lg ring-1 ring-black/5 backdrop-blur lg:flex">
        <span className="w-full px-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted">Classification</span>
        {Object.entries(CLASSIFICATION_STYLES).map(([k, v]) => (
          <button key={k} onClick={() => chooseClass(k)}
            className={`rounded-full px-3 py-1 ${classStyle === k ? 'bg-ink text-white' : 'hover:bg-black/5'}`}>
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ['Y','Y/O','B','B','B','B'] → "T1 yellow; T2 orange in the middle, yellow at the sides; T3–T6 black"
function describeAbdomen(segs) {
  const word = { Y: 'yellow', A: 'amber-gold', O: 'orange', W: 'white', B: 'black' }
  const label = (c) => {
    const [side, mid] = c.split('/')
    return mid ? `${word[mid]} in the middle, ${word[side]} at the sides` : word[side]
  }
  const runs = []
  segs.forEach((c, i) => {
    const r = runs.at(-1)
    r && r.c === c ? (r.to = i + 1) : runs.push({ c, from: i + 1, to: i + 1 })
  })
  return runs.map((r) => `${r.from === r.to ? `T${r.from}` : `T${r.from}–T${r.to}`} ${label(r.c)}`).join('; ')
}
