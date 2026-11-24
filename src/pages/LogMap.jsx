import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, MapPinOff, NotebookPen } from 'lucide-react'
import { getLogs } from '../data'
import { SATELLITE, STREET, LAYERS } from '../collect/PinMap.jsx'
import { pointOf } from './LogDetail.jsx'

/*
  Log map — every saved log as a photo pin on one map.
  Desktop: a sidebar list on the left (filter chips, logs newest first) and the map filling the
  rest. Phones: the map fills the screen, with swipeable log cards along the bottom.
  Picking a log in the list (or swiping to its card) flies the map to it; tapping a pin selects
  its log in the list. Logs saved without a location are listed but have no pin.
*/
const SERIF = '"Fraunces", Georgia, serif'
const TYPES = [{ key: 'all', label: 'All' }, { key: 'bee', label: 'Bees' }, { key: 'butterfly', label: 'Butterflies' }]
const TYPE_LABEL = { bee: 'Bee', butterfly: 'Butterfly' }

const parseDay = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '')
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null
}
const dayLabel = (d) => d?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) || 'No date'
const placeOf = (l) => (l.location && l.location !== '—' ? l.location : null)

// Logs at the exact same spot would hide each other: fan them out a few meters around it
function spread(logs) {
  const groups = {}
  logs.forEach((l) => { if (l.point) (groups[`${l.point.lat},${l.point.lng}`] ||= []).push(l) })
  Object.values(groups).forEach((g) => {
    if (g.length < 2) return
    g.forEach((l, i) => {
      const a = (2 * Math.PI * i) / g.length
      const r = 0.00022 // ~25 m
      l.pin = { lat: l.point.lat + r * Math.sin(a), lng: l.point.lng + (r * Math.cos(a)) / Math.cos((l.point.lat * Math.PI) / 180) }
    })
  })
  return logs
}

