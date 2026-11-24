import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Camera, ScanSearch, MapPin, MessageSquareText, ClipboardCheck, Plus, Search } from 'lucide-react'
import BeeDiagram, { AbdomenDiagram, ThoraxDiagram, HeadDiagram } from '../components/BeeDiagram.jsx'
import { beePatterns } from '../data/beePatterns.js'

/*
  Tutorial — how to log a sighting, following the collect flow step by step.
  Same design language as the Beedex: warm background, serif title, the Bees / Butterflies
  toggle, numbered step cards with a small illustration each, and a sticky list of steps on
  desktop. Steps match the flow in src/collect (bees 8 steps, butterflies 5).
*/
const SERIF = '"Fraunces", Georgia, serif'
const sample = beePatterns.ternarius

// Small illustration in each step card: an icon in a tan circle, or a pattern drawing
const Icon = ({ icon: I }) => (
  <span className="grid size-12 place-items-center rounded-full bg-[#e9dcc4] text-brown"><I size={22} strokeWidth={1.75} /></span>
)
const Drawing = ({ children }) => <span className="relative block h-16 w-14">{children}</span>

const BEE = [
  { title: 'Capture', art: <Icon icon={Camera} />, body: [
    'Choose Bee, then upload a video or a photo. On a phone you can also record or take one right away.',
    'Video: pause where each part is clearest and press Capture for the head, the thorax and the abdomen. Three labeled captures are needed.',
    'Photo: one photo is enough. Tap its square to crop in on the bee.',
  ], tip: 'Video works best: you can pick the clearest moment for each body part.' },
  { title: 'Abdomen pattern', art: <Drawing><AbdomenDiagram abdomen={sample.abdomen} /></Drawing>, body: [
    'Match the color bands on the back half of the bee. Your abdomen capture sits beside the pattern you pick so you can compare them.',
    "Can't tell? Press I'm not sure and move on.",
  ] },
  { title: 'Thorax pattern', art: <Drawing><ThoraxDiagram thorax={sample.thorax} /></Drawing>, body: [
    'Look at the fuzzy middle section between the wings: all yellow, a black spot, a black band, or black toward the back.',
  ] },
  { title: 'Head pattern', art: <Drawing><HeadDiagram head={sample.head} /></Drawing>, body: [
    'Check the hair on top of the head, just behind the eyes: black, or with yellow on top.',
  ] },
  { title: 'Species', art: <Drawing><BeeDiagram pattern={sample} className="h-full w-full" /></Drawing>, body: [
    'Bees that match your picks are listed first, weighing the abdomen most, then the thorax, then the head.',
    'Tap a bee to compare: your photo next to its photo, and a diagram of your picks next to its diagram.',
  ] },
  { title: 'Date and location', art: <Icon icon={MapPin} />, body: [
    "If your photo has its date and location saved in it, they're filled in for you.",
    'Otherwise tap the map to drop a pin, search an address, or use your current location. Switch between satellite and map views.',
  ] },
  { title: 'Add comments', art: <Icon icon={MessageSquareText} />, body: [
    'Optionally note what it was doing, its sex, and anything else worth knowing, like the weather or how many you saw.',
  ] },
  { title: 'Complete log', art: <Icon icon={ClipboardCheck} />, body: [
    'Check the summary. Each section has an Edit link back to its step. Press Save log when it looks right.',
  ] },
]

const BUTTERFLY = [
  { title: 'Capture', art: <Icon icon={Camera} />, body: [
    'Choose Butterfly, then upload a video or a photo.',
    'Capture one clear frame of the wings from a video, or crop a photo to the wings.',
  ], tip: 'Open wings seen from above show the most pattern.' },
  { title: 'Identify your butterfly', art: <Icon icon={ScanSearch} />, body: [
    'Browse the photos to find the closest match. Narrow them down by searching a name or filtering by family, size, color or tails.',
    'Find close matches compares your photo with every butterfly on your device and shows the closest six at the top. Treat them as suggestions and compare the wings carefully.',
    "Choose Not in this list if none of them fit.",
  ] },
  { title: 'Date and location', art: <Icon icon={MapPin} />, body: [
    "If your photo has its date and location saved in it, they're filled in. Otherwise drop a pin, search an address, or use your location.",
  ] },
  { title: 'Add comments', art: <Icon icon={MessageSquareText} />, body: [
    'Optionally add what it was doing, its sex, and any notes.',
  ] },
  { title: 'Complete log', art: <Icon icon={ClipboardCheck} />, body: [
    'Check the summary, use Edit to fix anything, then press Save log.',
  ] },
]

