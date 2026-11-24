import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, MapPin, CircleCheck, Trash2, NotebookPen, ChevronRight } from 'lucide-react'
import { getLogs, deleteLog, bees, butterflies } from '../data'
import { DEMO_SIGNED_IN } from '../data/sampleAccount.js'
import PinMap from '../collect/PinMap.jsx'

/*
  Log detail — one saved observation: photo, species (linked to its Beedex page), date,
  place, comments, and a read-only map with the log's pin. Opened from a card on the Logs page.
*/
const SERIF = '"Fraunces", Georgia, serif'
const TYPE_LABEL = { bee: 'Bee', butterfly: 'Butterfly' }

// "2026-11-12" → "Thursday, November 12, 2026" (local date, no UTC shift)
const longDate = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '')
  return m ? new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : null
}

// Map point: saved { lat, lng }, or older logs whose location text is "lat, lng"
export const pointOf = (l) => {
  if (l.loc) return l.loc
  const m = /^\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\s*$/.exec(l.location || '')
  return m ? { lat: +m[1], lng: +m[2] } : null
}

// The species' Beedex page, when it's one we know
const beedexLink = (l) => {
  if (l.type === 'bee') {
    const b = bees.find((x) => `Bombus ${x.species}` === l.species)
    return b && { to: `/beedex/bee/${b.species}`, common: b.common_names?.[0] }
  }
  const b = butterflies.find((x) => x.common_names[0] === l.species || x.species === l.species)
  return b && { to: `/beedex/butterfly/${b.id}`, scientific: b.species }
}

export default function LogDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const log = getLogs().find((l) => l.id === id)
  const [confirming, setConfirming] = useState(false)

  if (!log) {
    return (
      <div className="bleed min-h-dvh w-auto bg-[#fbf8f1]">
        <div className="mx-auto max-w-4xl px-6 pt-16 text-center">
          <h1 className="text-3xl text-brown" style={{ fontFamily: SERIF, fontWeight: 600 }}>Log not found</h1>
          <p className="mt-2 text-brown-soft/80">It may have been deleted.</p>
          <Link to="/logs" className="mt-6 inline-flex items-center gap-2 rounded-full bg-brown px-5 py-2.5 text-sm font-semibold text-honey">
            <ArrowLeft size={16} /> Back to logs
          </Link>
        </div>
      </div>
    )
  }

  const point = pointOf(log)
  const place = log.location && log.location !== '—' ? log.location : null
  const dex = beedexLink(log)
  const comments = [['What it was doing', log.behavior], ['Sex', log.sex], ['Notes', log.notes]].filter(([, v]) => v)
  const remove = () => { deleteLog(log.id); navigate('/logs') }

  return (
    <div className="bleed min-h-dvh w-auto bg-[#fbf8f1]">
      <div className="mx-auto max-w-5xl px-6 pb-10 pt-8 md:px-10">
        <Link to="/logs" className="inline-flex items-center gap-1.5 rounded-full py-1 pr-3 text-sm font-medium text-brown-soft hover:text-brown">
          <ArrowLeft size={16} /> Logs
        </Link>

        {/* Header */}
        <header className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e9dcc4] px-2.5 py-0.5 text-xs font-medium text-brown">{TYPE_LABEL[log.type] || 'Log'}</span>
            {DEMO_SIGNED_IN && (log.submitted
              ? <span className="inline-flex items-center gap-1 text-xs text-brown-soft/70"><CircleCheck size={13} /> Submitted</span>
              : <span className="text-xs font-medium text-amber">Not submitted yet</span>)}
          </div>
          <h1 className="mt-2 text-4xl leading-tight text-brown md:text-5xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontStyle: log.species ? 'italic' : 'normal', letterSpacing: '-0.01em' }}>
            {log.species || 'Unknown species'}
          </h1>
          {(dex?.common || dex?.scientific) && <p className="mt-1 text-brown-soft/80">{dex.common || <i>{dex.scientific}</i>}</p>}
        </header>

        {/* Photo on top with the info beside it */}
        <div className="mt-6 grid gap-6 md:grid-cols-[3fr_2fr]">
          {/* Photo (the larger of the two) */}
          <div className="aspect-square overflow-hidden rounded-3xl bg-brown/5 ring-1 ring-brown/10">
            {log.image
              ? <img src={log.image} alt={log.species || 'Observation'} className="size-full object-cover" />
              : <div className="grid size-full place-items-center text-brown-soft/40"><NotebookPen size={40} /></div>}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            <section className="rounded-3xl bg-white p-5 ring-1 ring-brown/10">
              <dl className="space-y-4">
                <div className="flex gap-3">
                  <CalendarDays size={18} className="mt-0.5 shrink-0 text-brown-soft/70" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-brown-soft/60">Date</dt>
                    <dd className="text-brown">{longDate(log.date) || 'No date'}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-brown-soft/70" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-brown-soft/60">Location</dt>
                    <dd className="text-brown">{place || 'No location'}</dd>
                    {point && place !== `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` && (
                      <dd className="text-sm text-brown-soft/70">{point.lat.toFixed(5)}, {point.lng.toFixed(5)}</dd>
                    )}
                  </div>
                </div>
              </dl>
              {dex && (
                <Link to={dex.to}
                  className="mt-5 flex items-center justify-between rounded-2xl bg-cream px-4 py-3 text-sm font-medium text-brown ring-1 ring-brown/10 transition hover:bg-[#e9dcc4]/60">
                  See {log.species} in the Beedex <ChevronRight size={16} />
                </Link>
              )}
            </section>

            {/* Always shown; fills the rest of the photo's height */}
            <section className="rounded-3xl bg-white p-5 ring-1 ring-brown/10 md:flex-1">
              <h2 className="text-xl text-brown" style={{ fontFamily: SERIF, fontWeight: 600 }}>Comments</h2>
              {comments.length ? (
                <dl className="mt-3 space-y-3">
                  {comments.map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-brown-soft/60">{k}</dt>
                      <dd className="mt-0.5 leading-relaxed text-brown">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-2 text-sm text-brown-soft/70">No comments were added.</p>
              )}
            </section>
          </div>
        </div>

        {/* Map: full width, below */}
        <div className="mt-6">
          {point ? (
            <PinMap value={point} readOnly className="aspect-[4/3] md:aspect-[21/8]" />
          ) : (
            <div className="grid aspect-[4/3] place-items-center rounded-3xl border border-dashed border-brown/20 text-center text-sm text-brown-soft/70 md:aspect-[21/8]">
              <span className="flex flex-col items-center gap-2"><MapPin size={24} /> No location was saved with this log</span>
            </div>
          )}
        </div>

        {/* Delete, with a one-step confirm */}
        <div className="mt-8 flex justify-end">
          {confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-brown-soft">Delete this log?</span>
              <button onClick={remove} className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">Delete</button>
              <button onClick={() => setConfirming(false)} className="rounded-full px-4 py-2 text-sm text-brown-soft hover:bg-brown/5">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirming(true)}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-brown-soft ring-1 ring-inset ring-brown/20 transition hover:text-red-700 hover:ring-red-700/40">
              <Trash2 size={16} /> Delete log
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
