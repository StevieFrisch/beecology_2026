/*
  One-time build step: computes a CLIP "fingerprint" (image embedding) for each butterfly's
  reference photo and saves them to public/models/butterfly-embeddings.json. The collect flow's
  "Find close matches" compares the user's photo against these in the browser.

  Run again whenever butterflies.json photos change:  node scripts/embed-butterflies.mjs
  Model: Xenova/clip-vit-base-patch32 (OpenAI CLIP ViT-B/32, MIT license), 8-bit quantized.
*/
import { readFile, writeFile } from 'node:fs/promises'
import { AutoProcessor, CLIPVisionModelWithProjection, RawImage } from '@huggingface/transformers'

export const MODEL = 'Xenova/clip-vit-base-patch32'
const ASSET = 'https://beecology.wpi.edu'
const asset = (p) => (/^https?:/.test(p) ? p : ASSET + p)

const butterflies = JSON.parse(await readFile(new URL('../src/data/butterflies.json', import.meta.url)))
const processor = await AutoProcessor.from_pretrained(MODEL)
const model = await CLIPVisionModelWithProjection.from_pretrained(MODEL, { dtype: 'q8' })

const items = []
let failed = 0
for (const [i, b] of butterflies.entries()) {
  try {
    const image = await RawImage.fromURL(asset(b.butterfly_image_src[0]))
    const { image_embeds } = await model(await processor(image))
    const v = Array.from(image_embeds.data)
    const norm = Math.hypot(...v)
    items.push({ species: b.species, v: v.map((x) => Math.round((x / norm) * 1e4) / 1e4) })
  } catch (e) {
    failed++
    console.warn(`skipped ${b.species}: ${e.message}`)
  }
  if ((i + 1) % 20 === 0) console.log(`${i + 1}/${butterflies.length}`)
}
await writeFile(new URL('../public/models/butterfly-embeddings.json', import.meta.url),
  JSON.stringify({ model: MODEL, dims: items[0]?.v.length, items }))
console.log(`done: ${items.length} embedded, ${failed} skipped`)
