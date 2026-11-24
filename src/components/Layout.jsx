import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { House, BookMarked, NotebookPen, Plus, CircleHelp, CircleUserRound, LogOut } from 'lucide-react'
import { bees } from '../data'
import { asset } from '../config.js'
import { DEMO_SIGNED_IN, sampleUser } from '../data/sampleAccount.js'

const nav = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/beedex', label: 'Beedex', icon: BookMarked },
  { to: '/logs', label: 'Logs', icon: NotebookPen },
]
const collect = { to: '/collect', label: 'Collect', icon: Plus }

/*
  Bottom dock — cream glass capsule centered at the bottom of the screen.
  Icon in a pill with a label underneath; the current page's whole tab is soft tan.
  Collect is a separate round button beside the capsule (see Dock below).

  Sizes: phones use the base size (fits a 375px screen);
  tablets and up (md:) are 20% bigger.
    capsule padding 8 → 10px · pill 56×36 → 67×43px · icon 22 → 26px · label 12 → 14px
    plus extra horizontal spacing (gap 12px, item padding 8px) so the dock is ~20% wider
*/
function DockItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      className={({ isActive }) =>
        `flex flex-col items-center rounded-2xl px-1 py-1.5 text-xs transition md:rounded-[19px] md:px-2 md:py-[7px] md:text-sm ${
          // Selected: soft tan, a stronger version of the hover tint (honey was too loud)
          isActive ? 'bg-[#e9dcc4] font-semibold text-brown' : 'text-brown-soft hover:bg-brown/5'}`}
    >
      {({ isActive }) => (
        <>
          <span
            className={`grid h-9 w-14 place-items-center rounded-full transition md:h-[43px] md:w-[67px] ${
              isActive ? 'text-brown' : 'text-brown-soft'}`}
          >
            <Icon className="size-[22px] md:size-[26px]" strokeWidth={1.75} />
          </span>
          <span className="dock-label">{label}</span>
        </>
      )}
    </NavLink>
  )
}

/*
  Dock group: the nav capsule plus a separate round Collect button to its right.
  The pair is centered together at the bottom.

  Labels (.dock-label, see index.css) are hidden on devices with a mouse and slide
  in when the pointer enters the group; the capsule grows to fit them. Touch
  devices can't hover, so they always show labels. The Collect circle (.dock-circle)
  resizes with the capsule so the two always match in height.

  The circle sits in a fixed slot as wide as its open size (84px / 101px), centered
  inside it. The group's width never changes, so the capsule doesn't shift sideways
  when the circle grows, and the circle expands evenly from its own center.
*/
function Dock() {
  return (
    <div className="dock fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-stretch gap-2.5 md:bottom-6 md:gap-4">
      <nav className="flex items-center gap-1 rounded-[28px] bg-cream/85 p-2 shadow-xl ring-1 ring-brown/10 backdrop-blur-md md:gap-3 md:rounded-[34px] md:p-2.5">
        {nav.map((n) => <DockItem key={n.to} {...n} />)}
      </nav>
      <div className="grid w-[84px] shrink-0 place-items-center md:w-[101px]">
        <CollectButton />
      </div>
    </div>
  )
}

function CollectButton() {
  const { to, label, icon: Icon } = collect
  return (
    <NavLink
      to={to}
      aria-label={label}
      className={({ isActive }) =>
        // Diameter = capsule height: 84/101px with labels, 64/77px collapsed (phones / md+)
        `dock-circle flex shrink-0 flex-col items-center justify-center rounded-full bg-brown text-honey shadow-xl hover:brightness-125 [--circle:84px] [--circle-c:64px] md:[--circle:101px] md:[--circle-c:77px] ${
          isActive ? 'ring-4 ring-[#e9dcc4]' : 'ring-1 ring-brown/10'}`}
    >
      <Icon className="size-[30px] md:size-9" strokeWidth={2} />
      <span className="dock-label text-xs font-semibold md:text-sm">{label}</span>
    </NavLink>
  )
}

/*
  Top-right actions on every page (no header bar): tutorial and account float as
  cream glass circles — 52px (60px on tablets and up) with 28px (30px) icons.
  Pages other than the homepage leave CORNER_INSET px at the top; with their own
  top padding that keeps content clear of the buttons (bottom edge at 68 / 84px).
*/
const CORNER_INSET = 48

