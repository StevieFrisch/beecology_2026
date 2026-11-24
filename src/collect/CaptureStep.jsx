import { useEffect, useRef, useState } from 'react'
import exifr from 'exifr'
import { ImageUp, Camera, X, RefreshCw, Check, Film, Image as ImageIcon } from 'lucide-react'
import { bees, butterflies } from '../data'
import { asset, publicUrl } from '../config.js'
import { FrameDial, useVideo } from './FrameDial.jsx'
import { CroppedImage, CropEditor } from './Crop.jsx'

/*
  Step 1, Capture: upload one video or photo, then say whether it's a bee or a butterfly.

  - The file input accepts images and videos and doesn't force the camera, so phones offer
    their own choices (on iPhone: Take Photo or Video, Photo Library, Choose File).
  - A photo is used as-is. A video shows a player with a Capture button to grab frames.
  - Both media and bee/butterfly are required before Next (see captureStep.valid).

  data: media { url, kind: 'image' | 'video', name }, frames [dataURL | url], kind 'bee' | 'butterfly'
*/
const SERIF = '"Fraunces", Georgia, serif'

const KINDS = [
  { key: 'bee', label: 'Bee', image: asset(bees.find((b) => b.species === 'impatiens')?.image) },
  { key: 'butterfly', label: 'Butterfly', image: asset(butterflies.find((b) => b.common_names[0] === 'Monarch')?.butterfly_image_src[0]) },
]

/*
  Sample media, so the flow can be tried without your own files.
  Bee photo: a tricolored bumble bee (B. ternarius) side-on in flight, chosen because every
  abdomen band is clear (yellow, orange, orange, yellow, black — abdomen pattern 10).
  Photo by Bryan Pfeiffer on iNaturalist (observation 116124915), CC BY-NC: the credit is shown
  wherever it appears. Butterfly photo: the Beedex monarch.
  Videos live in public/samples (each option turns on by itself when its file is there):
    bee.mp4       — "Bumblebee on dandelion", Pexels video 17407597 (960×540, 15 s)
    butterfly.mp4 — "Vibrant monarch butterfly on purple flowers", Pexels video 39073681 (960×540, 23 s)
  Both are free under the Pexels license (no attribution required).
*/
const SAMPLES = [
  { kind: 'bee', type: 'image', src: 'https://inaturalist-open-data.s3.amazonaws.com/photos/195992266/large.jpg',
    credit: { by: 'Bryan Pfeiffer', license: 'CC BY-NC', url: 'https://www.inaturalist.org/observations/116124915' } },
  { kind: 'bee', type: 'video', src: publicUrl('samples/bee.mp4') },
  // A copy of the Beedex monarch kept in public/samples: the original's site doesn't let other sites read
  // its images, so it couldn't be cropped or run through the matcher (photo: Paul Sweet, CC BY-SA 4.0)
  { kind: 'butterfly', type: 'image', src: publicUrl('samples/butterfly.jpg'),
    credit: { by: 'Paul Sweet', license: 'CC BY-SA', url: 'https://creativecommons.org/licenses/by-sa/4.0/' } },
  { kind: 'butterfly', type: 'video', src: publicUrl('samples/butterfly.mp4') },
]

// Answers that only make sense for one kind; cleared when the kind changes
const KIND_FIELDS = { species: undefined, speciesPicked: undefined, matches: undefined, matchesFor: undefined, abdomen: undefined, thorax: undefined, head: undefined }

/*
  Capture step: first say what you saw, then add media (the media area stays locked until then).
  Captures are kept in data.parts = { <part>: { src, crop, time } }:
    video, bee       — three labeled frames: head, thorax and abdomen (all needed); each
                       pattern step shows its own
    video, butterfly — one frame of the wings
    photo            — just the photo, with one crop (key 'photo', or 'wings' for butterflies)
  The main image (species comparison, review, drafts and the saved log's thumbnail) is the thorax
  capture for bee videos, the wings for butterflies, or the photo; data.frames[0] mirrors it.
*/
export const PARTS = [
  { key: 'head', label: 'Head' },
  { key: 'thorax', label: 'Thorax' },
  { key: 'abdomen', label: 'Abdomen' },
]
const BUTTERFLY_PARTS = [{ key: 'wings', label: 'Wings' }]
const PHOTO_PART = [{ key: 'photo', label: 'Photo' }]
// The capture slots: per body part for bee videos; a single one otherwise
export const partsFor = (kind, mediaKind = 'video') =>
  kind === 'butterfly' ? BUTTERFLY_PARTS : mediaKind === 'video' ? PARTS : PHOTO_PART
