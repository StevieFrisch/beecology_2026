import { Link } from 'react-router-dom'

/*
  Homepage — "Editorial serif" design.
  Layout measured from the live app: 64px padding, 16px gap,
  title 60px → 96px (md), tagline 18px → 24px, button 250px wide.
*/
const palette = {
  brown: '#2b1d0e',   // title, darkest text
  text: '#3d2a12',    // tagline, link
  amber: '#a35a00',   // italic "Bee"
  kicker: '#6b3d00',
  honey: '#ffdb70',   // brand yellow
}

const SERIF = '"Fraunces", Georgia, serif'
const CREAM = '253, 246, 227' // --color-cream as RGB, for translucent layers

/*
  Depth blur: blurs and softens the photo only behind the text, like a shallow
  depth of field, so the title lifts off the backdrop while the bee stays sharp.
  A radial mask fades the effect out toward the bee.
*/
const DEPTH_MASK = 'radial-gradient(ellipse 60% 65% at 22% 30%, #000 40%, transparent 75%)'
const depthBlur = {
  backdropFilter: 'blur(14px) saturate(0.9)',
  WebkitBackdropFilter: 'blur(14px) saturate(0.9)',
  background: `rgba(${CREAM},.35)`,
  maskImage: DEPTH_MASK,
  WebkitMaskImage: DEPTH_MASK,
}

export default function Home() {
  return (
    <div
      className="bleed relative h-dvh w-auto overflow-hidden bg-cover bg-[position:65%_center] bg-no-repeat"
      style={{ backgroundImage: `url(/home-bee.jpg)` }}
    >
      <div className="pointer-events-none absolute inset-0" style={depthBlur} />

      <div className="relative flex flex-col gap-4 p-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] md:text-sm" style={{ color: palette.kicker }}>
          Citizen science for pollinators
        </p>
        <h1
          className="text-6xl leading-none md:text-8xl"
          style={{ color: palette.brown, fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}
        >
          <span style={{ color: palette.amber, fontStyle: 'italic' }}>Bee</span>cology
        </h1>
        <h2 className="max-w-xs text-lg md:max-w-md md:text-2xl" style={{ color: palette.text }}>
          Protecting our pollinators through the power of citizen science.
        </h2>
        <div className="block w-fit text-center">
          <Link
            to="/collect"
            className="mb-4 inline-block w-[250px] rounded-full px-[26px] py-3 text-[1.6rem] leading-[1.5] shadow-lg transition hover:brightness-125"
            style={{ background: palette.brown, color: palette.honey }}
          >
            Collect Data
          </Link>
          <br />
          <Link to="/tutorial" className="font-medium hover:opacity-70" style={{ color: palette.text }}>
            View the Tutorial →
          </Link>
        </div>
      </div>
    </div>
  )
}
