import { sha256 } from 'multiformats/hashes/sha2'
import { CID } from 'multiformats/cid'
import { pool } from '$lib/database/connectionPool.svelte'

let cacheDir: FileSystemDirectoryHandle
navigator.storage.getDirectory().then(async (fsdh: FileSystemDirectoryHandle) => {
  cacheDir = await fsdh.getDirectoryHandle('cache', { create: true })
})
const encoder = new TextEncoder()

export async function getFile(filename: string) {
  if (filename.startsWith('baf')) {
    const file = await (await cacheDir.getFileHandle(filename)).getFile()
    return URL.createObjectURL(file)
  }
  if (!filename.startsWith('http')) throw new Error(`unknown file pointer ${filename}`)

  try {
    const res = await fetch(filename)
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`)
    const res2 = res.clone()
      ; (async () => {
        const chunks = []
        const transform = new TransformStream({
          transform(chunk, controller) {
            chunks.push(chunk)
            controller.enqueue(chunk)
          }
        })

        const handle = await cacheDir.getFileHandle(`tmp-${Math.random()}`, {
          create: true
        })
        const writableStream = await handle.createWritable()
        await res.body.pipeThrough(transform).pipeTo(writableStream)
        // Concat chunks to Uint8Array 
        const bytes = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
        let offset = 0
        for (const chunk of chunks) {
          bytes.set(chunk, offset)
          offset += chunk.length
        }
        const hash = await sha256.digest(bytes)
        const cid = CID.create(1, 0x55, hash)
        handle.move(cid.toString())
        pool.exec(async (db) => {
          await db.exec(`update blocks set image = ? where image = ?`, [cid.toString(), filename])
        })
      })()
    return URL.createObjectURL(await res2.blob())
  } catch (err) {
    console.error(err)
    throw err
  }
}

