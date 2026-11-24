/*
  Background worker: on-device butterfly matching (nothing is sent to a server).
  Loads the CLIP image model once (≈90 MB, served by this site from public/models, then cached
  by the browser), turns the user's photo into a fingerprint (embedding), and ranks the 120 butterflies
  by how similar their reference photos' fingerprints are (cosine similarity).
  Messages in:  { image: <data/blob URL> }
  Messages out: { type: 'progress', loaded, total } | { type: 'status', text } |
                { type: 'result', matches: [{ species, score }] } | { type: 'error', message }
*/
import { AutoProcessor, CLIPVisionModelWithProjection, RawImage, env } from '@huggingface/transformers'
// The ONNX Runtime WebAssembly engine, bundled by Vite from node_modules (served by this site)
import ortMjs from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs?url'
import ortWasm from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url'

// Everything is served by this site: no requests to Hugging Face or a CDN.
//   model  — public/models/Xenova/clip-vit-base-patch32/ (config, preprocessor, quantized ONNX)
//   engine — the two files imported above
env.allowRemoteModels = false
env.allowLocalModels = true
env.localModelPath = `${import.meta.env.BASE_URL}models/`
env.backends.onnx.wasm.wasmPaths = { mjs: ortMjs, wasm: ortWasm }

const MODEL = 'Xenova/clip-vit-base-patch32' // must match scripts/embed-butterflies.mjs
let ready = null

function load() {
  if (ready) return ready
  const files = {}
  const progress_callback = (p) => {
    if (p.status === 'progress' && p.file?.endsWith('.onnx')) {
      files[p.file] = p
      const loaded = Object.values(files).reduce((n, f) => n + (f.loaded || 0), 0)
      const total = Object.values(files).reduce((n, f) => n + (f.total || 0), 0)
      postMessage({ type: 'progress', loaded, total })
    }
  }
  ready = Promise.all([
    AutoProcessor.from_pretrained(MODEL),
    CLIPVisionModelWithProjection.from_pretrained(MODEL, { dtype: 'q8', progress_callback }),
    fetch(`${import.meta.env.BASE_URL}models/butterfly-embeddings.json`).then((r) => r.json()),
  ])
  ready.catch(() => { ready = null })
  return ready
}

self.onmessage = async ({ data }) => {
  try {
    postMessage({ type: 'status', text: 'Loading the matching model…' })
    const [processor, model, ref] = await load()
    postMessage({ type: 'status', text: 'Comparing your photo…' })
    const image = await RawImage.fromURL(data.image)
    const { image_embeds } = await model(await processor(image))
    const v = Array.from(image_embeds.data)
    const norm = Math.hypot(...v)
    const q = v.map((x) => x / norm)
    const matches = ref.items
      .map((it) => ({ species: it.species, score: it.v.reduce((s, x, i) => s + x * q[i], 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, data.count || 6)
    postMessage({ type: 'result', matches })
  } catch (e) {
    postMessage({ type: 'error', message: e.message || String(e) })
  }
}
