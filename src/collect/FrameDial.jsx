import { useEffect, useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'

/*
  Frame dial for the Capture step's video: a ruler of frame ticks that slides under a fixed
  honey center line. Drag sideways to move frame by frame; flick it and it keeps spinning,
  slowing to a stop (momentum). A thin filmstrip of the whole clip above it (the overview)
  jumps anywhere with a tap or drag.

  Player state comes from useVideo():
    time, duration, playing, toggle(), seek(seconds); marker = time of the captured frame or null
*/
export const FPS = 30
const TICK = 9 // px between ticks

export const fmt = (s = 0) => {
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

// Player state for a <video> ref; follows playback smoothly while playing
export function useVideo(ref, src) {
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    setTime(0); setDuration(0); setPlaying(false)
    let raf
    const tick = () => { setTime(v.currentTime); raf = requestAnimationFrame(tick) }
    const onPlay = () => { setPlaying(true); raf = requestAnimationFrame(tick) }
    const onPause = () => { setPlaying(false); cancelAnimationFrame(raf); setTime(v.currentTime) }
    const onMeta = () => setDuration(v.duration || 0)
    const onSeek = () => setTime(v.currentTime)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('ended', onPause)
    v.addEventListener('loadedmetadata', onMeta)
    v.addEventListener('seeked', onSeek)
    v.addEventListener('timeupdate', onSeek)
    if (v.readyState >= 1) onMeta()
    return () => {
      cancelAnimationFrame(raf)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('ended', onPause)
      v.removeEventListener('loadedmetadata', onMeta)
      v.removeEventListener('seeked', onSeek)
      v.removeEventListener('timeupdate', onSeek)
    }
  }, [ref, src])

  const toggle = () => { const v = ref.current; if (v) v.paused ? v.play() : v.pause() }
  const seek = (t) => {
    const v = ref.current
    if (!v || !duration) return
    if (!v.paused) v.pause()
    v.currentTime = Math.min(Math.max(0, t), duration - 0.01)
    setTime(v.currentTime)
  }
  return { time, duration, playing, toggle, seek }
}

function PlayButton({ playing, toggle }) {
  return (
    <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}
      className="grid size-9 shrink-0 place-items-center rounded-full bg-brown text-honey transition hover:brightness-125">
      {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
    </button>
  )
}

/*
  Overview: a thin filmstrip of the whole clip. Tap or drag anywhere on it to jump there.
*/
function Overview({ src, time, duration, seek, marker }) {
  const thumbs = useThumbnails(src, duration, 12)
  const ref = useRef(null)
  const at = (e) => {
    const r = ref.current.getBoundingClientRect()
    seek(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * duration)
  }
  const pct = duration ? (time / duration) * 100 : 0
  return (
    <div ref={ref} style={{ touchAction: 'none' }}
      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); at(e) }}
      onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) at(e) }}
      className="relative h-7 cursor-pointer select-none overflow-hidden rounded-lg bg-brown/10 ring-1 ring-brown/15">
      <div className="flex h-full">
        {thumbs.map((t, n) => <img key={n} src={t} alt="" draggable={false} className="h-full min-w-0 flex-1 object-cover" />)}
      </div>
      <div className="absolute inset-y-0 right-0 bg-[#fbf8f1]/40" style={{ left: `${pct}%` }} />
      {marker != null && duration > 0 && (
        <span className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-honey ring-2 ring-brown"
          style={{ left: `${(marker / duration) * 100}%` }} />
      )}
      <div className="absolute inset-y-0 w-[3px] -translate-x-1/2 rounded-full bg-honey shadow-[0_0_0_1.5px_#2b1d0e]" style={{ left: `${pct}%` }} />
    </div>
  )
}

