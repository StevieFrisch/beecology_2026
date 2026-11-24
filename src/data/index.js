import bees from './bees.json'
import butterflies from './butterflies.json'

export { bees, butterflies }

// Butterfly families shown on the Beedex. Subtitles match the live app;
// descriptions are short placeholder copy written for this redesign.
export const families = [
  { name: 'Nymphalidae', subtitle: 'The Brushfoot Family', image: '/butterfly_images/nymphalidae.jpg',
    description: 'The largest butterfly family. Most brushfoots have a shortened, hairy front pair of legs, so they appear to stand on four. Includes monarchs, admirals, fritillaries and tortoiseshells.' },
  { name: 'Pieridae', subtitle: 'The Whites and Sulphur Family', image: '/butterfly_images/pieridae.jpeg',
    description: 'Small to medium butterflies, mostly white, yellow or orange. Common in open fields and gardens; the cabbage white is one of the most familiar.' },
  { name: 'Papilionidae', subtitle: 'The Swallowtail Family', image: '/butterfly_images/papilionidae.jpg',
    description: 'Large, often brightly patterned butterflies. Many species have tail-like extensions on the hindwings.' },
  { name: 'Lycaenidae', subtitle: 'The Hairstreak, Blues, and Gossamer Family', image: '/butterfly_images/lycaenidae.jpeg',
    description: 'Small, delicate butterflies. Blues are often bright on top, coppers shine orange, and hairstreaks frequently carry thin tails.' },
  { name: 'Hesperiidae', subtitle: 'The Skippers Family', image: '/butterfly_images/hesperiidae.jpg',
    description: 'Stout-bodied, mostly brown or orange butterflies with a quick, darting flight. Their antennae usually end in a hooked club.' },
]

// "by-nc/4.0" license URL -> "BY-NC 4.0 License"
export const licenseLabel = (url = '') => {
  const m = url.match(/licenses\/([a-z-]+)\/([\d.]+)/i)
  return m ? `${m[1].toUpperCase()} ${m[2]} License` : 'License'
}

// --- Local "logs" store (stand-in for the app's IndexedDB/server sync) ---
const KEY = 'beecology-redesign-logs'
// Only bees and butterflies are logged (older wildlife logs are ignored)
export function getLogs() {
  try { return (JSON.parse(localStorage.getItem(KEY)) || []).filter((l) => l.type === 'bee' || l.type === 'butterfly') } catch { return [] }
}
export function saveLog(log) {
  const logs = [{ ...log, id: crypto.randomUUID(), created: new Date().toISOString() }, ...getLogs()]
  try { localStorage.setItem(KEY, JSON.stringify(logs)) } catch {}
}
export function deleteLog(id) {
  try { localStorage.setItem(KEY, JSON.stringify(getLogs().filter((l) => l.id !== id))) } catch {}
}

// --- Drafts: unfinished logs saved from any step of the collect flow ---
const DRAFTS_KEY = 'beecology-redesign-drafts'
export function getDrafts() {
  try { return JSON.parse(localStorage.getItem(DRAFTS_KEY)) || [] } catch { return [] }
}
export function getDraft(id) {
  return getDrafts().find((d) => d.id === id)
}
// Insert or update (by id), newest first. Returns false if storage is full.
export function saveDraft(draft) {
  const rest = getDrafts().filter((d) => d.id !== draft.id)
  try { localStorage.setItem(DRAFTS_KEY, JSON.stringify([{ ...draft, updated: new Date().toISOString() }, ...rest])); return true } catch { return false }
}
export function deleteDraft(id) {
  try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(getDrafts().filter((d) => d.id !== id))) } catch {}
}
