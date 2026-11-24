import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, Check } from 'lucide-react'
import { deleteDraft } from '../data'
import { storeDraft, persistImage } from './drafts.js'
import { cropToDataURL, mainCapture } from './Crop.jsx'

/*
  Step-by-step shell for the collection flow, in the redesign's style: warm background,
  serif step title, brown progress bar and pill buttons.

  steps: an array, or a function of the data so far (the flow's later steps depend on
         whether it's a bee or a butterfly). Each step: { title, render({ data, set }), valid?(data) }
  onFinish(data) runs on the last step's "Save log", then the person lands on Logs.

  I'm not sure (steps with `unsure: '<field>'`): a secondary button beside Next that records
  the answer as 'unsure' and moves on, for when a feature can't be made out in the photo.

  Save as draft (every step): stores the data and the current step, then goes to Logs, where
  the draft can be continued. draftId/initialStep resume a saved draft; finishing deletes it.
*/
const SERIF = '"Fraunces", Georgia, serif'

export default function Wizard({ steps: stepsProp, onFinish, initial = {}, initialStep = 0, draftId }) {
  const [i, setI] = useState(initialStep)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState(initial)
  const nav = useNavigate()
  const set = (patch) => setData((d) => ({ ...d, ...patch }))
  const steps = typeof stepsProp === 'function' ? stepsProp(data) : stepsProp
  const step = steps[Math.min(i, steps.length - 1)]
  const last = i === steps.length - 1
  const ok = step.valid ? !!step.valid(data) : true
  const hint = step.hint?.(data)
  const unsureField = step.unsure
  const isUnsure = unsureField && data[unsureField] === 'unsure'
  // Phones: with four buttons in the row, Back shrinks to just its arrow
  const compact = !!unsureField
  const go = (n) => { setI(n); window.scrollTo(0, 0) }
  // Lock page scrolling while the step fits on screen; allow it only when the content is
  // genuinely taller (very short screens, or long steps). Rechecked on any size change.
  useEffect(() => {
    const html = document.documentElement
    const check = () => {
      const fits = html.scrollHeight <= window.innerHeight + 1
      html.style.overflow = fits ? 'hidden' : ''
      html.style.overscrollBehavior = fits ? 'none' : ''
    }
    const ro = new ResizeObserver(check)
    ro.observe(document.body)
    window.addEventListener('resize', check)
    check()
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', check)
      html.style.overflow = ''
      html.style.overscrollBehavior = ''
    }
  }, [])

  // Jump to a step by its title (the review step's Edit links)
  const goTo = (title) => { const n = steps.findIndex((st) => st.title === title); if (n >= 0) go(n) }

  // Nothing worth keeping yet on an untouched first step
  const canDraft = i > 0 || !!(data.media || data.kind)
  const saveAsDraft = async () => {
    setSaving(true)
    await storeDraft({ id: draftId || crypto.randomUUID(), data, step: i, stepTitle: step.title, stepCount: steps.length })
    nav('/logs')
  }
  // The log keeps the square crop of the photo as its image, so it survives a reload and matches
  // the previews. If the photo can't be cropped (e.g. another site blocks it), keep it as is.
  const finish = async () => {
    setSaving(true)
    // The log's photo/thumbnail: the thorax capture (bees) or the wings (butterflies), as cropped
    const { src, crop } = mainCapture(data)
    const frame = src ? await cropToDataURL(src, crop).catch(() => persistImage(src)) : undefined
    onFinish({ ...data, frames: frame ? [frame] : [] })
    if (draftId) deleteDraft(draftId)
    nav('/logs')
  }

  // Cancel returns to wherever the person came from (home if they opened this page directly)
  const exit = () => (window.history.state?.idx > 0 ? nav(-1) : nav('/'))

  return (
    // One screen tall (the step body stretches to fill it); grows only if the content can't fit
    <div className="bleed flex min-h-dvh w-auto flex-col bg-[#fbf8f1]">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-3 pt-3 md:px-10 md:pt-4 lg:pt-6 short:lg:pt-4">
        {/* Progress: one segment per step */}
        {/* Phones and tablets: the bar sits beside the corner buttons (right padding keeps it clear of them) */}
        {/* Back (top left, on every step): the previous step, or out of the flow on step 1 */}
        <div className="mb-5 flex items-center gap-3 pr-[124px] md:pr-[150px] lg:pr-0 short:mb-3">
          <button type="button" onClick={() => (i === 0 ? exit() : go(i - 1))}
            className="-my-2 -ml-1 flex shrink-0 items-center gap-1 rounded-full py-0.5 pl-1 pr-2 text-sm leading-none font-medium text-brown-soft transition hover:bg-brown/5 hover:text-brown">
            <ArrowLeft size={16} /> Back
          </button>
          <ol className="flex flex-1 items-center gap-1.5" aria-hidden="true">
            {steps.map((s, n) => (
              <li key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= i ? 'bg-brown' : 'bg-brown/10'}`} />
            ))}
          </ol>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">Step {i + 1} of {steps.length}</p>
        <h1 className="mt-2.5 text-4xl leading-none text-brown md:text-5xl short:!text-3xl"
          style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {step.title}
        </h1>

        <div className="mt-7 flex flex-1 flex-col short:mt-5">{step.render({ data, set, goTo })}</div>

        {/* What's still needed before Next turns on (phones: its own line, since the buttons fill the row) */}
        {!ok && hint && <p className="mt-3 text-center text-xs text-brown-soft/70 sm:hidden">{hint}</p>}

        <div className="mt-3 flex items-center gap-2 border-t border-brown/10 pt-3 sm:mt-4 sm:gap-3">
          <button
            onClick={() => (i === 0 ? exit() : go(i - 1))}
            aria-label={i === 0 ? 'Cancel' : 'Back'}
            className={`flex h-11 shrink-0 items-center justify-center gap-1 rounded-full bg-white text-sm font-medium text-brown shadow-sm ring-1 ring-brown/15 transition hover:bg-[#e9dcc4]/50 sm:px-5 ${
              compact && i > 0 ? 'w-11 sm:w-auto' : 'px-4'}`}
          >
            {i === 0 ? 'Cancel' : <><ChevronLeft size={16} /><span className={compact ? 'hidden sm:inline' : ''}>Back</span></>}
          </button>
          {/* Secondary: keep what's entered so far and finish later */}
          <button
            onClick={saveAsDraft}
            disabled={!canDraft || saving}
            className={`flex h-11 shrink-0 items-center rounded-full text-sm font-medium text-brown ring-1 ring-inset ring-brown/30 transition hover:bg-[#e9dcc4]/60 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent sm:px-5 ${
              compact ? 'px-3' : 'px-4'}`}
          >
            <span>{saving ? 'Saving…' : <>Save <span className="hidden sm:inline">as </span>draft</>}</span>
          </button>
          <div className="min-w-0 flex-1">
            {!ok && hint && <p className="hidden text-center text-sm text-brown-soft/70 sm:block">{hint}</p>}
          </div>
          {/* Secondary to Next: skip this choice when it can't be made out */}
          {unsureField && (
            <button
              onClick={() => { set({ [unsureField]: 'unsure' }); go(i + 1) }}
              aria-pressed={isUnsure}
              className={`flex h-11 shrink-0 items-center rounded-full px-3 text-sm font-medium text-brown ring-1 ring-inset transition hover:bg-[#e9dcc4]/60 sm:px-5 ${
                isUnsure ? 'bg-[#e9dcc4] ring-brown/50' : 'ring-brown/30'}`}
            >
              <span><span className="hidden sm:inline">I'm </span><span className="sm:hidden">Not</span><span className="hidden sm:inline">not</span> sure</span>
            </button>
          )}
          <button
            disabled={!ok || saving}
            onClick={() => (last ? finish() : go(i + 1))}
            className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-brown text-sm font-semibold text-honey shadow-md transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:brightness-100 sm:px-7 ${compact ? 'px-5' : 'px-6'}`}
          >
            {last ? <><Check size={16} /> Save log</> : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
