import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, MapPin, CalendarDays, NotebookPen, Plus, CloudUpload, CircleCheck, Bookmark, ChevronRight, Map as MapIcon } from 'lucide-react'
import { getLogs, deleteLog, getDrafts, deleteDraft, bees, butterflies } from '../data'
import { asset } from '../config.js'
import { CroppedImage, mainCapture } from '../collect/Crop.jsx'
import { DEMO_SIGNED_IN, sampleUser } from '../data/sampleAccount.js'

/*
  Logs — observations saved on this device from the Collect flows.
  Same design language as the Beedex: warm background, serif title, brown-selected chips,
  white rounded cards. Logs are grouped by month, newest first.
*/
const SERIF = '"Fraunces", Georgia, serif'
const KEY = 'beecology-redesign-logs' // same key as getLogs/saveLog in src/data

const TYPES = [
  { key: 'all', label: 'All' },
  { key: 'bee', label: 'Bees' },
  { key: 'butterfly', label: 'Butterflies' },
]
const TYPE_LABEL = { bee: 'Bee', butterfly: 'Butterfly' }

// "2026-11-12" → Date at local midnight (avoids the UTC off-by-one of new Date('2026-11-12'))
const parseDay = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '')
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null
}
const dayLabel = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
const monthLabel = (d) => d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

