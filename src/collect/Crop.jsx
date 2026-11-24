import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Crop as CropIcon, RotateCcw } from 'lucide-react'

/*
  Square crop of the observation photo, used everywhere the photo appears in the collect flow.

  crop = { x, y, zoom }
    x, y  — the point of the image (0–1 across / down) shown at the center of the square
    zoom  — 1 = the image just covers the square; up to MAX_ZOOM times closer
  Missing crop = centered, zoom 1 (the same as a plain "cover" crop).

  ObservationPhoto: the cropped square; click it (any step) to open the crop editor.
  CropEditor: drag to move, slider or scroll wheel to zoom, Reset / Cancel / Done.
  cropToDataURL: bakes the crop into a square JPEG (used when a log is saved).
*/
export const DEFAULT_CROP = { x: 0.5, y: 0.5, zoom: 1 }
const MAX_ZOOM = 4

// Natural size of an image URL (null until loaded)
function useImageSize(src) {
  const [size, setSize] = useState(null)
  useEffect(() => {
    setSize(null)
    if (!src) return
    const img = new Image()
    img.onload = () => setSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = src
  }, [src])
  return size
}

// Keep the square covered: the center can't move past half a square from either edge
function clampCrop(c, size) {
  const zoom = Math.min(MAX_ZOOM, Math.max(1, c.zoom))
  if (!size) return { ...c, zoom }
  const m = Math.min(size.w, size.h)
  const W = (size.w / m) * zoom // image width in "squares"
  const H = (size.h / m) * zoom
  const cl = (v, span) => Math.min(1 - 0.5 / span, Math.max(0.5 / span, v))
  return { x: cl(c.x, W), y: cl(c.y, H), zoom }
}

// Percent position/size of the image inside the square
function layout(crop, size) {
  const c = clampCrop({ ...DEFAULT_CROP, ...crop }, size)
  const m = Math.min(size.w, size.h)
  const W = (size.w / m) * c.zoom * 100
  const H = (size.h / m) * c.zoom * 100
  return { width: `${W}%`, height: `${H}%`, left: `${50 - c.x * W}%`, top: `${50 - c.y * H}%` }
}

export function CroppedImage({ src, crop, className = '', alt = '' }) {
  const size = useImageSize(src)
  return (
    <div className={`relative aspect-square overflow-hidden ${className}`}>
      {size ? (
        <img src={src} alt={alt} draggable={false} className="absolute max-w-none select-none" style={layout(crop, size)} />
      ) : (
        <img src={src} alt={alt} className="absolute inset-0 size-full object-cover" />
      )}
    </div>
  )
}

/*
  The observation photo as a square, clickable to adjust the crop.
  data/set are the collect flow's; the crop is saved as data.crop.
*/
export function ObservationPhoto({ data, set, fallback, className = '', children, cropHint = true, part }) {
  const [editing, setEditing] = useState(false)
  // part ('head' | 'thorax' | 'abdomen' | 'wings'): show and crop that part's capture. Without one,
  // the main capture: the thorax for bees, the wings for butterflies.
  // A photo has a single capture ('photo') that every step uses.
  const key = data.parts?.photo ? 'photo' : part || (data.kind === 'butterfly' ? 'wings' : 'thorax')
  const p = data.parts?.[key]
  const src = p?.src || data.frames?.at(-1) || fallback
  const crop = p?.src ? p.crop : data.crop
  const save = (c) => (p?.src ? set({ parts: { ...data.parts, [key]: { ...p, crop: c } } }) : set({ crop: c }))
  if (!src) return <div className={`aspect-square rounded-3xl bg-brown/5 ${className}`} />
  return (
    <>
      <div className={`group relative aspect-square overflow-hidden rounded-3xl bg-brown/5 ring-1 ring-brown/10 ${className}`}>
        <button type="button" onClick={() => setEditing(true)} aria-label="Adjust the crop of your photo"
          className="absolute inset-0 cursor-zoom-in">
          <CroppedImage src={src} crop={crop} className="size-full" alt="Your observation" />
        </button>
        {/* Shown on hover (always on touch screens) */}
        {cropHint && <span className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur transition group-hover:opacity-100 pointer-coarse:opacity-100">
          <CropIcon size={12} /> Adjust crop
        </span>}
        {children}
      </div>
      {editing && (
        <CropEditor src={src} crop={crop} onCancel={() => setEditing(false)}
          onDone={(c) => { save(c); setEditing(false) }} />
      )}
    </>
  )
}