export function FrameDial({ src, time, duration, playing, toggle, seek, marker }) {
  const box = useRef(null)
  const drag = useRef(null) // { x, t } of the last pointer sample while dragging
  const pos = useRef(0) // current position in frames (fractional while dragging/coasting)
  const vel = useRef(0) // frames per ms, for momentum
  const anim = useRef(0)
  const [width, setWidth] = useState(300)

  const total = Math.max(0, Math.floor(duration * FPS) - 1)
  const frame = Math.round(time * FPS)
  const clamp = (f) => Math.min(Math.max(0, f), total)
  const go = (f) => { pos.current = clamp(f); seek(pos.current / FPS) }
  const stopCoast = () => cancelAnimationFrame(anim.current)

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    if (box.current) ro.observe(box.current)
    return () => { ro.disconnect(); stopCoast() }
  }, [])

  const onDown = (e) => {
    stopCoast()
    e.currentTarget.setPointerCapture(e.pointerId)
    pos.current = time * FPS
    vel.current = 0
    drag.current = { x: e.clientX, t: e.timeStamp }
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const dt = Math.max(1, e.timeStamp - d.t)
    const frames = -(e.clientX - d.x) / TICK
    go(pos.current + frames)
    vel.current = frames / dt
    drag.current = { x: e.clientX, t: e.timeStamp }
  }
  const onUp = (e) => {
    const d = drag.current
    drag.current = null
    // Only coast if the finger was still moving when it lifted
    if (!d || e.timeStamp - d.t > 80 || Math.abs(vel.current) < 0.02) return
    // Flicks carry further than the drag itself; capped so one hard flick covers ~7 s at most
    const MAX = 0.6 // frames per ms
    let v = Math.max(-MAX, Math.min(MAX, vel.current * 4))
    let prev = performance.now()
    const step = (now) => {
      const dt = now - prev
      prev = now
      v *= Math.pow(0.997, dt)
      const next = pos.current + v * dt
      go(next)
      if (Math.abs(v) > 0.004 && next > 0 && next < total) anim.current = requestAnimationFrame(step)
    }
    anim.current = requestAnimationFrame(step)
  }

  // Ticks around the current frame, TICK px apart
  const span = Math.ceil(width / TICK / 2) + 2
  const ticks = []
  for (let f = Math.max(0, frame - span); f <= Math.min(total, frame + span); f++) ticks.push(f)
  const x = (f) => `calc(50% + ${(f - frame) * TICK}px)`
  const markerFrame = marker != null ? Math.round(marker * FPS) : null

  return (
    // Nothing in the dial or overview is selectable, so dragging never highlights it
    <div className="flex select-none flex-col gap-1.5 [-webkit-touch-callout:none] [-webkit-user-select:none]">
      {/* Overview lines up with the dial: same insets as the play button and time column */}
      <div className="pl-[48px] pr-[68px]">
        <Overview src={src} time={time} duration={duration} seek={(t) => { stopCoast(); seek(t) }} marker={marker} />
      </div>
      <div className="flex items-center gap-3">
        <PlayButton playing={playing} toggle={() => { stopCoast(); toggle() }} />
        <div ref={box}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          onWheel={(e) => { stopCoast(); go(time * FPS + Math.sign(e.deltaX || e.deltaY)) }}
          style={{ touchAction: 'none' }}
          className="relative h-12 min-w-0 flex-1 cursor-ew-resize select-none overflow-hidden rounded-xl bg-white ring-1 ring-brown/15">
          {ticks.map((f) => (
            <div key={f} className="absolute bottom-0" style={{ left: x(f) }}>
              <div className={`w-px -translate-x-1/2 ${f % FPS === 0 ? 'h-5 bg-brown/60' : f % 5 === 0 ? 'h-3 bg-brown/35' : 'h-2 bg-brown/20'}`} />
              {f % FPS === 0 && (
                <span className="absolute bottom-[31px] -translate-x-1/2 text-[10px] tabular-nums leading-none text-brown-soft/70">{fmt(f / FPS)}</span>
              )}
            </div>
          ))}
          {markerFrame != null && Math.abs(markerFrame - frame) * TICK < width / 2 && (
            <span className="absolute bottom-[19px] size-2.5 -translate-x-1/2 rounded-full bg-honey ring-2 ring-brown" style={{ left: x(markerFrame) }} />
          )}
          {/* Fixed center line = current frame; edges fade out */}
          <div className="pointer-events-none absolute bottom-1 left-1/2 h-5 w-[3px] -translate-x-1/2 rounded-full bg-honey shadow-[0_0_0_1.5px_#2b1d0e]" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />
        </div>
        <span className="w-14 shrink-0 text-xs tabular-nums leading-tight text-brown-soft/80">
          {fmt(time)}<br /><span className="text-brown-soft/60">frame {frame}</span>
        </span>
      </div>
    </div>
  )
}

/*
  Small thumbnails spread across a video, for the overview strip. Uses a second, hidden video
  element so the main player isn't disturbed.
*/
function useThumbnails(src, duration, count) {
  const [thumbs, setThumbs] = useState([])
  useEffect(() => {
    if (!src || !duration) return
    let cancelled = false
    setThumbs([])
    const v = document.createElement('video')
    v.muted = true
    v.preload = 'auto'
    v.src = src
    const c = document.createElement('canvas')
    const run = async () => {
      await new Promise((r) => (v.readyState >= 1 ? r() : v.addEventListener('loadedmetadata', r, { once: true })))
      c.height = 56
      c.width = Math.round((56 * v.videoWidth) / v.videoHeight) || 100
      const out = []
      for (let n = 0; n < count && !cancelled; n++) {
        v.currentTime = ((n + 0.5) / count) * duration
        await new Promise((r) => v.addEventListener('seeked', r, { once: true }))
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height)
        out.push(c.toDataURL('image/jpeg', 0.7))
        if (!cancelled) setThumbs([...out])
      }
    }
    run().catch(() => {})
    return () => { cancelled = true; v.removeAttribute('src'); v.load() }
  }, [src, duration, count])
  return thumbs
}
