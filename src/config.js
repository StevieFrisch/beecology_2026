// Images are hot-linked from the live site for now. Swap this for '' and drop
// files into /public if you want the redesign to be fully self-contained.
export const ASSET = 'https://beecology.wpi.edu'
// Files in /public, under the site's base path ('/' locally, '/beecology_2026/' on GitHub Pages)
export const publicUrl = (p) => import.meta.env.BASE_URL + p.replace(/^\//, '')

export const asset = (p) => (p?.startsWith('http') ? p : ASSET + p)
