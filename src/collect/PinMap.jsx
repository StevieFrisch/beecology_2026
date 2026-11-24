import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { Search, X } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

/*
  A real map to drop a pin on, using free sources (no account or API key):
    Leaflet — open-source map library
    Satellite — Stadia Maps hybrid (imagery with roads and place names)
    Map — Stadia "OSM Bright" streets
  Both are Stadia Maps: free on localhost; a live site needs a free Stadia account with its domain
  added (free tier is for non-commercial use).
  Click/tap the map to move the pin, or drag the pin. value = { lat, lng } or null.
  readOnly: just shows the pin (log detail page) — no moving it and no address search.
  Address search (top left) uses Stadia's geocoding (same free account): suggestions as you type,
  biased toward where the map is looking; choosing one pans the map there (the pin stays put).
*/
const DEFAULT_CENTER = { lat: 42.2746, lng: -71.8063 } // Worcester, MA

const STADIA_CREDIT = '&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noreferrer">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'

/*
  Satellite: Stadia Maps "Alidade Satellite", a hybrid with roads and place names.
  Stadia tiles work on localhost without a key; a live site needs a free Stadia account with the
  site's domain added (the free tier is for non-commercial use).
*/
const SATELLITE = {
  url: 'https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg', maxZoom: 20,
  attribution: `${STADIA_CREDIT}, imagery &copy; CNES/Airbus DS, PlanetObserver`,
}

// Map: Stadia "OSM Bright" street map (same free Stadia account as the satellite view)
const STREET = {
  url: 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png', maxZoom: 20, attribution: STADIA_CREDIT,
}

const LAYERS = {
  satellite: { label: 'Satellite' },
  map: { label: 'Map' },
}