function CornerActions() {
  const go = useNavigate()
  const btn =
    'grid size-[52px] place-items-center rounded-full bg-cream/85 text-brown shadow-lg ring-1 ring-brown/10 backdrop-blur-md transition hover:bg-cream md:size-[60px]'
  return (
    <div className="fixed right-4 top-4 z-50 flex gap-2.5 md:right-6 md:top-6 md:gap-3">
      <button aria-label="Tutorial" className={btn} onClick={() => go('/tutorial')}>
        <CircleHelp className="size-7 md:size-[30px]" strokeWidth={1.75} />
      </button>
      {DEMO_SIGNED_IN ? (
        <AccountMenu btn={btn} />
      ) : (
        <button aria-label="Sign in" className={btn} onClick={() => go('/login')}>
          <CircleUserRound className="size-7 md:size-[30px]" strokeWidth={1.75} />
        </button>
      )}
    </div>
  )
}

/*
  Signed in (demo): the account circle shows the person's initials and opens a small
  menu with their name, a link to their logs and Sign out. Closes on outside click or Esc.
*/
function AccountMenu({ btn }) {
  const go = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const item = 'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-brown transition hover:bg-[#e9dcc4]/60'
  return (
    <div ref={ref} className="relative">
      <button aria-label={`Account: ${sampleUser.name}`} aria-expanded={open} aria-haspopup="menu"
        className={btn} onClick={() => setOpen(!open)}>
        <span className="grid size-[38px] place-items-center rounded-full bg-brown text-sm font-semibold text-honey md:size-[44px] md:text-base">
          {sampleUser.initials}
        </span>
      </button>
      {open && (
        <div role="menu"
          className="absolute right-0 top-full mt-2 w-64 rounded-3xl bg-cream/95 p-2 shadow-xl ring-1 ring-brown/10 backdrop-blur-md">
          <div className="px-3 pb-3 pt-2">
            <p className="font-semibold text-brown">{sampleUser.name}</p>
            <p className="truncate text-sm text-brown-soft/70">{sampleUser.email}</p>
          </div>
          <div className="border-t border-brown/10 pt-1">
            <button role="menuitem" className={item} onClick={() => go('/logs')}>
              <NotebookPen size={18} strokeWidth={1.75} /> Your logs
            </button>
            <button role="menuitem" className={item} onClick={() => go('/login')}>
              <LogOut size={18} strokeWidth={1.75} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/*
  Warm the browser cache with the Beedex bee photos once the current page is idle, so the
  Beedex usually opens with its photos already downloaded. Runs once per visit and is
  skipped when the visitor has data saver on. (Butterflies aren't prefetched: 120 photos
  is too much to download speculatively; they get placeholders and lazy loading instead.)
*/
let prefetched = false
function prefetchBeePhotos() {
  if (prefetched || navigator.connection?.saveData) return
  prefetched = true
  const run = () => bees.forEach((b) => { const img = new Image(); img.decoding = 'async'; img.src = asset(b.image) })
  'requestIdleCallback' in window ? window.requestIdleCallback(run, { timeout: 4000 }) : setTimeout(run, 1500)
}

// Background shown behind the page during a trackpad bounce, per route.
const BOUNCE_BG = { '/beedex': '#fbf8f1', '/logs': '#fbf8f1', '/login': '#fbf8f1', '/signup': '#fbf8f1', '/collect': '#fbf8f1' }
const bounceBg = (path) => BOUNCE_BG[path] || (/^\/(beedex\/(bee|butterfly|family)\/|logs\/|tutorial)/.test(path) ? '#fbf8f1' : '')

export default function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const insetT = isHome ? 0 : CORNER_INSET

  useEffect(() => {
    const html = document.documentElement
    // New page starts at the top
    window.scrollTo(0, 0)
    // Homepage: exactly one screen, no scroll and no bounce
    html.style.overflow = isHome ? 'hidden' : ''
    html.style.overscrollBehavior = isHome ? 'none' : ''
    // Other pages: the document scrolls and bounces; match the bounce area to the page
    html.style.backgroundColor = bounceBg(pathname)
  }, [pathname, isHome])

  // After the first page has loaded, quietly fetch the Beedex bee photos in the background
  useEffect(() => {
    if (document.readyState === 'complete') prefetchBeePhotos()
    else window.addEventListener('load', prefetchBeePhotos, { once: true })
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <CornerActions />

      {/*
        --inset-t / --inset-b: room pages leave so content clears the corner buttons and dock.
        Full-bleed sections (homepage photo, Beedex background) use `.bleed` to run underneath.
      */}
      <main
        style={{ '--inset-t': `${insetT}px` }}
        className="flex flex-1 flex-col pt-[var(--inset-t)] pb-[var(--inset-b)] [--inset-b:100px] md:[--inset-b:130px]"
      >
        <Outlet />
      </main>

      <Dock />
    </div>
  )
}
