// Images are hot-linked from the live site for now. Swap this for '' and drop
// files into /public if you want the redesign to be fully self-contained.
export const ASSET = 'https://beecology.wpi.edu'
export const asset = (p) => (p?.startsWith('http') ? p : ASSET + p)
