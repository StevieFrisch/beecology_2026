import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/*
  Shared layout and form parts for Sign in / Create account.
  Minimal and undistracting: no photo or card, just the serif title and the form in a
  narrow column on the warm background. White rounded fields with an amber focus ring,
  brown pill buttons, Google as the only other way to sign in.
*/
const SERIF = '"Fraunces", Georgia, serif'

export function AuthLayout({ title, children, footer, onSubmit }) {
  return (
    <div className="bleed min-h-dvh w-auto bg-[#fbf8f1]">
      <div className="mx-auto w-full max-w-sm px-6 pb-6 pt-10 md:pt-20">
        <h1 className="text-5xl leading-none text-brown" style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {title}
        </h1>

        <form
          noValidate
          // No account backend in this redesign: submitting does nothing
          onSubmit={(e) => { e.preventDefault(); onSubmit?.(e) }}
          className="mt-6 space-y-3.5"
        >
          {children}
        </form>

        {footer && <div className="mt-6 border-t border-brown/10 pt-5 text-center text-sm text-brown-soft/80">{footer}</div>}
      </div>
    </div>
  )
}

const fieldCls =
  'mt-1.5 h-11 w-full rounded-2xl bg-white px-4 text-brown shadow-sm ring-1 ring-brown/15 outline-none transition placeholder:text-brown-soft/40 focus:ring-2 focus:ring-amber/50'

export function Input({ label, hint, aside, ...props }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm font-semibold text-brown">
        {label}
        {aside}
      </span>
      <input {...props} className={fieldCls} />
      {hint && <span className="mt-1.5 block text-xs text-brown-soft/70">{hint}</span>}
    </label>
  )
}

// Password field with a show / hide toggle inside the field
export function PasswordInput({ label, hint, aside, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm font-semibold text-brown">
        {label}
        {aside}
      </span>
      <span className="relative block">
        <input {...props} type={show ? 'text' : 'password'} className={`${fieldCls} pr-12`} />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-brown-soft/60 transition hover:bg-brown/5 hover:text-brown"
          style={{ marginTop: 3 }}>
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
      {hint && <span className="mt-1.5 block text-xs text-brown-soft/70">{hint}</span>}
    </label>
  )
}

export function Checkbox({ label, ...props }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-brown-soft">
      <input type="checkbox" {...props}
        className="size-[18px] cursor-pointer rounded-[5px] accent-[#2b1d0e]" />
      {label}
    </label>
  )
}

export function PrimaryButton({ children }) {
  return (
    <button type="submit"
      className="h-11 w-full rounded-full bg-brown font-semibold text-honey shadow-md transition hover:brightness-125">
      {children}
    </button>
  )
}

export function Divider() {
  return (
    <div className="flex items-center gap-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-brown-soft/50">
      <span className="h-px flex-1 bg-brown/10" /> or <span className="h-px flex-1 bg-brown/10" />
    </div>
  )
}

// Google's multicolor "G" mark
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-5 shrink-0" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

// Google is the only sign-in besides email. Logo sits at the left inside the button;
// the label stays centered across the full width.
export function GoogleButton() {
  return (
    <button type="button"
      className="relative flex h-11 w-full items-center justify-center rounded-full bg-white text-sm font-medium text-brown shadow-sm ring-1 ring-brown/15 transition hover:bg-[#e9dcc4]/50">
      <span className="absolute left-4 grid place-items-center"><GoogleLogo /></span>
      Continue with Google
    </button>
  )
}