export default function Logs() {
  const [logs, setLogs] = useState(getLogs)
  const [type, setType] = useState('all')
  const [confirming, setConfirming] = useState(null) // id of the log asking "Delete?"
  const [drafts, setDrafts] = useState(getDrafts)

  const counts = useMemo(() => {
    const c = { all: logs.length, bee: 0, butterfly: 0 }
    logs.forEach((l) => { c[l.type] = (c[l.type] || 0) + 1 })
    return c
  }, [logs])

  // Filter, sort newest first, group by month
  const groups = useMemo(() => {
    const list = logs
      .filter((l) => type === 'all' || l.type === type)
      .map((l) => ({ ...l, day: parseDay(l.date) || new Date(l.created) }))
      .sort((a, b) => b.day - a.day || (b.created || '').localeCompare(a.created || ''))
    const byMonth = []
    list.forEach((l) => {
      const label = monthLabel(l.day)
      const g = byMonth.at(-1)
      g && g.label === label ? g.logs.push(l) : byMonth.push({ label, logs: [l] })
    })
    return byMonth
  }, [logs, type])

  const remove = (id) => { deleteLog(id); setLogs(getLogs()); setConfirming(null) }

  // Demo only: mark every log as sent to the Beecology team
  const submitAll = () => {
    const next = getLogs().map((l) => ({ ...l, submitted: true }))
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
    setLogs(next)
  }

  return (
    <div className="bleed min-h-dvh w-auto bg-[#fbf8f1]">
      <div className="mx-auto max-w-4xl px-6 pb-10 pt-10 md:px-10">
        {/* Page header */}
        <header className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">Field notes</p>
            <h1 className="mt-2 text-5xl leading-none text-brown md:text-6xl"
              style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>
              Logs
            </h1>
          </div>
          {logs.length > 0 && (
            <div className="flex items-center gap-2">
              {/* All logs as pins on one map */}
              <Link to="/logs/map"
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-brown ring-1 ring-inset ring-brown/30 transition hover:bg-[#e9dcc4]/60">
                <MapIcon size={16} /> Map
              </Link>
              <Link to="/collect"
                className="flex items-center gap-2 rounded-full bg-brown px-5 py-2.5 text-sm font-semibold text-honey shadow-sm transition hover:brightness-125">
                <Plus size={16} strokeWidth={2.25} /> New log
              </Link>
            </div>
          )}
        </header>

        {DEMO_SIGNED_IN ? <AccountCard logs={logs} onSubmitAll={submitAll} /> : <SignInCard logs={logs} />}

        {drafts.length > 0 && <Drafts drafts={drafts} onDelete={(id) => { deleteDraft(id); setDrafts(getDrafts()) }} />}

        {logs.length === 0 ? (
          <EmptyState onSample={() => { addSampleLogs(); setLogs(getLogs()) }} />
        ) : (
          <>
            {/* Type chips — same style as the Beedex family chips */}
            <div className="mt-8 flex flex-wrap gap-2 border-t border-brown/10 pt-6">
              {TYPES.map((t) => {
                const on = type === t.key
                return (
                  <button key={t.key} onClick={() => setType(t.key)} aria-pressed={on}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                      on ? 'bg-brown font-semibold text-honey shadow-sm' : 'bg-white text-brown-soft ring-1 ring-brown/10 hover:bg-[#e9dcc4]/60'}`}>
                    {t.label}
                    <span className={`rounded-full px-1.5 text-xs ${on ? 'bg-white/15' : 'bg-brown/5'}`}>{counts[t.key] || 0}</span>
                  </button>
                )
              })}
            </div>

            {groups.length === 0 && (
              <p className="mt-10 text-center text-brown-soft/70">No {TYPES.find((t) => t.key === type).label.toLowerCase()} logs yet.</p>
            )}

            {/* Logs grouped by month */}
            {groups.map((g) => (
              <section key={g.label} className="mt-10">
                <h2 className="mb-4 text-2xl text-brown" style={{ fontFamily: SERIF, fontWeight: 600 }}>{g.label}</h2>
                <ul className="space-y-3">
                  {g.logs.map((l) => (
                    <li key={l.id}
                      className="flex items-center gap-2 rounded-2xl bg-white p-3 pr-4 shadow-sm ring-1 ring-brown/10 transition hover:ring-brown/25">
                      <Link to={`/logs/${l.id}`} className="flex min-w-0 flex-1 items-center gap-4 rounded-xl">
                      <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-brown/5 sm:size-24">
                        {l.image
                          ? <img src={l.image} alt="" className="size-full object-cover" />
                          : <div className="grid size-full place-items-center text-brown-soft/40"><NotebookPen size={24} /></div>}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="rounded-full bg-[#e9dcc4] px-2.5 py-0.5 text-xs font-medium text-brown">
                          {TYPE_LABEL[l.type] || 'Log'}
                        </span>
                        {DEMO_SIGNED_IN && (l.submitted
                          ? <span className="ml-2 inline-flex items-center gap-1 align-middle text-xs text-brown-soft/70"><CircleCheck size={13} /> Submitted</span>
                          : <span className="ml-2 align-middle text-xs font-medium text-amber">Not submitted yet</span>)}
                        <p className="mt-1.5 truncate text-xl leading-tight text-brown"
                          style={{ fontFamily: SERIF, fontWeight: 600, fontStyle: 'italic' }}>
                          {l.species || 'Unknown species'}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-brown-soft/80">
                          <span className="flex items-center gap-1"><CalendarDays size={14} /> {dayLabel(l.day)}</span>
                          <span className="flex items-center gap-1">
                            <MapPin size={14} /> {l.location && l.location !== '—' ? l.location : 'No location'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="hidden shrink-0 text-brown-soft/40 sm:block" />
                      </Link>

                      {/* Delete, with a one-step confirm */}
                      {confirming === l.id ? (
                        <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                          <button onClick={() => remove(l.id)}
                            className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800">Delete</button>
                          <button onClick={() => setConfirming(null)}
                            className="rounded-full px-3 py-1.5 text-xs text-brown-soft hover:bg-brown/5">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirming(l.id)} aria-label="Delete log"
                          className="grid size-10 shrink-0 place-items-center rounded-full text-brown-soft/60 transition hover:bg-brown/5 hover:text-red-700">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// Unfinished logs saved with "Save as draft"; Continue reopens the collect flow at that step
function Drafts({ drafts, onDelete }) {
  const [confirming, setConfirming] = useState(null)
  const label = (d) => {
    const { kind, species } = d.data || {}
    if (species && kind === 'bee') return `Bombus ${species}`
    if (species && kind === 'butterfly') return butterflies.find((b) => b.species === species)?.common_names[0] || species
    return kind === 'bee' ? 'Bee observation' : kind === 'butterfly' ? 'Butterfly observation' : 'New observation'
  }
  return (
    <section className="mt-10">
      <h2 className="mb-4 flex items-baseline gap-3 text-2xl text-brown" style={{ fontFamily: SERIF, fontWeight: 600 }}>
        Drafts <span className="font-sans text-sm font-normal text-brown-soft/60">{drafts.length}</span>
      </h2>
      <ul className="space-y-3">
        {drafts.map((d) => {
          const { src: image, crop } = mainCapture(d.data)
          return (
            <li key={d.id} className="flex items-center gap-4 rounded-2xl border border-dashed border-brown/25 bg-white/60 p-3 pr-4">
              <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-brown/5 sm:size-20">
                {image
                  ? <CroppedImage src={image} crop={crop} className="size-full" />
                  : <div className="grid size-full place-items-center text-brown-soft/40"><Bookmark size={22} /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium text-amber ring-1 ring-amber/40">Draft</span>
                <p className="mt-1.5 truncate text-xl leading-tight text-brown" style={{ fontFamily: SERIF, fontWeight: 600, fontStyle: d.data?.species ? 'italic' : 'normal' }}>
                  {label(d)}
                </p>
                <p className="mt-0.5 truncate text-sm text-brown-soft/80">
                  Step {d.step + 1} of {d.stepCount} · {d.stepTitle}
                  <span className="hidden sm:inline"> · saved {dayLabel(new Date(d.updated))}</span>
                </p>
              </div>
              {confirming === d.id ? (
                <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <button onClick={() => onDelete(d.id)}
                    className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800">Delete</button>
                  <button onClick={() => setConfirming(null)}
                    className="rounded-full px-3 py-1.5 text-xs text-brown-soft hover:bg-brown/5">Cancel</button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-1">
                  <Link to={`/collect?draft=${d.id}`}
                    className="rounded-full bg-brown px-4 py-2 text-sm font-semibold text-honey shadow-sm transition hover:brightness-125">
                    Continue
                  </Link>
                  <button onClick={() => setConfirming(d.id)} aria-label="Delete draft"
                    className="grid size-10 place-items-center rounded-full text-brown-soft/60 transition hover:bg-brown/5 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// Signed out: logs live on this device until the person signs in
function SignInCard({ logs }) {
  return (
    <div className="mt-8 flex flex-col gap-4 rounded-3xl bg-cream p-5 ring-1 ring-brown/10 sm:flex-row sm:items-center">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e9dcc4] text-brown">
        <CloudUpload size={22} />
      </span>
      <div className="flex-1">
        <p className="font-semibold text-brown">
          {logs.length ? `${logs.length} ${logs.length === 1 ? 'log is' : 'logs are'} saved on this device` : 'Logs are saved on this device'}
        </p>
        <p className="text-sm text-brown-soft/80">Sign in to submit them to the Beecology team and see your past submissions.</p>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/signup" className="text-sm font-medium text-amber hover:underline">Create account</Link>
        <Link to="/login"
          className="rounded-full bg-brown px-5 py-2.5 text-sm font-semibold text-honey shadow-sm transition hover:brightness-125">
          Sign in
        </Link>
      </div>
    </div>
  )
}

// Signed in: who's signed in and how many logs have reached the Beecology team
function AccountCard({ logs, onSubmitAll }) {
  const sent = logs.filter((l) => l.submitted).length
  const waiting = logs.length - sent
  const species = new Set(logs.map((l) => l.species).filter(Boolean)).size
  return (
    <div className="mt-8 flex flex-col gap-4 rounded-3xl bg-cream p-5 ring-1 ring-brown/10 sm:flex-row sm:items-center">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brown text-base font-semibold text-honey">
        {sampleUser.initials}
      </span>
      <div className="flex-1">
        <p className="font-semibold text-brown">{sampleUser.name}</p>
        <p className="text-sm text-brown-soft/80">
          {sent} {sent === 1 ? 'log' : 'logs'} submitted · {species} species · since {sampleUser.memberSince}
        </p>
      </div>
      {waiting > 0 ? (
        <button onClick={onSubmitAll}
          className="flex items-center gap-2 self-start rounded-full bg-brown px-5 py-2.5 text-sm font-semibold text-honey shadow-sm transition hover:brightness-125 sm:self-auto">
          <CloudUpload size={16} /> Submit {waiting} new {waiting === 1 ? 'log' : 'logs'}
        </button>
      ) : logs.length > 0 && (
        <span className="flex items-center gap-1.5 text-sm text-brown-soft/80">
          <CircleCheck size={16} /> All logs submitted
        </span>
      )}
    </div>
  )
}

function EmptyState({ onSample }) {
  return (
    <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-brown/20 px-6 py-14 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-[#e9dcc4] text-brown">
        <NotebookPen size={28} />
      </span>
      <h2 className="mt-5 text-3xl text-brown" style={{ fontFamily: SERIF, fontWeight: 600 }}>No logs yet</h2>
      <p className="mt-2 max-w-sm text-brown-soft/80">Observations you save while collecting will show up here.</p>
      <Link to="/collect"
        className="mt-6 flex items-center gap-2 rounded-full bg-brown px-6 py-3 font-semibold text-honey shadow-md transition hover:brightness-125">
        <Plus size={18} strokeWidth={2.25} /> Start collecting
      </Link>
      {/* Design-only helper: fills the page with example logs so the layout can be reviewed */}
      <button onClick={onSample} className="mt-4 text-sm text-brown-soft/60 underline-offset-2 hover:text-brown hover:underline">
        Preview with sample logs
      </button>
    </div>
  )
}

/* Example logs for reviewing the design (stored like real ones; delete them from the page). */
function addSampleLogs() {
  const bee = (s) => bees.find((b) => b.species === s)
  const fly = (n) => butterflies.find((b) => b.common_names[0] === n)
  const monarch = fly('Monarch')
  const iso = (d) => d.toISOString().slice(0, 10)
  const ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d) }
  const samples = [
    { type: 'bee', species: 'Bombus impatiens', date: ago(1), location: '42.2746, -71.8063', image: asset(bee('impatiens').image) },
    { type: 'butterfly', species: monarch ? monarch.common_names[0] : 'Monarch', date: ago(3), location: '42.2801, -71.8120', image: monarch ? asset(monarch.butterfly_image_src[0]) : undefined },
    { type: 'bee', species: 'Bombus ternarius', date: ago(40), location: '42.2655, -71.7990', image: asset(bee('ternarius').image) },
  ].map((l, i) => ({ ...l, id: `sample-${Date.now()}-${i}`, created: new Date().toISOString() }))
  try { localStorage.setItem(KEY, JSON.stringify([...samples, ...getLogs()])) } catch {}
}