export function CropEditor({ src, crop: initial, onDone, onCancel }) {
  const size = useImageSize(src)
  const [crop, setCrop] = useState({ ...DEFAULT_CROP, ...initial })
  const box = useRef(null)
  const drag = useRef(null)
  const update = (c) => setCrop(clampCrop(c, size))

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  // Dragging moves the image under the square, so the crop center moves the opposite way
  const onDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, crop }
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d || !size) return
    const px = box.current.getBoundingClientRect().width
    const m = Math.min(size.w, size.h)
    const W = (size.w / m) * d.crop.zoom * px
    const H = (size.h / m) * d.crop.zoom * px
    update({ ...d.crop, x: d.crop.x - (e.clientX - d.x) / W, y: d.crop.y - (e.clientY - d.y) / H })
  }
  const onUp = () => { drag.current = null }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div role="dialog" aria-modal="true" aria-label="Adjust crop"
        className="w-full max-w-[min(26rem,calc(100dvh-12rem))] rounded-3xl bg-cream p-4 shadow-2xl ring-1 ring-brown/15">
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="text-xl text-brown" style={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 }}>Adjust crop</h2>
          <span className="text-xs text-brown-soft/70">Drag to move · zoom below</span>
        </div>

        <div ref={box} style={{ touchAction: 'none' }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          onWheel={(e) => update({ ...crop, zoom: crop.zoom * (e.deltaY < 0 ? 1.06 : 1 / 1.06) })}
          className="relative cursor-grab select-none overflow-hidden rounded-2xl bg-black active:cursor-grabbing">
          <CroppedImage src={src} crop={crop} className="w-full" />
          {/* Rule-of-thirds guides */}
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border border-white/20" />)}
          </div>
        </div>

        <label className="mt-4 flex items-center gap-3 px-1 text-sm text-brown">
          <span className="w-10 shrink-0 font-medium">Zoom</span>
          <input type="range" min="1" max={MAX_ZOOM} step="0.01" value={crop.zoom}
            onChange={(e) => update({ ...crop, zoom: +e.target.value })} className="flex-1 accent-[#2b1d0e]" />
        </label>

        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={() => setCrop(DEFAULT_CROP)}
            className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-brown-soft hover:bg-brown/5">
            <RotateCcw size={14} /> Reset
          </button>
          <div className="flex-1" />
          <button type="button" onClick={onCancel}
            className="h-10 rounded-full bg-white px-4 text-sm font-medium text-brown shadow-sm ring-1 ring-brown/15 hover:bg-[#e9dcc4]/50">
            Cancel
          </button>
          <button type="button" onClick={() => onDone(crop)}
            className="h-10 rounded-full bg-brown px-5 text-sm font-semibold text-honey shadow-md hover:brightness-125">
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Bake the crop into a square JPEG (max 1024px) — what a saved log keeps as its photo
export async function cropToDataURL(src, crop) {
  // Web images are fetched fresh: a copy the browser cached for an <img> can't be drawn
  // onto a canvas and read back, even when the site allows it
  let url = src
  let temp = null
  if (/^https?:/.test(src)) {
    const blob = await fetch(src, { mode: 'cors', cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.blob() })
    url = temp = URL.createObjectURL(blob)
  }
  const img = new Image()
  img.src = url
  await img.decode()
  const size = { w: img.naturalWidth, h: img.naturalHeight }
  const c = clampCrop({ ...DEFAULT_CROP, ...crop }, size)
  const side = Math.min(size.w, size.h) / c.zoom // source pixels covered by the square
  const out = Math.min(1024, Math.round(side))
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = out
  canvas.getContext('2d').drawImage(img, c.x * size.w - side / 2, c.y * size.h - side / 2, side, side, 0, 0, out, out)
  if (temp) URL.revokeObjectURL(temp)
  return canvas.toDataURL('image/jpeg', 0.85)
}

// The main capture of a log (thorax for bees, wings for butterflies): { src, crop }
export const mainCapture = (data) => {
  const p = data?.parts?.photo || data?.parts?.[data?.kind === 'butterfly' ? 'wings' : 'thorax']
  return p?.src ? p : { src: data?.frames?.[0], crop: data?.crop }
}
