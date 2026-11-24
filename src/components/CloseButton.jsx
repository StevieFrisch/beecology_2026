import { useNavigate } from 'react-router-dom'

// Filled gray circle with a white X, top-left of the content area (36px icon in a 52px hit area).
// Left side, because the tutorial and account buttons float in the top-right corner.
export default function CloseButton({ to, light }) {
  const nav = useNavigate()
  return (
    <button
      aria-label="Close"
      onClick={() => (to ? nav(to) : nav(-1))}
      className={`absolute left-0 top-0 cursor-pointer p-2 ${
        light ? 'text-gray-300 hover:text-gray-400' : 'text-gray-500 hover:text-gray-800'
      }`}
    >
      <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path d="M8.5 8.5l7 7m0-7l-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  )
}
