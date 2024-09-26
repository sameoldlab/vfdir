import initWasm, { DB } from '@vlcn.io/crsqlite-wasm'
import wasmUrl from '@vlcn.io/crsqlite-wasm/crsqlite.wasm?url'
import { afterEach, beforeEach, describe, it } from 'vitest'
import { useQuery } from './useQuery.svelte'


describe('Check query reactivity', async () => {
  let db: DB
  beforeEach(async () => {
    const sqlite = await initWasm(() => wasmUrl)
    db = await sqlite.open(':memory:')
    await db.exec('create table tbl(val);')
  })
  afterEach(async () => {
    await db1.close()
    await db.close()
  })
  // detects changes on a separate connection
  it('Providers table matches type', async () => {
    console.log('watch')
    useQuery(db, 'select * from tbl')
    useQuery(db, 'select * from tbl')

    console.log('run')
    await db.exec(`insert into tbl(val) values (${Math.random()})`)
    await db.exec(`insert into tbl(val) values (${Math.random()})`)
    await db.exec(`insert into tbl(val) values (${Math.random()})`)
  })
})
