import { ObservationPhoto } from './Crop.jsx'
import { useState } from 'react'
import { MapPin, LocateFixed } from 'lucide-react'
import PinMap from './PinMap.jsx'

/*
  Date and Location: the date and a pin on a real map (see PinMap.jsx).
  Defaults come from the photo's metadata when it has any (set on the Capture step) — marked
  "From your photo" — otherwise today's date and no pin. "Use my location" asks the browser.
  data: date 'YYYY-MM-DD', loc { lat, lng }, location 'lat, lng' (for display),
        dateSource / locSource: 'photo' | 'device' | 'pin' | undefined
*/
const fieldCls = 'mt-1 block h-11 w-full rounded-2xl bg-white px-3 text-brown shadow-sm ring-1 ring-brown/15 outline-none focus:ring-2 focus:ring-amber/50'
const FromPhoto = () => (
  <span className="ml-1.5 rounded-full bg-[#e9dcc4] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brown">From photo</span>
)

export function DateLocationStep({ data, set }) {
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const setLoc = (loc, source) => set({ loc, location: `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`, locSource: source })
  const useMine = () => {
    if (!navigator.geolocation) return setError("This browser can't share its location.")
    setLocating(true); setError('')
    navigator.geolocation.getCurrentPosition(
      (p) => { setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }, 'device'); setLocating(false) },
      () => { setError('Location permission was denied or unavailable. Tap the map instead.'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 })
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[11rem_1fr] sm:items-end">
        <label className="max-w-[12rem] text-sm font-semibold text-brown sm:max-w-none">
          Date{data.dateSource === 'photo' && <FromPhoto />}
          <input type="date" value={data.date || ''} onChange={(e) => set({ date: e.target.value, dateSource: undefined })} className={fieldCls} />
        </label>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-brown">Location{data.locSource === 'photo' && <FromPhoto />}</p>
            <p className="mt-1 flex h-11 items-center gap-1.5 truncate text-brown-soft">
              <MapPin size={15} className="shrink-0" />
              {data.loc ? data.location : <span className="text-brown-soft/60">Tap the map to drop a pin</span>}
            </p>
          </div>
          <button type="button" onClick={useMine} disabled={locating}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-brown ring-1 ring-inset ring-brown/30 transition hover:bg-[#e9dcc4]/60 disabled:opacity-50">
            <LocateFixed size={15} /> {locating ? 'Locating…' : 'Use my location'}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <PinMap value={data.loc} onChange={(loc) => setLoc(loc, 'pin')} className="min-h-[220px] flex-1" />
    </div>
  )
}

/*
  Add Comments: behavior and sex as tap-to-choose chips (same style as the Beedex filters:
  white with a faint ring, dark brown with honey text when chosen; tap again to clear), then a
  notes box that fills the rest of the screen. Everything here is optional.
*/
export function CommentsStep({ data, set, behaviors = [], showGender }) {
  const chip = (field, v) => {
    const on = data[field] === v
    return (
      <button type="button" key={v} aria-pressed={on} onClick={() => set({ [field]: on ? null : v })}
        className={`h-10 rounded-full px-4 text-sm transition ${
          on ? 'bg-brown font-semibold text-honey shadow-sm' : 'bg-white text-brown-soft ring-1 ring-brown/15 hover:bg-[#e9dcc4]/60'}`}>
        {v}
      </button>
    )
  }
  const label = (text) => (
    <p className="mb-2 text-sm font-semibold text-brown">{text} <span className="font-normal text-brown-soft/60">(optional)</span></p>
  )
  return (
    <div className="flex flex-1 flex-col gap-5">
      {behaviors.length > 0 && (
        <div role="group" aria-label="Behavior">
          {label('What was it doing?')}
          <div className="flex flex-wrap gap-2">{behaviors.map((b) => chip('behavior', b))}</div>
        </div>
      )}
      {showGender && (
        <div role="group" aria-label="Sex">
          {label('Sex')}
          <div className="flex flex-wrap gap-2">{['Female', 'Male', 'Unknown'].map((g) => chip('gender', g))}</div>
        </div>
      )}
      <label className="flex min-h-[140px] flex-1 flex-col">
        {label('Notes')}
        <textarea value={data.comments || ''} onChange={(e) => set({ comments: e.target.value })}
          placeholder="Anything else worth knowing: weather, plants nearby, how many you saw…"
          className="min-h-0 w-full flex-1 resize-none rounded-2xl bg-white px-4 py-3 text-brown shadow-sm ring-1 ring-brown/15 outline-none transition placeholder:text-brown-soft/40 focus:ring-2 focus:ring-amber/50" />
      </label>
    </div>
  )
}

