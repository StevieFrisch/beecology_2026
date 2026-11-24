import { Link } from 'react-router-dom'
import FadeImage from './FadeImage.jsx'

const SERIF = '"Fraunces", Georgia, serif'

/*
  Species / family card.

  variant:
    'classic'   — the live app's card: 416px tall, white, image 256px on top,
                  title 30px semibold, subtitle 18px (8px corners; `square` → 4px)
    'editorial' — no box: a tall rounded photo, serif italic name and small caption below
    'overlay'   — full-bleed photo with the name set over a dark fade at the bottom
    'framed'    — cream card with an inset rounded photo, serif name, and a small
                  `meta` pill (e.g. active months)
*/
export default function SpeciesCard({ to, image, title, subtitle, meta, square, italic = true, variant = 'classic', priority = false }) {
  const serifTitle = { fontFamily: SERIF, fontWeight: 600, fontStyle: italic ? 'italic' : 'normal', letterSpacing: '-0.01em' }

  if (variant === 'editorial') {
    return (
      <Link to={to} className="group block w-full">
        {/* Placeholder shimmers in the photo's frame until the photo fades in */}
        <FadeImage src={image} priority={priority}
          frameClassName="aspect-[4/5] rounded-2xl ring-1 ring-brown/10"
          className="h-full w-full object-cover group-hover:scale-[1.04]" />
        <h2 className="mt-3 text-2xl leading-tight text-brown" style={serifTitle}>{title}</h2>
        <p className="mt-0.5 text-sm text-brown-soft/80">{subtitle}</p>
      </Link>
    )
  }

  if (variant === 'overlay') {
    return (
      <Link to={to} className="group relative block w-full overflow-hidden rounded-3xl bg-brown shadow-md">
        <img src={image} alt="" loading="lazy"
          className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.05]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <h2 className="text-2xl leading-tight" style={serifTitle}>{title}</h2>
          <p className="mt-1 text-sm text-white/80">{subtitle}</p>
        </div>
      </Link>
    )
  }

  if (variant === 'framed') {
    return (
      <Link to={to}
        className="group block w-full rounded-[28px] bg-cream p-3 ring-1 ring-brown/10 transition hover:-translate-y-1 hover:shadow-lg">
        <div className="overflow-hidden rounded-[20px]">
          <img src={image} alt="" loading="lazy"
            className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        </div>
        <div className="px-2 pb-2 pt-3">
          <h2 className="text-[22px] leading-tight text-brown" style={serifTitle}>{title}</h2>
          <p className="mt-0.5 text-sm text-brown-soft/80">{subtitle}</p>
          {meta && (
            <span className="mt-3 inline-block rounded-full bg-[#e9dcc4] px-2.5 py-1 text-xs font-medium text-brown">
              {meta}
            </span>
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={to}
      className={`flex h-104 w-full flex-col justify-center overflow-hidden bg-white shadow-sm ${
        square ? 'rounded-sm' : 'rounded-lg'
      }`}
    >
      <figure className="flex">
        <img src={image} alt="" loading="lazy" className="h-64 w-full object-cover object-center" />
      </figure>
      <div className="h-40 p-4">
        <h2 className="flex text-3xl font-semibold">{title}</h2>
        <p className="text-lg">{subtitle}</p>
      </div>
    </Link>
  )
}
