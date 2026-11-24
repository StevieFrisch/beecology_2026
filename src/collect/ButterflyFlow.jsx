import { useMemo, useState } from 'react'
import { Search, Check, ChevronDown, ScanSearch } from 'lucide-react'
import { ObservationPhoto, mainCapture, cropToDataURL } from './Crop.jsx'
import FadeImage from '../components/FadeImage.jsx'
import { DateLocationStep, CommentsStep, ReviewStep, prettyDate, today } from './SharedSteps.jsx'
import { butterflies, families, saveLog } from '../data'
import { asset } from '../config.js'

const uniq = (k) => [...new Set(butterflies.flatMap((b) => [].concat(b[k])))].filter(Boolean).sort()
const NOT_PRESENT = '__none__'
const SERIF = '"Fraunces", Georgia, serif'
const byName = [...butterflies].sort((a, b) => a.common_names[0].localeCompare(b.common_names[0]))
const COLORS = uniq('dorsalPrimaryColor').filter((c) => !/[a-z][A-Z]/.test(c)) // skip combined values like "BrownYellow"

/*
  On-device matching (see matchWorker.js): one shared worker; each request resolves with the
  closest butterflies, reporting download/compare progress along the way.
*/
let matchWorker = null
function findMatches(image, onUpdate) {
  matchWorker ??= new Worker(new URL('./matchWorker.js', import.meta.url), { type: 'module' })
  return new Promise((resolve, reject) => {
    matchWorker.onmessage = ({ data: m }) => {
      if (m.type === 'result') resolve(m.matches)
      else if (m.type === 'error') reject(new Error(m.message))
      else onUpdate(m)
    }
    matchWorker.postMessage({ image, count: 6 })
  })
}

