import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTables } from "./createTables";
import { bootstrap } from "./sync.svelte";
import type { DB } from "@vlcn.io/crsqlite-wasm";
import initWasm from "@vlcn.io/crsqlite-wasm";
import wasmUrl from '@vlcn.io/crsqlite-wasm/crsqlite.wasm?url'

let db: DB
beforeAll(async () => {
  const sqlite = await initWasm(() => wasmUrl)
  db = await sqlite.open(":memory:");
})
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
