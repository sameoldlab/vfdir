let cacheDir: FileSystemDirectoryHandle
navigator.storage.getDirectory().then(async (fsdh: FileSystemDirectoryHandle) => {
  cacheDir = await fsdh.getDirectoryHandle('cache', { create: true })
})
const encoder = new TextEncoder()

export async function getFile(url: string) {
  const secureHash = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(url)
  )
  const filename = Array.from(new Uint8Array(secureHash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const cacheImg = await cacheDir.getFileHandle(filename, {
    create: true
  })

  let file = await cacheImg.getFile()
  if (file.size > 0) {
    console.info('returning file from cache')
    return file
  }

  console.warn('no file in opfs: fetching asset')
  const response = await fetch(url)
  const writableStream = await cacheImg.createWritable()
  await response.body.pipeTo(writableStream)

  file = await cacheImg.getFile()
  return file
}

