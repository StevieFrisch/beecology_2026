import { useEffect, useRef, useState } from 'react'

/*
  Image that never shows as a blank box:
  - while loading, its frame shows a warm shimmering placeholder (.img-placeholder in index.css)
  - when the image arrives it fades in over the placeholder
  - images already in the browser cache appear immediately, without a fade

  priority: load right away at high priority (use for what's visible first);
            otherwise the browser loads it lazily as it nears the screen.
*/
export default function FadeImage({ src, alt = '', className = '', frameClassName = '', priority = false, ...rest }) {
  const ref = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [instant, setInstant] = useState(false)

  // Reset when the source changes (e.g. moving to the next bee)
  useEffect(() => {
    setLoaded(false)
    setInstant(false)
    const img = ref.current
    if (img && img.complete && img.naturalWidth > 0) { setInstant(true); setLoaded(true) }
  }, [src])

  return (
    <div className={`relative overflow-hidden ${loaded ? '' : 'img-placeholder'} ${frameClassName}`}>
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        // lowercase: React 18 passes it straight through as the HTML attribute
        {...{ fetchpriority: priority ? 'high' : 'auto' }}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        // Animate opacity (the fade) and transform (hover zoom on cards); cached images skip the fade
        className={`${className} duration-500 ease-out ${instant ? 'transition-transform' : 'transition-[opacity,transform]'} ${loaded ? 'opacity-100' : 'opacity-0'}`}
        {...rest}
      />
    </div>
  )
}
