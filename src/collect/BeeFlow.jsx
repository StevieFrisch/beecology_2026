import { useEffect } from 'react'
import { Check } from 'lucide-react'
import { DateLocationStep, CommentsStep, ReviewStep, prettyDate, today } from './SharedSteps.jsx'
import { bees, saveLog } from '../data'
import { asset } from '../config.js'
import { beePatterns } from '../data/beePatterns.js'
import { Credit } from './CaptureStep.jsx'
import { ObservationPhoto } from './Crop.jsx'
import BeeDiagram, { AbdomenDiagram, ThoraxDiagram, HeadDiagram } from '../components/BeeDiagram.jsx'

/*
  Abdomen choices are drawn from the checked species patterns in src/data/beePatterns.js
  (the original app's PNG drawings didn't all match real bees, and some bees had none).
  One tile per distinct pattern; bees that share a pattern share a tile. Ordered from mostly
  black to mostly yellow, then the unusual ones. value = the six colors joined, e.g. 'Y,B,B,B,B,B'.
*/
const ABDOMEN_ORDER = ['impatiens', 'bimaculatus', 'griseocollis', 'affinis', 'perplexus', 'rufocinctus', 'flavidus',
  'citrinus', 'terricola', 'pensylvanicus', 'insularis', 'ternarius', 'fervidus', 'borealis', 'ashtoni']
const abdomen = ABDOMEN_ORDER.map((rep) => {
  const colors = beePatterns[rep].abdomen
  const value = colors.join(',')
  return { value, colors, species: Object.keys(beePatterns).filter((k) => beePatterns[k].abdomen.join(',') === value) }
})
/*
  Thorax choices, the same way: one tile per distinct { base, mark, rear } in beePatterns.js.
  Mostly yellow first, then more black. value = 'base,mark,rear', e.g. 'Y,spot,Y'.
  (The original app's 9 thorax PNGs included shapes no New England species has.)
  Amber-gold (borealis) is grouped with yellow: the shade is hard to judge in a photo, and the
  abdomen step already tells borealis apart.
*/
const THORAX_ORDER = ['perplexus', 'bimaculatus', 'fervidus', 'terricola']
const shade = (c) => (c === 'A' ? 'Y' : c)
const thoraxKey = (t) => `${shade(t.base)},${t.mark},${shade(t.rear)}`
const thorax = THORAX_ORDER.map((rep) => {
  const t = beePatterns[rep].thorax
  const value = thoraxKey(t)
  return { value, thorax: t, species: Object.keys(beePatterns).filter((k) => thoraxKey(beePatterns[k].thorax) === value) }
})
/*
  Head choices: the hair on top of the head is either black or yellow (beePatterns.js head).
  (The original app's 3 head PNGs were a blank placeholder, black, and yellow on top.)
*/
const head = ['B', 'Y'].map((value) => ({
  value, head: value, species: Object.keys(beePatterns).filter((k) => beePatterns[k].head === value),
}))

const sample = 'https://inaturalist-open-data.s3.amazonaws.com/photos/195992266/large.jpg' // same as the sample bee photo

/*
  Ranking for the Species step (not shown to the viewer, only used for the order).
  Parts are weighed in order of how telling they are: abdomen first, then thorax, then head.
  Bees are sorted by abdomen match, then thorax match, then head match (then Beedex order), so
  matching the abdomen outranks matching both the thorax and head. A part marked "not sure" (or
  skipped) doesn't count either way.
  The best matches are the bees tied for first. If only one bee matches the abdomen, it's the
  best match on its own.
  Returns [{ bee, score, best }], best first (score = [abdomen, thorax, head] as 1/0).
*/
const rankBees = (d) => {
  const lists = [[abdomen, d.abdomen], [thorax, d.thorax], [head, d.head]]
    .map(([opts, v]) => opts.find((o) => o.value === v)?.species)
  const score = (s) => lists.map((l) => (l ? (l.includes(s) ? 1 : 0) : 0)) // [abdomen, thorax, head]
  const cmp = (x, y) => y.score[0] - x.score[0] || y.score[1] - x.score[1] || y.score[2] - x.score[2] || x.order - y.order
  const ranked = bees.map((bee, order) => ({ bee, order, score: score(bee.species) })).sort(cmp)
  const anyPicked = lists.some(Boolean)
  const top = ranked[0].score.join()
  return ranked.map((r) => ({ ...r, best: anyPicked && r.score.some(Boolean) && r.score.join() === top }))
}