/*
  Identify Your Butterfly — image first.
  Desktop: on the left, your wings photo with the selected butterfly's photo and details beneath;
  on the right (the wider side), a scrolling grid of large butterfly photos with search and filters.
  Phones: your photo and the selection in a short row, then the photo grid (2 across) below.
  "Not in this list" records that the butterfly isn't one of these species.
  "Find close matches" compares the wings photo (as cropped) with every butterfly's reference
  photo on the device and shows the closest six at the top. Saved in data.matches, tied to the
  photo and crop it was run on (data.matchesFor), so it's redone if either changes.
*/
function ButterflyIdStep({ data, set }) {
  const capture = mainCapture(data)
  const photoKey = `${capture.src?.slice(-64)}|${JSON.stringify(capture.crop || {})}`
  const matches = data.matchesFor === photoKey ? data.matches : null
  const [job, setJob] = useState({ state: 'idle' }) // idle | loading (pct) | comparing | error
  const runMatch = async () => {
    setJob({ state: 'loading', pct: 0 })
    try {
      const image = await cropToDataURL(capture.src, capture.crop).catch(() => capture.src)
      const found = await findMatches(image, (m) => {
        if (m.type === 'progress' && m.total) setJob({ state: 'loading', pct: Math.round((m.loaded / m.total) * 100) })
        if (m.type === 'status' && m.text.startsWith('Comparing')) setJob({ state: 'comparing' })
      })
      set({ matches: found, matchesFor: photoKey })
      setJob({ state: 'idle' })
    } catch (e) {
      setJob({ state: 'error', message: e.message })
    }
  }

  const [q, setQ] = useState('')
  const [f, setF] = useState({ family: '', size: '', color: '', tails: false })
  const pick = (species) => set({ species })
  const selected = butterflies.find((b) => b.species === data.species)
  const filtersOn = f.family || f.size || f.color || f.tails

  const term = q.trim().toLowerCase()
  const list = useMemo(() => byName.filter((b) =>
    (!term || b.common_names[0].toLowerCase().includes(term) || b.species.toLowerCase().includes(term)) &&
    (!f.family || b.family === f.family) &&
    (!f.size || b.wing_size === f.size) &&
    (!f.color || b.dorsalPrimaryColor.includes(f.color)) &&
    (!f.tails || b.tails === 'Yes')
  ), [term, f])

  // One large photo card per butterfly
  const card = (b) => {
    const on = data.species === b.species
    return (
      <button key={b.species} type="button" role="radio" aria-checked={on} onClick={() => pick(b.species)}
        className={`group relative overflow-hidden rounded-2xl text-left transition ${
          on ? 'bg-[#e9dcc4] ring-2 ring-inset ring-brown' : 'bg-[#fbf8f1] ring-1 ring-inset ring-brown/10 hover:bg-[#e9dcc4]/50'}`}>
        <div className="p-1.5 pb-0">
          <FadeImage src={asset(b.butterfly_image_src[0])} frameClassName="aspect-[4/3] rounded-xl bg-brown/5"
            className="size-full object-cover group-hover:scale-[1.03]" />
        </div>
        <div className="px-2.5 pb-2 pt-1.5">
          <p className="truncate text-sm leading-tight text-brown" style={{ fontFamily: SERIF, fontWeight: 600 }}>{b.common_names[0]}</p>
          <p className="truncate text-xs italic text-brown-soft/70">{b.species}</p>
        </div>
        {on && (
          <span className="absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full bg-brown text-honey shadow">
            <Check size={14} strokeWidth={3} />
          </span>
        )}
      </button>
    )
  }

  // Filter pills: white, or dark brown with honey text when set
  const pill = (on) => `h-8 rounded-full px-3 text-xs font-medium outline-none ring-1 focus:ring-2 focus:ring-amber/50 ${
    on ? 'bg-brown text-honey ring-brown' : 'bg-white text-brown ring-brown/15'}`
  // Dropdown pills: the browser's own arrow is hidden (appearance-none) and replaced with the
  // site's chevron, so it looks the same in every browser and has even spacing
  const select = (key, label, opts) => (
    <span className="relative inline-flex">
      <select value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} aria-label={label}
        className={`${pill(!!f[key])} cursor-pointer appearance-none pr-7`}>
        <option value="">{label}</option>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} strokeWidth={2.25}
        className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${f[key] ? 'text-honey' : 'text-brown-soft/70'}`} />
    </span>
  )

  const gallery = (
    <div className="relative flex min-h-[260px] flex-1 flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-brown/10">
      {/* Search and filters */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-brown/10 p-3">
        <label className="flex h-8 min-w-[10rem] flex-1 items-center gap-2 rounded-full bg-[#fbf8f1] px-3 text-sm ring-1 ring-brown/10 focus-within:ring-2 focus-within:ring-amber/50">
          <Search size={14} className="shrink-0 text-brown-soft/60" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search butterflies"
            className="min-w-0 flex-1 bg-transparent text-brown outline-none placeholder:text-brown-soft/50" />
        </label>
        {select('family', 'Family', families.map((x) => x.name))}
        {select('size', 'Size', uniq('wing_size'))}
        {select('color', 'Color', COLORS)}
        <button type="button" onClick={() => setF({ ...f, tails: !f.tails })} aria-pressed={f.tails} className={pill(f.tails)}>Has tails</button>
        {filtersOn && (
          <button type="button" onClick={() => setF({ family: '', size: '', color: '', tails: false })}
            className="h-8 rounded-full px-2 text-xs font-medium text-amber hover:bg-[#e9dcc4]/60">Clear</button>
        )}
      </div>
      {/* The photo grid scrolls inside the panel */}
      <div className="relative flex-1">
        <div className="absolute inset-0 overflow-y-auto overscroll-contain p-3">
          {/* Closest matches to the photo (on-device) */}
          {matches ? (
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber">Closest to your photo</p>
                <button type="button" onClick={() => set({ matches: undefined, matchesFor: undefined })}
                  className="text-xs font-medium text-brown-soft/70 hover:text-brown">Hide</button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2 lg:gap-3">
                {matches.map((m) => butterflies.find((b) => b.species === m.species)).filter(Boolean).map(card)}
              </div>
              <p className="mt-2 px-1 text-xs text-brown-soft/60">Suggestions only: compare the wings carefully before choosing.</p>
            </div>
          ) : (
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-[#fbf8f1] p-3 ring-1 ring-brown/10">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e9dcc4] text-brown"><ScanSearch size={18} /></span>
              <div className="min-w-0 flex-1 text-sm">
                {job.state === 'loading' ? (
                  <>
                    <p className="font-semibold text-brown">Getting the matching model… {job.pct ? `${job.pct}%` : ''}</p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-brown/10">
                      <div className="h-full rounded-full bg-amber transition-all" style={{ width: `${job.pct || 2}%` }} />
                    </div>
                  </>
                ) : job.state === 'comparing' ? (
                  <p className="font-semibold text-brown">Comparing your photo…</p>
                ) : job.state === 'error' ? (
                  <p className="text-red-700">Couldn't run the matcher ({job.message}).</p>
                ) : (
                  <>
                    <p className="font-semibold text-brown">Find close matches</p>
                    <p className="text-xs text-brown-soft/70">Compares your photo on this device. The first time downloads about 90 MB.</p>
                  </>
                )}
              </div>
              {(job.state === 'idle' || job.state === 'error') && (
                <button type="button" onClick={runMatch} disabled={!capture.src}
                  className="h-9 shrink-0 rounded-full bg-brown px-4 text-xs font-semibold text-honey shadow-sm transition hover:brightness-125 disabled:opacity-40">
                  {job.state === 'error' ? 'Try again' : 'Find matches'}
                </button>
              )}
            </div>
          )}

          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.15em] text-amber">
            {filtersOn || term ? 'Matching' : 'All'} butterflies · {list.length}
          </p>
          <div role="radiogroup" aria-label="Butterfly species" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2 lg:gap-3">
            {list.map(card)}
            <button type="button" role="radio" aria-checked={data.species === NOT_PRESENT} onClick={() => pick(NOT_PRESENT)}
              className={`flex min-h-[8rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-3 text-center text-sm transition ${
                data.species === NOT_PRESENT ? 'border-brown bg-[#e9dcc4] font-semibold text-brown' : 'border-brown/20 text-brown-soft hover:bg-[#e9dcc4]/40'}`}>
              <span className="text-2xl leading-none">?</span>
              Not in this list
            </button>
          </div>
          {!list.length && <p className="px-1 py-3 text-sm text-brown-soft/60">No butterflies match. Try clearing a filter.</p>}
        </div>
      </div>
    </div>
  )

  const label = (text) => (
    <span className="absolute left-2 top-2 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">{text}</span>
  )
  const theirPhoto = (cls) => (
    <div className={`relative overflow-hidden bg-brown/5 ring-1 ring-brown/10 ${cls}`}>
      {selected
        ? <img src={asset(selected.butterfly_image_src[0])} alt={selected.common_names[0]} className="absolute inset-0 size-full object-cover" />
        : <p className="absolute inset-0 grid place-items-center p-2 text-center text-xs text-brown-soft/60">
            {data.species === NOT_PRESENT ? 'Not in this list' : 'Pick a butterfly'}
          </p>}
    </div>
  )
  const details = selected ? (
    <div className="min-w-0">
      <p className="truncate text-lg leading-tight text-brown" style={{ fontFamily: SERIF, fontWeight: 600 }}>{selected.common_names[0]}</p>
      <p className="truncate text-sm italic text-brown-soft/80">{selected.species}</p>
      <p className="mt-0.5 truncate text-xs text-brown-soft/70">
        {[selected.family, `${selected.wing_size.toLowerCase()} wings`, selected.dorsalPrimaryColor.join(', ').toLowerCase(), selected.tails === 'Yes' && 'tails'].filter(Boolean).join(' · ')}
      </p>
    </div>
  ) : (
    <p className="text-sm text-brown-soft/70">{data.species === NOT_PRESENT ? 'Marked as not in this list.' : 'Pick the closest match from the photos.'}</p>
  )

  return (
    <>
      {/* Phones and tablets */}
      <div className="flex flex-1 flex-col gap-3 lg:hidden">
        <div className="flex items-center gap-2">
          <ObservationPhoto data={data} set={set} className="size-16 shrink-0 rounded-2xl" cropHint={false} />
          {theirPhoto('size-16 shrink-0 rounded-2xl')}
          <div className="min-w-0 flex-1 pl-1">{details}</div>
        </div>
        {gallery}
      </div>

      {/* Desktop: your photo and the selection on the left, the photo grid (two-thirds, 2 large cards across) on the right */}
      <div className="hidden min-h-[300px] flex-1 grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 lg:grid">
        <div className="flex min-h-0 flex-col gap-3">
          <div className="flex min-h-0 flex-1 items-center justify-center [container-type:size]">
            <ObservationPhoto data={data} set={set} className="size-[min(100cqw,100cqh)]">{label('Yours')}</ObservationPhoto>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-2 ring-1 ring-brown/10">
            {theirPhoto('size-20 shrink-0 rounded-xl')}
            {details}
          </div>
        </div>
        {gallery}
      </div>
    </>
  )
}

const name = (s) => s === NOT_PRESENT ? 'Unknown' : butterflies.find((b) => b.species === s)?.common_names[0]

// Butterfly steps after Capture (Capture is shared, see CollectFlow.jsx)
export const butterflySteps = [
  { title: 'Identify Your Butterfly', valid: (d) => d.species, render: (p) => <ButterflyIdStep {...p} /> },
  { title: 'Date and Location', valid: (d) => d.date, render: (p) => <DateLocationStep {...p} /> },
  { title: 'Add Comments', render: (p) => <CommentsStep {...p} showGender behaviors={['Nectaring', 'Puddling', 'Basking', 'Flying', 'Mating', 'Other']} /> },
  { title: 'Complete Log', render: ({ data, set, goTo }) => {
      const known = data.species && data.species !== NOT_PRESENT
      return (
        <ReviewStep data={data} set={set} goTo={goTo}
          heading={{ title: known ? name(data.species) : data.species ? 'Species not listed' : 'No species chosen', subtitle: known ? data.species : undefined, step: 'Identify Your Butterfly' }}
          sections={[
            { title: 'When and where', step: 'Date and Location', rows: [['Date', prettyDate(data.date)], ['Location', data.location]] },
            { title: 'Notes', step: 'Add Comments', rows: [['Doing', data.behavior], ['Sex', data.gender], ['Notes', data.comments]] },
          ]} />
      )
    } },
]

export const saveButterfly = (d) => saveLog({ type: 'butterfly', species: name(d.species),
  date: d.date, location: d.location || '—', loc: d.loc, behavior: d.behavior, sex: d.gender, notes: d.comments, image: d.frames?.at(-1) })
