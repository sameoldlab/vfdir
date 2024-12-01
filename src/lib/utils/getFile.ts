import { sha256 } from 'multiformats/hashes/sha2'
import { CID } from 'multiformats/cid'
import { pool } from '$lib/database/connectionPool.svelte'
import type { Action } from 'svelte/action'
import { media } from '$lib/pools/block.svelte'

let cacheDir: FileSystemDirectoryHandle = null
let opfs_available = false
if (!cacheDir) {
  navigator.storage.getDirectory().then(async (fsdh: FileSystemDirectoryHandle) => {
    cacheDir = await fsdh.getDirectoryHandle('cache', { create: true })
    opfs_available = true
  }).catch(err => {
    if (err instanceof DOMException) opfs_available = false
    else throw err
  })
}

const cacheFile = async (filename: string) => {
  const res = await fetch(filename)
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`)

  // Write data to file handle and chunks array
  const handle = await cacheDir.getFileHandle(`tmp-${Math.random()}`, {
    create: true
  })
  const writableStream = await handle.createWritable()
  const chunks = []
  const transform = new TransformStream({
    transform(chunk, controller) {
      chunks.push(chunk)
      controller.enqueue(chunk)
    }
  })
  await res.body.pipeThrough(transform).pipeTo(writableStream)

  // Generate CID from chunks array 
  const bytes = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  const hash = await sha256.digest(bytes)
  const cid = CID.create(1, 0x55, hash)

  // move file to final location. update reference in database
  handle.move(cid.toString())
  const { record } = await import('$lib/database/events')
  pool.exec(async (db) => {
    console.log(cid.toString(), filename)
    await record(db, { type: 'save:blob', data: { url: cid.toString(), original: filename }, objectId: 'block:image' })
  })
  return cid.toString()
}

const getFileFromCid = (filename: string, cDir = cacheDir) =>
  cDir.getFileHandle(filename)
    .then((handle) => handle.getFile()
      .then((file) => URL.createObjectURL(file)))

const load = async (el: HTMLImageElement | HTMLVideoElement, src: string) => {
  console.log('cache miss')
  const cached = await cacheFile(src)
  media.set(src, cached)
  el.src = src
}
const observer = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue
    let el = entry.target as HTMLImageElement | HTMLVideoElement
    load(el, el.dataset.src)
    observer.unobserve(el)
  }
}, {
  rootMargin: '0% 0% 100% 0%',
  threshold: 0
})

export const handleFile: Action<HTMLImageElement | HTMLVideoElement, { src: string }> = (el, { src }) => {
  let url: string | null = null

  if (!opfs_available) {
    el.loading = 'lazy'
    el.src = src
    return
  }
  if (media.get(src)) getFileFromCid(media.get(src))
    .then(_url => {
      url = _url
      el.src = url
    })
  else observer.observe(el)


  return {
    destroy() {
      observer.unobserve(el)
      url && URL.revokeObjectURL(url)
    }
  }
}