// Round photo pin in the site's colors; the selected one is larger with a honey ring
const escapeAttr = (s) => String(s).replace(/[&"<>]/g, (c) => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }[c]))
function photoPin(log, on) {
  const size = on ? 58 : 44
  const ring = on ? '#ffdb70' : '#fdf6e3'
  const img = log.image
    ? `<img src="${escapeAttr(log.image)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block" />`
    : `<div style="width:100%;height:100%;background:#e9dcc4"></div>`
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size + 10}px;filter:drop-shadow(0 3px 5px rgba(0,0,0,.35));transition:transform .15s">
      <div style="width:${size}px;height:${size}px;border-radius:9999px;overflow:hidden;border:3px solid ${ring};background:#2b1d0e;box-sizing:border-box">${img}</div>
      <div style="width:0;height:0;margin:-2px auto 0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid ${ring}"></div>
    </div>`,
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 8],
  })
}

export default function LogMap() {
  const [type, setType] = useState('all')
  const [selected, setSelected] = useState(null)
  const [layer, setLayer] = useState('satellite')
  const box = useRef(null)
  const map = useRef(null)
  const tiles = useRef(null)
  const markers = useRef({})
  const listRefs = useRef({})
  const cardRefs = useRef({})
  const fromCarousel = useRef(false)

  const all = useMemo(() => spread(getLogs()
    .map((l) => ({ ...l, day: parseDay(l.date), point: pointOf(l) }))
    .map((l) => ({ ...l, pin: l.point }))
    .sort((a, b) => (b.day || 0) - (a.day || 0))), [])
  const counts = useMemo(() => ({ all: all.length, bee: all.filter((l) => l.type === 'bee').length, butterfly: all.filter((l) => l.type === 'butterfly').length }), [all])
  const shown = all.filter((l) => type === 'all' || l.type === type)
  const mapped = shown.filter((l) => l.pin)
  const unmapped = shown.filter((l) => !l.pin)
  const current = shown.find((l) => l.id === selected)

  // Create the map once
  useEffect(() => {
    const m = L.map(box.current, { zoomControl: false }).setView([42.2746, -71.8063], 12)
    L.control.zoom({ position: 'bottomright' }).addTo(m)
    m.attributionControl.setPrefix(false)
    m.on('click', () => setSelected(null))
    map.current = m
    const ro = new ResizeObserver(() => m.invalidateSize())
    ro.observe(box.current)
    return () => { ro.disconnect(); m.remove(); map.current = null }
  }, [])

  // Tiles
  useEffect(() => {
    const m = map.current
    if (tiles.current) m.removeLayer(tiles.current)
    const { url, ...opts } = layer === 'satellite' ? SATELLITE : STREET
    tiles.current = L.tileLayer(url, opts).addTo(m)
  }, [layer])

  // Pins for the logs shown; fit the map to them
  useEffect(() => {
    const m = map.current
    Object.values(markers.current).forEach((mk) => mk.remove())
    markers.current = {}
    mapped.forEach((l) => {
      const mk = L.marker([l.pin.lat, l.pin.lng], { icon: photoPin(l, false), title: l.species || 'Log', riseOnHover: true })
        .on('click', (e) => { L.DomEvent.stopPropagation(e); setSelected(l.id) })
        .addTo(m)
      markers.current[l.id] = mk
    })
    if (mapped.length) {
      const b = L.latLngBounds(mapped.map((l) => [l.pin.lat, l.pin.lng]))
      m.fitBounds(b, { padding: [70, 70], maxZoom: 15 })
    }
    if (selected && !shown.some((l) => l.id === selected)) setSelected(null)
  }, [type]) // eslint-disable-line react-hooks/exhaustive-deps

  // Selection: enlarge its pin, fly to it, and bring its list row / card into view
  useEffect(() => {
    Object.entries(markers.current).forEach(([id, mk]) => {
      const l = all.find((x) => x.id === id)
      mk.setIcon(photoPin(l, id === selected))
      mk.setZIndexOffset(id === selected ? 1000 : 0)
    })
    if (!selected) return
    const l = all.find((x) => x.id === selected)
    if (l?.pin) {
      // Desktop: aim a little right of center so the floating log card doesn't cover the pin
      const m = map.current
      const zoom = Math.max(m.getZoom(), 16)
      const wide = m.getSize().x >= 640
      const target = m.unproject(m.project([l.pin.lat, l.pin.lng], zoom).subtract([wide ? 150 : 0, wide ? 0 : -40]), zoom)
      m.flyTo(target, zoom, { duration: 0.7 })
    }
    listRefs.current[selected]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    if (!fromCarousel.current) cardRefs.current[selected]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    fromCarousel.current = false
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps

  // Phones: the card swiped to the middle of the strip becomes the selected log
  const strip = useRef(null)
  useEffect(() => {
    const root = strip.current
    if (!root) return
    let t
    const onScroll = () => {
      clearTimeout(t)
      t = setTimeout(() => {
        const mid = root.getBoundingClientRect().left + root.clientWidth / 2
        let best = null, dist = Infinity
        Object.entries(cardRefs.current).forEach(([id, el]) => {
          if (!el) return
          const r = el.getBoundingClientRect()
          const d = Math.abs(r.left + r.width / 2 - mid)
          if (d < dist) { dist = d; best = id }
        })
        if (best && best !== selected && all.find((x) => x.id === best)?.pin) { fromCarousel.current = true; setSelected(best) }
      }, 120)
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    return () => { root.removeEventListener('scroll', onScroll); clearTimeout(t) }
  }, [selected, all])

  const chips = (small) => (
    <div className="flex gap-1.5">
      {TYPES.map((t) => {
        const on = type === t.key
        return (
          <button key={t.key} type="button" onClick={() => setType(t.key)} aria-pressed={on}
            className={`flex items-center gap-1.5 rounded-full transition ${small ? 'px-3 py-1.5 text-xs shadow-md' : 'px-3.5 py-1.5 text-sm'} ${
              on ? 'bg-brown font-semibold text-honey' : 'bg-white text-brown-soft ring-1 ring-brown/10 hover:bg-[#e9dcc4]/60'}`}>
            {t.label}
            <span className={`rounded-full px-1.5 text-[11px] ${on ? 'bg-white/15' : 'bg-brown/5'}`}>{counts[t.key]}</span>
          </button>
        )
      })}
    </div>
  )

  // .bleed pulls the page under the corner buttons and dock; the zero padding lets the map fill all of it
  return (
    <div className="bleed h-dvh w-auto overflow-hidden bg-[#fbf8f1] !p-0 lg:grid lg:grid-cols-[380px_1fr]">
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="relative hidden min-h-0 flex-col border-r border-brown/10 lg:flex">
        <div className="shrink-0 px-6 pb-4 pt-8">
          <Link to="/logs" className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-sm font-medium text-brown-soft transition hover:bg-[#e9dcc4]/60">
            <ArrowLeft size={16} /> Logs
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-amber">Field notes</p>
          <h1 className="mt-1.5 text-4xl leading-none text-brown" style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>Log map</h1>
          <p className="mt-2 text-sm text-brown-soft/80">{mapped.length} of {shown.length} {shown.length === 1 ? 'log' : 'logs'} on the map</p>
          <div className="mt-4">{chips(false)}</div>
        </div>
        <div className="relative min-h-0 flex-1 border-t border-brown/10">
          <ul className="absolute inset-0 space-y-1 overflow-y-auto overscroll-contain p-3 pb-8">
            {[...mapped, ...unmapped].map((l) => (
              <li key={l.id} ref={(el) => { listRefs.current[l.id] = el }}>
                <SidebarRow log={l} on={l.id === selected} onPick={() => l.pin && setSelected(l.id)} />
              </li>
            ))}
            {!shown.length && <li className="px-3 py-10 text-center text-sm text-brown-soft/70">No logs yet.</li>}
          </ul>
        </div>
      </aside>

      {/* ---------- Map ---------- */}
      <div className="relative h-full min-h-0">
        <div ref={box} className="absolute inset-0 z-0 bg-[#e9dcc4]" />

        {/* Phones: back + title + filters, floating at the top left */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-4 lg:hidden">
          <div className="pointer-events-auto flex items-center gap-2">
            <Link to="/logs" aria-label="Back to logs"
              className="grid size-11 place-items-center rounded-full bg-cream text-brown shadow-md ring-1 ring-brown/10">
              <ArrowLeft size={18} />
            </Link>
            <span className="rounded-full bg-cream px-4 py-2.5 text-lg leading-none text-brown shadow-md ring-1 ring-brown/10" style={{ fontFamily: SERIF, fontWeight: 600 }}>Log map</span>
          </div>
          <div className="pointer-events-auto mt-2.5">{chips(true)}</div>
        </div>

        {/* Satellite / Map: top left on desktop, below the corner buttons on phones */}
        <div className="absolute right-4 top-[122px] z-[500] flex rounded-full bg-white/95 p-1 text-xs font-semibold shadow-md ring-1 ring-brown/15 lg:left-4 lg:right-auto lg:top-4">
          {Object.entries(LAYERS).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setLayer(k)} aria-pressed={layer === k}
              className={`rounded-full px-3 py-1 transition ${layer === k ? 'bg-brown text-honey' : 'text-brown hover:bg-[#e9dcc4]/60'}`}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Desktop: the selected log, floating over the map */}
        {current && (
          <div className="absolute left-4 top-16 z-[500] hidden w-72 overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-brown/10 lg:block">
            {current.image && <img src={current.image} alt="" className="aspect-[4/3] w-full object-cover" />}
            <div className="p-4">
              <span className="rounded-full bg-[#e9dcc4] px-2.5 py-0.5 text-xs font-medium text-brown">{TYPE_LABEL[current.type] || 'Log'}</span>
              <p className="mt-1.5 text-xl leading-tight text-brown" style={{ fontFamily: SERIF, fontWeight: 600, fontStyle: 'italic' }}>{current.species || 'Unknown species'}</p>
              <p className="mt-1 text-sm text-brown-soft/80">{dayLabel(current.day)}{placeOf(current) ? ` · ${placeOf(current)}` : ''}</p>
              <Link to={`/logs/${current.id}`}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-brown px-4 py-2 text-sm font-semibold text-honey shadow-sm transition hover:brightness-125">
                Open log <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}

        {/* Phones: swipeable log cards above the dock */}
        <div ref={strip}
          className="absolute inset-x-0 bottom-[104px] z-[500] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[10vw] pb-2 [scrollbar-width:none] lg:hidden">
          {[...mapped, ...unmapped].map((l) => (
            <div key={l.id} ref={(el) => { cardRefs.current[l.id] = el }} className="w-[80vw] max-w-sm shrink-0 snap-center">
              <PhoneCard log={l} on={l.id === selected} onPick={() => l.pin && setSelected(l.id)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Thumb({ log, className }) {
  return (
    <div className={`shrink-0 overflow-hidden rounded-xl bg-brown/5 ${className}`}>
      {log.image
        ? <img src={log.image} alt="" loading="lazy" className="size-full object-cover" />
        : <div className="grid size-full place-items-center text-brown-soft/40"><NotebookPen size={20} /></div>}
    </div>
  )
}

function SidebarRow({ log, on, onPick }) {
  return (
    <div className={`group flex items-center gap-3 rounded-2xl p-2 pr-2 transition ${on ? 'bg-[#e9dcc4] ring-2 ring-inset ring-brown' : 'hover:bg-[#e9dcc4]/40'}`}>
      <button type="button" onClick={onPick} disabled={!log.pin} aria-pressed={on}
        className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default">
        <Thumb log={log} className="size-14" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg leading-tight text-brown" style={{ fontFamily: SERIF, fontWeight: 600, fontStyle: log.species ? 'italic' : 'normal' }}>
            {log.species || 'Unknown species'}
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-xs text-brown-soft/80"><CalendarDays size={12} /> {dayLabel(log.day)}</span>
          <span className="flex items-center gap-1 truncate text-xs text-brown-soft/80">
            {log.pin ? <MapPin size={12} className="shrink-0" /> : <MapPinOff size={12} className="shrink-0" />}
            <span className="truncate">{placeOf(log) || (log.pin ? 'Pinned location' : 'No location')}</span>
          </span>
        </span>
      </button>
      <Link to={`/logs/${log.id}`} aria-label={`Open the ${log.species || 'log'} log`}
        className="grid size-9 shrink-0 place-items-center rounded-full text-brown-soft/60 transition hover:bg-white hover:text-brown">
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}

function PhoneCard({ log, on, onPick }) {
  return (
    <div onClick={onPick}
      className={`flex items-center gap-3 rounded-3xl bg-white p-2.5 pr-3 shadow-xl transition ${on ? 'ring-2 ring-brown' : 'ring-1 ring-brown/10'}`}>
      <Thumb log={log} className="size-16" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg leading-tight text-brown" style={{ fontFamily: SERIF, fontWeight: 600, fontStyle: log.species ? 'italic' : 'normal' }}>
          {log.species || 'Unknown species'}
        </p>
        <p className="mt-0.5 truncate text-xs text-brown-soft/80">{dayLabel(log.day)}</p>
        <p className="truncate text-xs text-brown-soft/80">{placeOf(log) || (log.pin ? 'Pinned location' : 'No location')}</p>
      </div>
      <Link to={`/logs/${log.id}`} onClick={(e) => e.stopPropagation()} aria-label={`Open the ${log.species || 'log'} log`}
        className="grid size-10 shrink-0 place-items-center rounded-full bg-brown text-honey">
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}