const OPTIONS = [{ key: 'bees', label: 'Bees' }, { key: 'butterflies', label: 'Butterflies' }]

export default function Tutorial() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('for') === 'butterflies' ? 'butterflies' : 'bees'
  const steps = tab === 'bees' ? BEE : BUTTERFLY
  const [active, setActive] = useState(0)

  // Highlight the step in view in the side list
  useEffect(() => {
    const els = steps.map((_, i) => document.getElementById(`step-${i + 1}`)).filter(Boolean)
    const io = new IntersectionObserver((entries) => {
      const seen = entries.filter((e) => e.isIntersecting).map((e) => +e.target.id.split('-')[1] - 1)
      if (seen.length) setActive(Math.min(...seen))
    }, { rootMargin: '-30% 0px -60% 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bleed min-h-dvh w-auto bg-[#fbf8f1]">
      <div className="mx-auto max-w-5xl px-6 pb-10 pt-10 md:px-10">
        {/* Header */}
        <header className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">How it works</p>
            <h1 className="mt-2 text-5xl leading-none text-brown md:text-6xl" style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>
              Logging a sighting
            </h1>
            <p className="mt-3 max-w-lg text-brown-soft/80">
              {tab === 'bees' ? 'Eight short steps' : 'Five short steps'} from your photo or video to a saved log.
            </p>
          </div>
          <div className="flex shrink-0 gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-brown/10" role="tablist">
            {OPTIONS.map((o) => {
              const on = tab === o.key
              return (
                <button key={o.key} role="tab" aria-selected={on} onClick={() => setParams(o.key === 'bees' ? {} : { for: o.key })}
                  className={`rounded-full px-6 py-2 text-base transition ${on ? 'bg-brown font-semibold text-honey shadow-sm' : 'text-brown-soft hover:bg-[#e9dcc4]/60'}`}>
                  {o.label}
                </button>
              )
            })}
          </div>
        </header>

        <div className="mt-8 grid gap-10 border-t border-brown/10 pt-8 lg:grid-cols-[1fr_13rem]">
          {/* Steps */}
          <ol className="space-y-4">
            {steps.map((s, i) => (
              <li key={s.title} id={`step-${i + 1}`} className="scroll-mt-24 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brown/10 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">{s.art}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber">Step {i + 1}</p>
                    <h2 className="mt-1 text-2xl leading-tight text-brown" style={{ fontFamily: SERIF, fontWeight: 600 }}>{s.title}</h2>
                    {s.body.map((p) => <p key={p} className="mt-2 leading-relaxed text-brown-soft">{p}</p>)}
                    {s.tip && (
                      <p className="mt-3 rounded-2xl bg-cream px-3 py-2 text-sm text-brown ring-1 ring-brown/10">
                        <span className="font-semibold">Tip:</span> {s.tip}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* Desktop: list of steps that follows the scroll */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24" aria-label="Steps">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-brown-soft/60">Steps</p>
              <ul className="space-y-0.5 border-l border-brown/10">
                {steps.map((s, i) => (
                  <li key={s.title}>
                    <a href={`#step-${i + 1}`}
                      className={`-ml-px block border-l-2 py-1.5 pl-3 text-sm transition ${
                        active === i ? 'border-brown font-semibold text-brown' : 'border-transparent text-brown-soft/70 hover:text-brown'}`}>
                      {i + 1}. {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>

        {/* Start */}
        <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl bg-cream px-6 py-8 text-center ring-1 ring-brown/10">
          <p className="text-2xl text-brown" style={{ fontFamily: SERIF, fontWeight: 600 }}>Ready to log one?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/collect" className="flex items-center gap-2 rounded-full bg-brown px-6 py-3 font-semibold text-honey shadow-md transition hover:brightness-125">
              <Plus size={18} strokeWidth={2.25} /> Start a log
            </Link>
            <Link to="/beedex" className="flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-brown ring-1 ring-brown/15 transition hover:bg-[#e9dcc4]/50">
              <Search size={18} /> Browse the Beedex
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