export const mainPart = (kind, mediaKind = 'video') =>
  kind === 'butterfly' ? 'wings' : mediaKind === 'video' ? 'thorax' : 'photo'
const allParts = (kind, mediaKind, src) => Object.fromEntries(partsFor(kind, mediaKind).map((p) => [p.key, { src }]))

export const captureStep = {
  title: 'Capture',
  valid: (d) => d.kind && d.media && partsFor(d.kind, d.media.kind).every((p) => d.parts?.[p.key]?.src),
  render: (p) => <CaptureStep {...p} />,
}

function CaptureStep({ data, set }) {
  const { media, kind } = data
  const parts = data.parts || {}
  const slots = partsFor(kind, media?.kind)
  const setParts = (next) => set({ parts: next, frames: [next[mainPart(kind, media?.kind)]?.src].filter(Boolean) })
  // A photo is its own single capture; videos start empty
  const startParts = (k, m) => (m && m.kind !== 'video' ? allParts(k, m.kind, m.url) : {})

  const choose = (file) => {
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    if (!isVideo && !file.type.startsWith('image/')) return
    if (media?.url?.startsWith('blob:')) URL.revokeObjectURL(media.url)
    const m = { url: URL.createObjectURL(file), kind: isVideo ? 'video' : 'image', name: file.name }
    const next = startParts(kind, m)
    set({ media: m, crop: undefined, parts: next, frames: [next[mainPart(kind, m.kind)]?.src].filter(Boolean), photoMeta: undefined })
    if (!isVideo) readPhotoMeta(file).then((meta) => meta && set(meta))
  }

  // Replace: drop the media and its captures; bee/butterfly stays as chosen
  const clear = () => {
    if (media?.url?.startsWith('blob:')) URL.revokeObjectURL(media.url)
    set({ media: undefined, frames: [], crop: undefined, parts: {} })
  }

  const pickSample = (s) => {
    if (media?.url?.startsWith('blob:')) URL.revokeObjectURL(media.url)
    const m = { url: s.src, kind: s.type, name: `Sample ${s.kind} ${s.type === 'video' ? 'video' : 'photo'}`, sample: true, credit: s.credit }
    const next = startParts(kind, m)
    set({ media: m, crop: undefined, parts: next, frames: [next[mainPart(kind, m.kind)]?.src].filter(Boolean) })
  }

  // Switching bee ↔ butterfly keeps the media but restarts the captures (the parts differ)
  const pickKind = (k) => {
    const next = startParts(k, media)
    set({ kind: k, ...KIND_FIELDS, crop: undefined, parts: next, frames: [next[mainPart(k, media?.kind)]?.src].filter(Boolean) })
  }

  return (
    // Fills the wizard's body; the media area takes whatever height is left so the
    // whole step fits on one screen (it only grows past that on very short screens)
    <div className="flex flex-1 flex-col gap-4">
      {/* 1. Bee or butterfly (the choices speak for themselves; the heading is for screen readers) */}
      <section>
        <h2 className="sr-only">What did you see?</h2>
        <div role="radiogroup" aria-label="Bee or butterfly" className="grid grid-cols-2 gap-3 sm:max-w-md">
          {KINDS.map((k) => {
            const on = kind === k.key
            return (
              <button key={k.key} type="button" role="radio" aria-checked={on}
                onClick={() => !on && pickKind(k.key)}
                className={`relative flex min-w-0 items-center gap-2.5 rounded-2xl p-2 pr-3 text-left sm:gap-3 sm:p-2.5 sm:pr-4 transition ${
                  on ? 'bg-brown text-honey shadow-md' : 'bg-white text-brown shadow-sm ring-1 ring-brown/15 hover:bg-[#e9dcc4]/50'}`}>
                <img src={k.image} alt="" className="size-10 shrink-0 rounded-xl object-cover sm:size-12" />
                <span className="min-w-0 flex-1 truncate text-base font-semibold sm:text-lg">{k.label}</span>
                {/* Radio dot: phones rely on the brown fill alone so the label fits */}
                <span className={`hidden size-5 shrink-0 place-items-center rounded-full sm:grid ${on ? 'bg-honey text-brown' : 'ring-1 ring-brown/25'}`}>
                  {on && <Check size={13} strokeWidth={3} />}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 2. Media — locked until bee or butterfly is chosen */}
      <section className="flex min-h-0 flex-1 flex-col" aria-disabled={!kind}>
        <h2 className="sr-only">Media</h2>
        {!media ? (
          // Before anything is uploaded the box keeps a comfortable fixed size; once there's media
          // the photo/video takes all the space that's left
          <div className="relative flex flex-col">
            <fieldset disabled={!kind} className={`flex flex-col transition ${kind ? '' : 'pointer-events-none select-none opacity-40'}`}>
              <DropZone onFile={choose} />
              <SamplePicker onPick={pickSample} kind={kind} />
            </fieldset>
          </div>
        ) : media.kind === 'video'
          ? <VideoCapture media={media} onReplace={clear} slots={slots} parts={parts} onParts={setParts} kind={kind} />
          : <PhotoPreview media={media} onReplace={clear} slots={slots} parts={parts} onParts={setParts} kind={kind} />}
      </section>
    </div>
  )
}

/*
  When and where a photo was taken, from its metadata (EXIF): becomes the default date
  and location on the Date and Location step. Phones often strip GPS from photos shared to
  websites (iPhone does unless "Location" is left on when choosing the photo), so either part
  may be missing. Videos aren't read.
*/
const pad = (n) => String(n).padStart(2, '0')
async function readPhotoMeta(file) {
  try {
    const tags = await exifr.parse(file, { gps: true, pick: ['DateTimeOriginal', 'CreateDate', 'GPSLatitude', 'GPSLongitude', 'GPSLatitudeRef', 'GPSLongitudeRef'] })
    if (!tags) return null
    const out = { photoMeta: {} }
    const taken = tags.DateTimeOriginal || tags.CreateDate
    if (taken instanceof Date && !isNaN(taken)) {
      out.date = `${taken.getFullYear()}-${pad(taken.getMonth() + 1)}-${pad(taken.getDate())}`
      out.dateSource = 'photo'
      out.photoMeta.taken = true
    }
    if (Number.isFinite(tags.latitude) && Number.isFinite(tags.longitude)) {
      out.loc = { lat: tags.latitude, lng: tags.longitude }
      out.location = `${tags.latitude.toFixed(5)}, ${tags.longitude.toFixed(5)}`
      out.locSource = 'photo'
      out.photoMeta.gps = true
    }
    return out.photoMeta.taken || out.photoMeta.gps ? out : null
  } catch {
    return null
  }
}

// Empty state: one big "Upload media" target. Click to browse, or drag a file in on desktop.
function DropZone({ onFile }) {
  const [over, setOver] = useState(false)
  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer.files?.[0]) }}
      className={`flex h-60 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-4 text-center transition sm:h-64 short:h-44 ${
        over ? 'border-amber bg-[#e9dcc4]/50' : 'border-brown/20 bg-white/60 hover:bg-white'}`}>
      <span className="grid size-12 place-items-center rounded-full bg-[#e9dcc4] text-brown short:hidden">
        <ImageUp size={24} strokeWidth={1.75} />
      </span>
      <span className="mt-3 inline-flex h-11 items-center rounded-full bg-brown short:mt-0 px-6 font-semibold text-honey shadow-md">
        Upload media
      </span>
      <span className="mt-2 text-sm text-brown-soft/70">
        <span className="pointer-coarse:hidden">Select or drag it here</span>
        <span className="hidden pointer-coarse:inline">Record, take a photo, or choose from your library</span>
      </span>
      <input type="file" accept="image/*,video/*" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
    </label>
  )
}

