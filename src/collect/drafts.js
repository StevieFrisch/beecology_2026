import { saveDraft } from '../data'

/*
  persistImage is also used when a log is finished, so saved logs keep their photo too.

  Turning the in-progress collect data into a draft that survives a reload.
  Uploaded files only exist as temporary blob: URLs, so the chosen photo/frame is copied
  into a small JPEG; an uploaded video can't be kept, so its captured frame stands in for it.
*/

// blob: URL → JPEG data URL, at most 1280px on the long side
export async function persistImage(url) {
  if (!url?.startsWith('blob:')) return url
  const img = new Image()
  img.src = url
  await img.decode()
  const scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight))
  const c = document.createElement('canvas')
  c.width = Math.round(img.naturalWidth * scale)
  c.height = Math.round(img.naturalHeight * scale)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.82)
}

export async function storeDraft({ id, data, step, stepTitle, stepCount }) {
  // Each distinct image is copied once (a photo's three parts share one image)
  const done = new Map()
  const keep = async (url) => {
    if (!url) return url
    if (!done.has(url)) done.set(url, await persistImage(url))
    return done.get(url)
  }
  const frame = data.frames?.[0] ? await keep(data.frames[0]) : undefined
  const parts = data.parts ? Object.fromEntries(await Promise.all(
    Object.entries(data.parts).map(async ([k, v]) => [k, { ...v, src: await keep(v.src) }]))) : undefined
  // Keep the media only if it still exists after a reload (samples); otherwise use the frame as a photo
  const media = data.media && !data.media.url.startsWith('blob:')
    ? data.media
    : frame ? { url: frame, kind: 'image', name: 'Saved frame' } : undefined
  return saveDraft({
    id,
    step,
    stepTitle,
    stepCount,
    data: { ...data, media, frames: frame ? [frame] : [], parts },
  })
}
