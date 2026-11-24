import CloseButton from './CloseButton.jsx'

/*
  Species detail, measured from the live app:
  content padding 64px; title 48px medium; subtitle 24px;
  body: flex, 32px gap, 32px padding; photo 384px tall, 16px corners, object-cover;
  fields: 16px gap, label 24px, value 16px.
  Bees: centered title, photo and fields side by side.
  Butterflies: left title (indented 32px, subtitle 80% opacity), photo + credit, fields wrap below.
*/
export function DetailShell({ title, subtitle, image, credit, variant = 'bee', children }) {
  const bee = variant === 'bee'
  return (
    <div className="relative p-16">
      <CloseButton />
      <div className={`text-5xl font-medium ${bee ? 'text-center' : 'ml-8'}`}>{title}</div>
      <div className={`text-2xl ${bee ? 'text-center' : 'ml-8 text-ink/80'}`}>{subtitle}</div>
      <div className={`flex gap-8 p-8 ${bee ? 'flex-col md:flex-row' : 'w-fit flex-wrap'}`}>
        <div className="shrink-0">
          <img src={image} alt={title} className="h-96 max-w-full rounded-2xl object-cover" />
          {credit && <div>{credit}</div>}
        </div>
        <div className={`grid grid-cols-1 content-start gap-4 ${bee ? '' : 'max-w-lg'}`}>{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children }) {
  if (children == null || (Array.isArray(children) && !children.length)) return null
  return (
    <div>
      <div className="text-2xl">{label}</div>
      {Array.isArray(children) ? children.map((c) => <div key={c}>{c}</div>) : <div>{children}</div>}
    </div>
  )
}