// "Use sample media": an underlined link that opens a choice of bee/butterfly × photo/video
function SamplePicker({ onPick, kind }) {
  const [open, setOpen] = useState(false)
  const [videos, setVideos] = useState({}) // src → true once the file is found
  const ref = useRef(null)

  // Close on a click outside the card or Esc
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  // Check which sample videos exist (the dev server answers missing files with the app page, so check the type)
  useEffect(() => {
    if (!open) return
    SAMPLES.filter((m) => m.type === 'video').forEach((m) =>
      fetch(m.src, { method: 'HEAD' })
        .then((r) => r.ok && r.headers.get('content-type')?.startsWith('video/') && setVideos((v) => ({ ...v, [m.src]: true })))
        .catch(() => {}))
  }, [open])

  return (
    // The choices float on a card above the link, so opening it doesn't push the page around
    <div ref={ref} className="relative mt-2 text-center">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="dialog"
        className="text-sm text-brown-soft underline underline-offset-4 hover:text-brown">
        Use sample media
      </button>
      {open && (
        <div role="dialog" aria-label="Sample media"
          className="absolute bottom-full left-1/2 z-30 mb-2 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl bg-cream p-3 text-left shadow-2xl ring-1 ring-brown/15">
          <div className="mb-2 flex items-center justify-between pl-1">
            <p className="text-lg text-brown" style={{ fontFamily: SERIF, fontWeight: 600 }}>Sample media</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close"
              className="grid size-8 place-items-center rounded-full text-brown-soft/70 transition hover:bg-brown/5 hover:text-brown">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
          {SAMPLES.filter((m) => m.kind === kind).map((m) => {
            const isVideo = m.type === 'video'
            const available = !isVideo || videos[m.src]
            const Icon = isVideo ? Film : ImageIcon
            const thumb = m.type === 'image' ? m.src : KINDS.find((k) => k.key === m.kind).image
            return (
              <button key={m.kind + m.type} type="button" disabled={!available} onClick={() => onPick(m)}
                className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-white p-1.5 pr-3 text-left shadow-sm ring-1 ring-brown/15 transition hover:ring-brown/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:ring-brown/15">
                <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-brown/5">
                  <img src={thumb} alt="" className={`size-full object-cover ${available ? '' : 'grayscale'}`} />
                  <span className="absolute bottom-0.5 right-0.5 grid size-5 place-items-center rounded-full bg-brown/85 text-honey">
                    <Icon size={11} />
                  </span>
                </span>
                <span className="block min-w-0">
                  <span className="block truncate text-sm font-semibold capitalize text-brown">{m.kind}</span>
                  <span className="block truncate text-xs text-brown-soft/70">{isVideo ? 'Video' : 'Photo'}{!available && <> · <span className="sm:hidden">soon</span><span className="hidden sm:inline">coming soon</span></>}</span>
                </span>
              </button>
            )
          })}
          </div>
        </div>
      )}
    </div>
  )
}