/*
  Pattern steps (abdomen, thorax): your photo plus the pattern choices, sized to fill one screen.
  Phones: a small square photo beside the hint, then a grid of tiles.
  Desktop (lg+): "compare" — your photo and the chosen pattern side by side as two equal
  squares, with every pattern in one row below.
  Diagram draws one option; it's pinned inside its tile so the grid decides the tile size.
*/
function Art({ option, Diagram, inset = 'inset-2' }) {
  return (
    <div className={`absolute ${inset}`}>
      <Diagram option={option} />
    </div>
  )
}

function PatternTile({ o, n, on, onPick, Diagram, className = '', inset }) {
  return (
    <button type="button" role="radio" aria-checked={on} aria-label={`Pattern ${n + 1}`} onClick={onPick}
      className={`relative min-h-0 rounded-2xl transition ${
        on ? 'bg-[#e9dcc4] ring-2 ring-brown' : 'bg-white ring-1 ring-brown/15 hover:bg-[#e9dcc4]/40 hover:ring-brown/30'} ${className}`}>
      <Art option={o} Diagram={Diagram} inset={inset} />
      {on && (
        <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-brown text-honey">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
    </button>
  )
}

// The square, croppable observation photo with the sample photo's credit (if any)
const sampleCredit = (data, part) => {
  const src = data.parts?.photo?.src || (part && data.parts?.[part]?.src) || data.frames?.at(-1)
  return data.media?.credit && src === data.media.url ? data.media.credit : null
}

function Photo({ data, set, hint, part, className = '', caption = true, credit = true, creditPosition = 'right-2 top-2', cropHint = true, children }) {
  const showCredit = credit && sampleCredit(data, part)
  return (
    <ObservationPhoto data={data} set={set} fallback={sample} className={className} cropHint={cropHint} part={part}>
      {showCredit && <Credit credit={data.media.credit} position={creditPosition} />}
      {children}
      {caption && (
        <p className="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-2xl bg-cream/90 px-3 py-2 text-sm text-brown shadow-sm backdrop-blur">
          {hint}
        </p>
      )}
    </ObservationPhoto>
  )
}

function CompareStep({ data, set, field, label, options, Diagram, hint, phoneCols, deskCols, rowHeight = 'h-20 short:h-16' }) {
  const value = data[field]
  const tiles = (className, inset) => options.map((o, n) => (
    <PatternTile key={o.value} o={o} n={n} on={value === o.value} Diagram={Diagram} className={className} inset={inset}
      onPick={() => set({ [field]: value === o.value ? null : o.value })} />
  ))
  const chosen = options.find((o) => o.value === value)

  return (
    <>
      {/* Phones and tablets */}
      <div className="flex flex-1 flex-col gap-4 lg:hidden">
        <div className="flex items-center gap-4">
          <Photo data={data} set={set} part={field} caption={false} credit={false} className="size-28 shrink-0 sm:size-36" />
          <div className="text-sm text-brown-soft">
            <p>{hint} Tap the photo to adjust its crop.</p>
            {/* The square is too small for the credit badge, so it sits here */}
            {sampleCredit(data, field) && (
              <a href={sampleCredit(data, field).url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-brown-soft/60 underline-offset-2 hover:underline">
                Photo: {sampleCredit(data, field).by} · {sampleCredit(data, field).license}
              </a>
            )}
          </div>
        </div>
        {/* The tiles stretch to fill the rest of the screen (rows set by phoneCols) */}
        <div role="radiogroup" aria-label={label} className={`grid min-h-[220px] flex-1 gap-2 sm:gap-2.5 ${phoneCols}`}>
          {tiles('', 'inset-2')}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden flex-1 lg:flex">
        <div className="flex flex-1 flex-col gap-4">
          {/* Photo and chosen pattern as two equal squares, as large as the space allows */}
          <div className="grid min-h-[160px] flex-1 grid-cols-2 gap-4">
            <div className="flex items-center justify-end [container-type:size]">
              <Photo data={data} set={set} hint={hint} part={field} className="size-[min(100cqw,100cqh)]" />
            </div>
            <div className="flex items-center justify-start [container-type:size]">
              <div className="relative flex size-[min(100cqw,100cqh)] items-center justify-center rounded-3xl bg-white p-6 ring-1 ring-brown/10">
                {chosen
                  ? <Art option={chosen} Diagram={Diagram} inset="inset-6" />
                  : <p className="max-w-[16rem] text-center text-sm text-brown-soft/70">
                      {value === 'unsure' ? 'Marked as not sure. Pick a pattern below if you can tell after all.' : 'Pick the closest pattern below to compare it with your photo.'}
                    </p>}
              </div>
            </div>
          </div>
          <div role="radiogroup" aria-label={label} className={`grid shrink-0 gap-2 ${deskCols} ${rowHeight}`}>
            {tiles('', 'inset-1.5')}
          </div>
        </div>
      </div>
    </>
  )
}

const AbdomenOption = ({ option }) => <AbdomenDiagram abdomen={option.colors} />
const ThoraxOption = ({ option }) => <ThoraxDiagram thorax={option.thorax} />
const HeadOption = ({ option }) => <HeadDiagram head={option.head} />

/*
  Species step: a comparison of you and the selected bee (photo next to photo, your picks'
  diagram next to its diagram) beside a list of every bee, best match first. Each row shows the
  bee's photo, diagram and how many of your picks it matches. The top match is selected to
  start with; tap another bee to compare and choose it.
  The list scrolls inside its panel so the page itself stays one screen tall.
*/
function SpeciesRow({ bee, on, onPick }) {
  const pattern = beePatterns[bee.species]
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onPick}
      className={`flex w-full items-center gap-2.5 rounded-2xl p-2 pr-3 text-left transition ${
        on ? 'bg-[#e9dcc4] ring-2 ring-inset ring-brown' : 'hover:bg-[#e9dcc4]/40'}`}>
      <img src={asset(bee.image)} alt="" loading="lazy" className="size-12 shrink-0 rounded-xl object-cover" />
      <span className="grid h-16 w-8 shrink-0 place-items-center">
        <BeeDiagram pattern={pattern} className="h-full" title={`Bombus ${bee.species} color pattern`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-lg leading-tight text-brown" style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600, fontStyle: 'italic' }}>
          B. {bee.species}
        </span>
        <span className="mt-0.5 block truncate text-sm text-brown-soft/80">{bee.common_names[0]}</span>
      </span>
    </button>
  )
}

// Your bee as a diagram pattern, built from the abdomen/thorax/head picks.
// Parts marked "not sure" (or skipped) are drawn in pale grey.
const pickedPattern = (d) => {
  const a = abdomen.find((o) => o.value === d.abdomen)
  const t = thorax.find((o) => o.value === d.thorax)
  const h = head.find((o) => o.value === d.head)
  return {
    head: h ? h.head : 'U',
    thorax: t ? t.thorax : { base: 'U', mark: 'none', rear: 'U' },
    abdomen: a ? a.colors : ['U', 'U', 'U', 'U', 'U', 'U'],
  }
}

/*
  Side-by-side comparison of you and the selected candidate:
    your photo      | the candidate's Beedex photo
    your diagram    | the candidate's diagram
  Each cell is a square, as large as its space allows.
*/
function Comparison({ data, set, bee, compact = false }) {
  const label = (text, dark) => (
    <span className={`absolute left-2 top-2 z-10 max-w-[calc(100%-1rem)] truncate rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      dark ? 'bg-black/50 text-white backdrop-blur' : 'bg-[#e9dcc4] text-brown'}`}>{text}</span>
  )
  const cell = compact ? 'aspect-square w-full' : 'size-[min(100cqw,100cqh)]'
  // Photos sit at the bottom of their row and diagrams at the top, so the pairs stay together
  const wrap = (child, align) => (compact ? child : <div className={`flex min-h-0 justify-center [container-type:size] ${align}`}>{child}</div>)
  const name = bee ? `B. ${bee.species}` : 'Pick a bee'
  const yourPhoto = (cls, extra) => (
    <Photo data={data} set={set} caption={false} credit={!compact} creditPosition="bottom-2 right-2" cropHint={!compact} className={cls}>{extra}</Photo>
  )
  const theirPhoto = (cls, extra) => (
    <div className={`relative overflow-hidden rounded-3xl bg-brown/5 ring-1 ring-brown/10 ${cls}`}>
      {bee && <img src={asset(bee.image)} alt={`Bombus ${bee.species}`} className="absolute inset-0 size-full object-cover" />}
      {extra}
      {bee?.image_credit && !compact && (
        <a href={bee.image_source_url} target="_blank" rel="noreferrer"
          className="absolute bottom-2 right-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] text-white/90 backdrop-blur hover:bg-black/60">
          Photo: {bee.image_credit}
        </a>
      )}
    </div>
  )
  const diagram = (pattern, title, cls, extra) => (
    <div className={`relative grid place-items-center rounded-3xl bg-white ring-1 ring-brown/10 ${cls}`}>
      {extra}
      {pattern && <BeeDiagram pattern={pattern} className="h-[86%]" title={title} />}
    </div>
  )
  const yours = pickedPattern(data)
  const theirs = bee && beePatterns[bee.species]

  // Phones: one row — your photo + your picks, then the bee's photo + its diagram, captioned below
  if (compact) {
    const sq = 'aspect-square w-full rounded-2xl'
    return (
      <div className="grid grid-cols-2 gap-3">
        {[['Yours', yourPhoto(sq), diagram(yours, 'Your picks', sq)],
          [name, theirPhoto(sq), diagram(theirs, `${name} color pattern`, sq)]].map(([cap, p, dg]) => (
          <figure key={cap}>
            <div className="grid grid-cols-2 gap-1.5">{p}{dg}</div>
            <figcaption className="mt-1 truncate text-center text-xs font-semibold text-brown" style={{ fontStyle: cap === 'Yours' ? 'normal' : 'italic' }}>{cap}</figcaption>
          </figure>
        ))}
      </div>
    )
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3">
      {wrap(yourPhoto(cell, label('Yours', true)), 'items-end')}
      {wrap(theirPhoto(cell, label(name, true)), 'items-end')}
      {wrap(diagram(yours, 'Your picks', cell, label('Your picks')), 'items-start')}
      {wrap(diagram(theirs, `${name} color pattern`, cell, label(name)), 'items-start')}
    </div>
  )
}

function SpeciesStep({ data, set }) {
  const ranked = rankBees(data)
  const best = ranked.filter((r) => r.best)
  const rest = ranked.filter((r) => !r.best)

  // Select the best match — and keep following it when the patterns change (e.g. after going
  // back), unless the person has tapped a bee themselves (speciesPicked)
  const topSpecies = ranked[0].bee.species
  useEffect(() => {
    if (!data.speciesPicked && data.species !== topSpecies) set({ species: topSpecies })
  }, [topSpecies]) // eslint-disable-line react-hooks/exhaustive-deps

  const row = (r) => (
    <SpeciesRow key={r.bee.species} bee={r.bee} on={data.species === r.bee.species}
      onPick={() => set({ species: r.bee.species, speciesPicked: true })} />
  )
  const heading = (text) => (
    <p className="sticky top-0 z-10 bg-white/95 px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.15em] text-amber backdrop-blur">{text}</p>
  )
  const list = (
    <div role="radiogroup" aria-label="Species" className="absolute inset-0 overflow-y-auto overscroll-contain p-2">
      {best.length > 0 && <>{heading(best.length === 1 ? 'Best match' : 'Best matches')}{best.map(row)}</>}
      {heading(best.length ? 'Other bees' : 'All bees')}
      {rest.map(row)}
    </div>
  )
  const panel = 'relative overflow-hidden rounded-3xl bg-white ring-1 ring-brown/10'
  const selected = bees.find((b) => b.species === data.species)

  return (
    <>
      {/* Phones and tablets: the comparison as one row of four small squares, list below */}
      <div className="flex flex-1 flex-col gap-3 lg:hidden">
        <Comparison data={data} set={set} bee={selected} compact />
        <div className={`min-h-[200px] flex-1 ${panel}`}>{list}</div>
      </div>

      {/* Desktop: the 2 × 2 comparison on the left, the list on the right */}
      <div className="hidden min-h-[260px] flex-1 grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 lg:grid">
        <Comparison data={data} set={set} bee={selected} />
        <div className={panel}>{list}</div>
      </div>
    </>
  )
}

// A part's pick for the summary: its small diagram and pattern number, or "Not sure"
function PickCell({ options, value, Diagram }) {
  const chosen = options.find((o) => o.value === value)
  if (value === 'unsure') return <span className="text-brown-soft/70">Not sure</span>
  if (!chosen) return null
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative inline-block h-8 w-8"><Art option={chosen} Diagram={Diagram} inset="inset-0" /></span>
      Pattern {options.indexOf(chosen) + 1}
    </span>
  )
}

function BeeReview({ data, set, goTo }) {
  const bee = bees.find((b) => b.species === data.species)
  return (
    <ReviewStep data={data} set={set} goTo={goTo}
      heading={{
        title: bee ? `Bombus ${bee.species}` : 'No species chosen',
        subtitle: bee?.common_names[0],
        italic: !!bee,
        step: 'Species',
        aside: bee && (
          <span className="grid h-16 w-8 shrink-0 place-items-center">
            <BeeDiagram pattern={beePatterns[bee.species]} className="h-full" title={`Bombus ${bee.species} color pattern`} />
          </span>
        ),
      }}
      sections={[
        { title: 'Patterns', step: 'Abdomen Pattern', rows: [
          ['Abdomen', <PickCell options={abdomen} value={data.abdomen} Diagram={AbdomenOption} />],
          ['Thorax', <PickCell options={thorax} value={data.thorax} Diagram={ThoraxOption} />],
          ['Head', <PickCell options={head} value={data.head} Diagram={HeadOption} />],
        ] },
        { title: 'When and where', step: 'Date and Location', rows: [['Date', prettyDate(data.date)], ['Location', data.location]] },
        { title: 'Notes', step: 'Add Comments', rows: [['Doing', data.behavior], ['Sex', data.gender], ['Notes', data.comments]] },
      ]} />
  )
}

// Bee steps after Capture (Capture is shared, see CollectFlow.jsx)
export const beeSteps = [
  { title: 'Abdomen Pattern', valid: (d) => d.abdomen, unsure: 'abdomen',
    render: (p) => <CompareStep {...p} field="abdomen" label="Abdomen pattern" options={abdomen} Diagram={AbdomenOption}
      hint="Match the color bands on the back half of the bee." phoneCols="grid-cols-5 grid-rows-3" deskCols="grid-cols-8 grid-rows-2" rowHeight="h-40 short:h-32" /> },
  { title: 'Thorax Pattern', valid: (d) => d.thorax, unsure: 'thorax',
    render: (p) => <CompareStep {...p} field="thorax" label="Thorax pattern" options={thorax} Diagram={ThoraxOption}
      hint="Look at the fuzzy middle section between the wings." phoneCols="grid-cols-2 grid-rows-2" deskCols="grid-cols-4"
      rowHeight="h-28 short:h-20" /> },
  { title: 'Head Pattern', valid: (d) => d.head, unsure: 'head',
    render: (p) => <CompareStep {...p} field="head" label="Head pattern" options={head} Diagram={HeadOption}
      hint="Check the color of the hair on top of the head, just behind the eyes." phoneCols="grid-cols-1 grid-rows-2" deskCols="mx-auto w-1/2 grid-cols-2"
      rowHeight="h-28 short:h-20" /> },
  { title: 'Species', valid: (d) => d.species, render: (p) => <SpeciesStep {...p} /> },
  { title: 'Date and Location', valid: (d) => d.date, render: (p) => <DateLocationStep {...p} /> },
  { title: 'Add Comments', render: (p) => <CommentsStep {...p} showGender behaviors={['Collecting nectar', 'Collecting pollen', 'Both', 'Unknown']} /> },
  { title: 'Complete Log', render: (p) => <BeeReview {...p} /> },
]

export const saveBee = (d) => saveLog({ type: 'bee', species: d.species && `Bombus ${d.species}`,
  date: d.date, location: d.location || '—', loc: d.loc, behavior: d.behavior, sex: d.gender, notes: d.comments, image: d.frames?.at(-1) })
