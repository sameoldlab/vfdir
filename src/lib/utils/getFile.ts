import { sha256 } from 'multiformats/hashes/sha2'
import { CID } from 'multiformats/cid'
import { pool } from '$lib/database/connectionPool.svelte'
import type { Action } from 'svelte/action'
import { record } from '$lib/database/events'
import { media } from '$lib/pools/block.svelte'

let cacheDir: FileSystemDirectoryHandle = null
if (!cacheDir) {
  navigator.storage.getDirectory().then(async (fsdh: FileSystemDirectoryHandle) => {
    cacheDir = await fsdh.getDirectoryHandle('cache', { create: true })
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


export const handleFile: Action<HTMLImageElement, { src: string }> = (el, { src }) => {
  let url: string | null = null
  const load = async () => {
    const cache = media.get(src)
    if (!cache) {
      console.log('cache miss')
      const cached = await cacheFile(src)
      media.set(src, cached)
      el.src = src
    } else {
      console.log('cache hit')
      url = await getFileFromCid(media.get(src))
      el.src = url
    }
  }
  load()

  return {
    destroy() {
      url && URL.revokeObjectURL(url)
    }
  }
}