// Small "Replace" pill: removes the current photo or video and returns to the empty upload box
function Replace({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="flex h-9 items-center gap-1.5 rounded-full bg-white/90 px-3.5 text-sm font-medium text-brown shadow-sm ring-1 ring-brown/15 backdrop-blur transition hover:bg-white">
      <RefreshCw size={14} /> Replace
    </button>
  )
}

// Photographer credit for sample photos that need one (bottom-right corner of the photo)
export function Credit({ credit, position = 'bottom-2 right-2' }) {
  if (!credit) return null
  return (
    <a href={credit.url} target="_blank" rel="noreferrer"
      className={`absolute ${position} rounded-full bg-black/45 px-2 py-0.5 text-[10px] text-white/90 backdrop-blur hover:bg-black/60`}>
      Photo: {credit.by} · {credit.license}
    </a>
  )
}

/*
  The capture slots (bee: Head, Thorax, Abdomen; butterfly: Wings). A filled slot shows its square
  crop; click it to adjust the crop. For videos, `active` is the slot the next Capture fills (an
  empty slot can be clicked to make it active) and a filled slot has a × to clear it.
*/
function PartSlots({ slots, parts, onParts, active, onActive, removable }) {
  const [editing, setEditing] = useState(null)
  return (
    <div className="flex items-center gap-2">
      {slots.map((p) => {
        const part = parts[p.key]
        const on = active === p.key
        return (
          <div key={p.key} className="relative">
            <button type="button"
              onClick={() => (part?.src ? setEditing(p.key) : onActive?.(p.key))}
              aria-label={part?.src ? `${p.label}: adjust crop` : `${p.label}: not captured yet`}
              className={`relative block size-12 overflow-hidden rounded-xl transition sm:size-14 ${
                part?.src ? 'ring-1 ring-brown/20 hover:ring-2 hover:ring-amber'
                  : on ? 'border-2 border-dashed border-amber bg-[#e9dcc4]/50' : 'border-2 border-dashed border-brown/20 bg-white/60 hover:border-brown/40'}`}>
              {part?.src && <CroppedImage src={part.src} crop={part.crop} className="size-full" alt="" />}
              <span className={`absolute inset-x-0 bottom-0 py-0.5 text-center text-[9px] font-semibold leading-tight ${
                part?.src ? 'bg-black/55 text-white' : on ? 'text-amber' : 'text-brown-soft/60'}`}>{p.label}</span>
            </button>
            {removable && part?.src && (
              <button type="button" onClick={() => { const next = { ...parts }; delete next[p.key]; onParts(next); onActive?.(p.key) }}
                aria-label={`Remove the ${p.label.toLowerCase()} capture`}
                className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-brown text-honey shadow hover:brightness-125">
                <X size={11} strokeWidth={2.75} />
              </button>
            )}
            {editing === p.key && (
              <CropEditor src={part.src} crop={part.crop} onCancel={() => setEditing(null)}
                onDone={(c) => { onParts({ ...parts, [p.key]: { ...part, crop: c } }); setEditing(null) }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function PhotoPreview({ media, onReplace, slots, parts, onParts, kind }) {
  return (
    <>
      <div className="relative min-h-[160px] flex-1 overflow-hidden rounded-3xl bg-brown/5 ring-1 ring-brown/10">
        <img src={media.url} alt="Your photo" className="absolute inset-0 size-full object-contain" />
        <div className="absolute right-3 top-3"><Replace onClick={onReplace} /></div>
        <Credit credit={media.credit} />
      </div>
      {/* Crop one square per part from the photo */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm text-brown-soft">
          <span className="font-semibold text-brown">
            {kind === 'butterfly' ? 'Crop to the wings.' : 'Crop to the bee.'}
          </span>{' '}
          <span className="hidden sm:inline">Tap the square to zoom in.</span>
        </p>
        <PartSlots slots={slots} parts={parts} onParts={onParts} />
      </div>
    </>
  )
}

// Video player plus frame tools. Capture grabs the current frame (only shown for videos).
function VideoCapture({ media, onReplace, slots, parts, onParts, kind }) {
  const video = useRef(null)
  const [ready, setReady] = useState(false)
  const [marker, setMarker] = useState(null) // video time of the latest capture
  // Which part the next capture fills — the first one still missing
  const firstMissing = slots.find((p) => !parts[p.key]?.src)?.key
  const [active, setActive] = useState(firstMissing || slots[0].key)
  useEffect(() => { setReady(false); setMarker(null) }, [media.url])
  useEffect(() => { setActive(firstMissing || slots[0].key) }, [kind]) // eslint-disable-line react-hooks/exhaustive-deps
  const player = useVideo(video, media.url)
  const capture = () => {
    const v = video.current
    if (!v?.videoWidth) return
    const c = document.createElement('canvas')
    c.width = v.videoWidth
    c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    setMarker(v.currentTime)
    const next = { ...parts, [active]: { src: c.toDataURL('image/jpeg', 0.8), time: v.currentTime } }
    onParts(next)
    // Move on to the next part that still needs a capture
    const after = slots.find((p) => !next[p.key]?.src)
    if (after) setActive(after.key)
  }
  const activeLabel = slots.find((p) => p.key === active)?.label || slots[0].label
  const done = slots.every((p) => parts[p.key]?.src)
  const many = slots.length > 1

  return (
    <>
      <div className="group relative min-h-[160px] flex-1 overflow-hidden rounded-3xl bg-black ring-1 ring-brown/10 short:min-h-[90px]">
        <video ref={video} src={media.url} playsInline preload="auto" onClick={player.toggle}
          onLoadedData={() => setReady(true)} className="absolute inset-0 size-full object-contain" />
        <div className="absolute right-3 top-3"><Replace onClick={onReplace} /></div>
      </div>

      <div className="mt-3"><FrameDial {...player} src={media.url} marker={marker} /></div>

      {/* On short screens the labeled slots and the "Capture …" button carry the instruction */}
      <p className="mt-3 text-sm text-brown-soft short:hidden">
        <span className="font-semibold text-brown">
          {many ? 'Capture the head, thorax and abdomen.' : 'Capture one frame of the wings.'}
        </span>{' '}
        <span className="hidden sm:inline">Pause where {many ? 'each part is' : 'they are'} clearest.</span>
      </p>
      <div className="mt-2 flex items-center justify-between gap-3 short:mt-3">
        <PartSlots slots={slots} parts={parts} onParts={onParts} active={done ? null : active} onActive={setActive} removable />
        {/* When everything is captured, clear a part with its × to capture it again */}
        {done ? (
          <span className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#e9dcc4] px-4 text-sm font-semibold text-brown">
            <Check size={16} strokeWidth={2.5} /> {many ? 'All 3 captured' : 'Captured'}
          </span>
        ) : (
          <button type="button" onClick={capture} disabled={!ready}
            className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-brown px-5 font-semibold text-honey shadow-md transition hover:brightness-125 disabled:opacity-35 disabled:hover:brightness-100 sm:px-6">
            <Camera size={18} /> Capture {activeLabel.toLowerCase()}
          </button>
        )}
      </div>
    </>
  )
}
