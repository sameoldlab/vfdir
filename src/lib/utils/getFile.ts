import { sha256 } from 'multiformats/hashes/sha2'
import { CID } from 'multiformats/cid'
import { pool } from '$lib/database/connectionPool.svelte'
import type { Action } from 'svelte/action'

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
    await db.exec(`update blocks set image = ? where image = ?`, [cid.toString(), filename])
  })
}

const getFileFromCid = async (filename: string, cDir = cacheDir) =>
  cDir.getFileHandle(filename)
    .then((handle) => handle.getFile()
      .then((file) => URL.createObjectURL(file)))


export const handleFile: Action<HTMLImageElement, { src: string }> = (el, data) => {
  let url: string | null = null
  const load = async () => {
    if (!data.src.startsWith('baf')) return cacheFile(data.src)

    const url = await getFileFromCid(data.src)
    el.src = url
  }
  load()

  return {
    destroy() {
      url && URL.revokeObjectURL(url)
    }
  }
}