// Brown teardrop pin in the site's colors (Leaflet's default marker images don't bundle well)
const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="34" height="44" viewBox="0 0 34 44" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))">
    <path d="M17 43C17 43 3 27.5 3 17a14 14 0 0 1 28 0C31 27.5 17 43 17 43z" fill="#2b1d0e" stroke="#fdf6e3" stroke-width="2.5"/>
    <circle cx="17" cy="17" r="5.5" fill="#ffdb70"/></svg>`,
  iconSize: [34, 44],
  iconAnchor: [17, 43],
})

export default function PinMap({ value, onChange, className = '', readOnly = false }) {
  const box = useRef(null)
  const map = useRef(null)
  const marker = useRef(null)
  const tiles = useRef(null)
  const [layer, setLayer] = useState('satellite')
  const change = useRef(onChange)
  change.current = onChange

  // Create the map once
  useEffect(() => {
    const start = value || DEFAULT_CENTER
    const m = L.map(box.current, { zoomControl: false, attributionControl: true }).setView([start.lat, start.lng], value ? 16 : 13)
    L.control.zoom({ position: 'bottomleft' }).addTo(m) // top left holds the search box
    m.attributionControl.setPrefix(false)
    const place = (latlng) => {
      if (!marker.current) {
        marker.current = L.marker(latlng, { icon: pinIcon, draggable: !readOnly, interactive: !readOnly }).addTo(m)
        marker.current.on('dragend', () => { const p = marker.current.getLatLng(); change.current({ lat: p.lat, lng: p.lng }) })
      } else marker.current.setLatLng(latlng)
    }
    if (value) place([value.lat, value.lng])
    if (!readOnly) m.on('click', (e) => { place(e.latlng); change.current({ lat: e.latlng.lat, lng: e.latlng.lng }) })
    m._place = place
    map.current = m
    // Keep the map sized to its box (the step resizes with the window)
    const ro = new ResizeObserver(() => m.invalidateSize())
    ro.observe(box.current)
    return () => { ro.disconnect(); m.remove(); map.current = null; marker.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Switch tile layer
  useEffect(() => {
    const m = map.current
    if (!m) return
    if (tiles.current) m.removeLayer(tiles.current)
    const { url, ...opts } = layer === 'satellite' ? SATELLITE : STREET
    tiles.current = L.tileLayer(url, opts).addTo(m)
  }, [layer])

  // Follow outside changes (photo location, "use my location")
  useEffect(() => {
    const m = map.current
    if (!m || !value) return
    const cur = marker.current?.getLatLng()
    if (cur && Math.abs(cur.lat - value.lat) < 1e-7 && Math.abs(cur.lng - value.lng) < 1e-7) return
    m._place([value.lat, value.lng])
    m.setView([value.lat, value.lng], Math.max(m.getZoom(), 16))
  }, [value?.lat, value?.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`relative overflow-hidden rounded-3xl ring-1 ring-brown/10 ${className}`}>
      <div ref={box} className="absolute inset-0 z-0 bg-[#e9dcc4]" />
      {!readOnly && <AddressSearch map={map} />}

      {/* Satellite / Map toggle */}
      <div className="absolute right-3 top-3 z-[500] flex rounded-full bg-white/95 p-1 text-xs font-semibold shadow-md ring-1 ring-brown/15">
        {Object.entries(LAYERS).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setLayer(k)} aria-pressed={layer === k}
            className={`rounded-full px-3 py-1 transition ${layer === k ? 'bg-brown text-honey' : 'text-brown hover:bg-[#e9dcc4]/60'}`}>
            {l.label}
          </button>
        ))}
      </div>

    </div>
  )
}

/*
  Address search: type an address or place; suggestions appear after 3 letters (Stadia
  autocomplete, nearest to the map's center first). Enter picks the first. Choosing one
  pans/zooms the map there.
*/
function AddressSearch({ map }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ctrl = useRef(null)
  const picked = useRef(false) // the box was just filled by choosing a result: don't search again

  useEffect(() => {
    if (picked.current) { picked.current = false; return }
    const text = q.trim()
    if (text.length < 3) { setResults([]); return }
    const t = setTimeout(async () => {
      ctrl.current?.abort()
      ctrl.current = new AbortController()
      const c = map.current?.getCenter()
      const params = new URLSearchParams({ text, size: '5', ...(c ? { 'focus.point.lat': c.lat.toFixed(4), 'focus.point.lon': c.lng.toFixed(4) } : {}) })
      setBusy(true)
      try {
        const r = await fetch(`https://api.stadiamaps.com/geocoding/v1/autocomplete?${params}`, { signal: ctrl.current.signal })
        const d = await r.json()
        setResults((d.features || []).map((f) => ({ label: f.properties.label, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] })))
        setOpen(true)
      } catch (e) {
        if (e.name !== 'AbortError') setResults([])
      } finally {
        setBusy(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q, map])

  const go = (r) => {
    map.current?.flyTo([r.lat, r.lng], 17, { duration: 0.8 })
    picked.current = true
    setQ(r.label); setOpen(false); setResults([])
  }

  return (
    <div className="absolute left-3 top-3 z-[500] w-[min(20rem,calc(100%-10.5rem))]">
      <label className="flex h-9 items-center gap-2 rounded-full bg-white/95 pl-3 pr-1 text-sm text-brown shadow-md ring-1 ring-brown/15 focus-within:ring-2 focus-within:ring-amber/50">
        <Search size={15} className="shrink-0 text-brown-soft/60" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) { e.preventDefault(); go(results[0]) }
            if (e.key === 'Escape') setOpen(false)
          }}
          placeholder="Search an address or place" aria-label="Search an address or place"
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-brown-soft/50" />
        {q && (
          <button type="button" onClick={() => { setQ(''); setResults([]) }} aria-label="Clear search"
            className="grid size-7 shrink-0 place-items-center rounded-full text-brown-soft/60 hover:bg-brown/5 hover:text-brown">
            <X size={14} />
          </button>
        )}
      </label>
      {open && q.trim().length >= 3 && (
        <ul role="listbox" className="mt-1.5 max-h-64 overflow-y-auto rounded-2xl bg-white p-1 text-sm shadow-lg ring-1 ring-brown/15">
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" onClick={() => go(r)}
                className="block w-full truncate rounded-xl px-3 py-2 text-left text-brown hover:bg-[#e9dcc4]/60">{r.label}</button>
            </li>
          ))}
          {!results.length && <li className="px-3 py-2 text-brown-soft/60">{busy ? 'Searching…' : 'No matches'}</li>}
        </ul>
      )}
    </div>
  )
}
