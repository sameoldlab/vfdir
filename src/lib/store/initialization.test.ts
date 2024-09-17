import type { DB } from "@vlcn.io/crsqlite-wasm";
import initWasm from "@vlcn.io/crsqlite-wasm";
import wasmUrl from '@vlcn.io/crsqlite-wasm/crsqlite.wasm?url';
import { assert, is, StructError, validate } from 'superstruct';
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTables } from "./createTables";
import { Block, Channel, Connections, Providers, Users } from './schema';
import { bootstrap } from "./sync.svelte";

describe('Database initialization', () => {
  let db: DB
  beforeAll(async () => {
    const sqlite = await initWasm(() => wasmUrl)
    db = await sqlite.open(":memory:");
  })
  afterAll(() => { if (db) db.close() })

  it('succesfully creates tables', () => {
    expect(() => createTables(db)).not.toThrow()
  })

  it('has an initial user', async () => {
    await createTables(db)
    const user = (await db.execO('select * from users limit 1'))[0]
    expect(user.id).toEqual('local')
  })
})


describe('Bootstrap database and validate types', async () => {
  const sqlite = await initWasm(() => wasmUrl)
  const db = await sqlite.open(":memory:");
  await createTables(db)

  afterAll(() => { if (db) db.close() })

  it('runs bootstrap without error', async () => {
    await createTables(db)
    expect(() => bootstrap(db)).not.toThrow()
  })

  // reinserting the same data does not duplicate rows
  // adds in all blocks and connections
  // can find a providers based on the block
  // lists all blocks for a channel
  // lists all channels for a block

  it('Users table matches type', async () => {
    const user = (await db.execO('SELECT * FROM Users  limit 1'))[0]
    expect(() => assert(user, Users)).not.toThrow()
  })

  it('Blocks table matches type', async () => {
    const block = (await db.execO('SELECT * FROM Blocks limit 1'))[0]
    expect(() => assert(block, Block)).not.toThrow()
  })

  it('Channels table matches type', async () => {
    const channel = (await db.execO('SELECT * FROM Channels limit 1'))[0]
    expect(() => assert(channel, Channel)).not.toThrow()
  })

  it('Connections table matches type', async () => {
    const connection = (await db.execO('SELECT * FROM Connections limit 1'))[0]
    expect(() => assert(connection, Connections)).not.toThrow()

  })

  it('Providers table matches type', async () => {
    const provider = (await db.execO('SELECT * FROM Providers limit 1'))[0]
    expect(() => assert(provider, Providers)).not.toThrow()
  })


})
