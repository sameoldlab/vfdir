import type { DB } from "@vlcn.io/crsqlite-wasm"

export const watchEvents = (db: DB) => {
  let lastRow = 0n
  db.onUpdate(async (type, dbName, table, row) => {
    if (table !== 'log' || dbName !== 'main') return
    if (type !== 18) throw Error('the sky is falling')
    await db.execO('select * from log where rowid = ?', [row])

    lastRow = row
    console.log(lastRow)
  })
}
