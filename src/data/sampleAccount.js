import bees from './bees.json'
import butterflies from './butterflies.json'
import { asset } from '../config.js'

/*
  Demo account for the redesign preview: the app looks as if this person is signed in
  and has already recorded a season of logs. There is no real account backend.
  Turn DEMO_SIGNED_IN off to see the signed-out versions of the pages again.
*/
export const DEMO_SIGNED_IN = true

export const sampleUser = {
  name: 'Sam Rivera',
  email: 'sam.rivera@example.com',
  initials: 'SR',
  memberSince: 'May 2026',
}

const LOGS_KEY = 'beecology-redesign-logs' // same key as getLogs/saveLog in ./index.js
const SEEDED_KEY = 'beecology-redesign-sample-seeded'
const DETAILS_KEY = 'beecology-redesign-sample-details' // sample logs given map points + comments

const bee = (s) => asset(bees.find((b) => b.species === s)?.image)
const fly = (n) => {
  const b = butterflies.find((x) => x.common_names[0] === n)
  return b ? asset(b.butterfly_image_src[0]) : undefined
}

// Where each sample place is, for the pin on the log's map
const PLACES = {
  'Elm Park, Worcester': { lat: 42.27225, lng: -71.82105 },
  'Broad Meadow Brook, Worcester': { lat: 42.23335, lng: -71.77380 },
  'WPI Quad, Worcester': { lat: 42.27390, lng: -71.80835 },
  'Tower Hill Botanic Garden, Boylston': { lat: 42.36380, lng: -71.72350 },
  'Institute Park, Worcester': { lat: 42.27650, lng: -71.80470 },
  'Green Hill Park, Worcester': { lat: 42.28525, lng: -71.77300 },
}

// One summer of observations around Worcester, MA (newest first)
const SAMPLE_LOGS = [
  { type: 'bee', species: 'Bombus impatiens', date: '2026-10-04', location: 'Elm Park, Worcester', image: bee('impatiens'), behavior: 'Collecting pollen', sex: 'Female', notes: 'Working the asters along the pond path. Pollen baskets were full.' },
  { type: 'butterfly', species: 'Monarch', date: '2026-09-18', location: 'Broad Meadow Brook, Worcester', image: fly('Monarch'), behavior: 'Nectaring', notes: 'Late migrant, flying south-west. Stopped on goldenrod for a few minutes.' },
  { type: 'bee', species: 'Bombus griseocollis', date: '2026-09-12', location: 'Broad Meadow Brook, Worcester', image: bee('griseocollis'), behavior: 'Collecting nectar', sex: 'Male' },
  { type: 'bee', species: 'Bombus fervidus', date: '2026-08-27', location: 'WPI Quad, Worcester', image: bee('fervidus'), behavior: 'Collecting nectar', notes: 'Two of them on the clover by the library.' },
  { type: 'butterfly', species: 'Eastern Tiger Swallowtail', date: '2026-08-09', location: 'Tower Hill Botanic Garden, Boylston', image: fly('Eastern Tiger Swallowtail') },
  { type: 'bee', species: 'Bombus ternarius', date: '2026-08-09', location: 'Tower Hill Botanic Garden, Boylston', image: bee('ternarius'), behavior: 'Collecting pollen', sex: 'Female' },
  { type: 'bee', species: 'Bombus vagans', date: '2026-07-15', location: 'Institute Park, Worcester', image: bee('vagans') },
  { type: 'butterfly', species: 'Great Spangled Fritillary', date: '2026-07-15', location: 'Institute Park, Worcester', image: fly('Great Spangled Fritillary'), behavior: 'Nectaring', notes: 'On milkweed, sunny and about 80°F.' },
  { type: 'bee', species: 'Bombus bimaculatus', date: '2026-06-20', location: 'Elm Park, Worcester', image: bee('bimaculatus') },
  { type: 'butterfly', species: 'Cabbage White', date: '2026-06-02', location: 'Elm Park, Worcester', image: fly('Cabbage White') },
  { type: 'bee', species: 'Bombus perplexus', date: '2026-05-24', location: 'Green Hill Park, Worcester', image: bee('perplexus') },
].map((l, i) => ({ ...l, loc: PLACES[l.location], id: `sample-${i}`, created: `${l.date}T12:00:00.000Z`, submitted: true }))

/*
  Put the sample logs in place the first time the preview opens in a browser.
  Runs once: if the viewer later deletes logs, they stay deleted.
*/
export function seedSampleLogs() {
  if (!DEMO_SIGNED_IN) return
  try {
    if (localStorage.getItem(SEEDED_KEY)) {
      // Sample logs saved before they had a map point and comments: fill those in once,
      // matching on species + date (older seeds numbered their ids differently)
      if (localStorage.getItem(DETAILS_KEY)) return
      const match = (l) => SAMPLE_LOGS.find((x) => x.species === l.species && x.date === l.date)
      const logs = (JSON.parse(localStorage.getItem(LOGS_KEY)) || []).map((l) => {
        const m = l.id?.startsWith('sample-') && match(l)
        return m ? { ...l, loc: m.loc, behavior: m.behavior, sex: m.sex, notes: m.notes } : l
      })
      localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
      localStorage.setItem(DETAILS_KEY, '1')
      return
    }
    const existing = JSON.parse(localStorage.getItem(LOGS_KEY)) || []
    const ids = new Set(existing.map((l) => l.id))
    localStorage.setItem(LOGS_KEY, JSON.stringify([...existing, ...SAMPLE_LOGS.filter((l) => !ids.has(l.id))]))
    localStorage.setItem(SEEDED_KEY, '1')
    localStorage.setItem(DETAILS_KEY, '1')
  } catch {}
}
