import { beforeAll, describe, it } from 'vitest'
import { DbPool } from './connectionPool.svelte'

describe('Check query reactivity', () => {
  let dp: DbPool
  beforeAll(async () => {
    dp = new DbPool({ dbName: 'memory.db' })
    await dp.exec(async (db) => { await db.exec('create table if not exists tbl(val);') })
  })

  // detects changes on a separate connection
  it('Providers table matches type', async () => {
    dp.query('select * from tbl')
    dp.query('select * from tbl')

    await dp.exec(async (db) => {
      await db.exec(`insert into tbl(val) values (${Math.random()})`)
      await db.exec(`insert into tbl(val) values (${Math.random()})`)
      await db.exec(`insert into tbl(val) values (${Math.random()})`)
    })

  })
})