/*
  Complete Log: a summary of the log before saving.
  Desktop: the square photo (still croppable) on the left; on the right a heading with the
  species, then sections — each with an Edit link back to its step. The summary scrolls inside
  its panel so the page stays one screen tall. Phones: a small photo beside the heading, then
  the sections.
  heading:  { title, subtitle, italic, aside, step }   aside = e.g. the species diagram; step = Edit target
  sections: [{ title, step, rows: [[label, value]] }]   step = the step title to jump back to
*/
const prettyDate = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '')
  return m ? new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : s
}
export { prettyDate }

export function ReviewStep({ data, set, goTo, heading, sections }) {
  const SERIF = '"Fraunces", Georgia, serif'
  const head = (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber">Your log</p>
        <p className="mt-1 truncate text-2xl leading-tight text-brown" style={{ fontFamily: SERIF, fontWeight: 600, fontStyle: heading.italic ? 'italic' : 'normal' }}>
          {heading.title}
        </p>
        <p className="flex min-w-0 items-center gap-1 text-sm text-brown-soft/80">
          {heading.subtitle && <span className="truncate">{heading.subtitle}</span>}
          {heading.step && goTo && (
            <button type="button" onClick={() => goTo(heading.step)}
              className="shrink-0 rounded-full px-1.5 font-medium text-amber hover:bg-[#e9dcc4]/60">{heading.subtitle ? '· Edit' : 'Choose'}</button>
          )}
        </p>
      </div>
      {heading.aside}
    </div>
  )
  const body = (
    <div className="space-y-3">
      {sections.map((sec) => (
        <section key={sec.title} className="rounded-2xl bg-[#fbf8f1] p-3 ring-1 ring-brown/10">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-brown-soft/70">{sec.title}</h3>
            {sec.step && goTo && (
              <button type="button" onClick={() => goTo(sec.step)} className="rounded-full px-2 py-0.5 text-sm font-medium text-amber hover:bg-[#e9dcc4]/60">Edit</button>
            )}
          </div>
          <dl className="divide-y divide-brown/10">
            {sec.rows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 py-1.5 text-sm">
                <dt className="shrink-0 text-brown-soft/70">{k}</dt>
                <dd className="min-w-0 text-right text-brown">{v || <span className="text-brown-soft/40">—</span>}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
  const panel = 'relative overflow-hidden rounded-3xl bg-white ring-1 ring-brown/10'
  return (
    <>
      {/* Phones and tablets */}
      <div className="flex flex-1 flex-col gap-3 lg:hidden">
        <div className="flex items-center gap-3">
          <ObservationPhoto data={data} set={set} className="size-24 shrink-0" cropHint={false} />
          <div className="min-w-0 flex-1">{head}</div>
        </div>
        <div className={`min-h-[220px] flex-1 ${panel}`}>
          <div className="absolute inset-0 overflow-y-auto overscroll-contain p-3">{body}</div>
        </div>
      </div>
      {/* Desktop */}
      <div className="hidden min-h-[260px] flex-1 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 lg:grid">
        <div className="flex items-start justify-end [container-type:size]">
          <ObservationPhoto data={data} set={set} className="size-[min(100cqw,100cqh)]" />
        </div>
        <div className={panel}>
          <div className="absolute inset-0 overflow-y-auto overscroll-contain p-4">
            <div className="mb-3">{head}</div>
            {body}
          </div>
        </div>
      </div>
    </>
  )
}

export const today = () => new Date().toISOString().slice(0, 10)
