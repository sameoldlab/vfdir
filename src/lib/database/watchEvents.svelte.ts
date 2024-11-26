import { EventSchema, EventSchemaR } from "./schema"
import { create } from "superstruct"
import { fromArenaBlock, fromArenaChannel, fromArenaUser, fromArenaConnection } from "$lib/services/fromArena"
import type { StmtAsync, TXAsync } from "@vlcn.io/xplat-api"
import { pool } from "./connectionPool.svelte"
const channel = new BroadcastChannel('updates')
import { Block, blocks, Channel, channels, Connection, User } from "$lib/pools/block.svelte"

export const watchEvents = () => {
  let lastRow = 0n

  channel.addEventListener('message', ev => {
    if (ev.data) {
      const ub = [...ev.data.values()]
      pool.exec(async (tx) => {
        await tx.execO<EventSchema>('select *,rowid from log where rowid between ? and ?', [ub[0], ub.at(-1)]).then(events => parseEvent(events))
      })
    }
  })
}

async function parseEvent(events: EventSchema[]) {
  for (const e of events) {
    let {
      type: [action, field],
      originId: [_ts, _c, device],
      data,
    } = create(e, EventSchemaR)
    const from_arena = device === 'arena'

    if (action === 'add') {
      switch (field) {
        case 'block': {
          const obj = from_arena ? fromArenaBlock(data) : data
          new Block(obj)
          break;
        }
        case 'channel': {
          const obj = from_arena ? fromArenaChannel(data) : data
          new Channel(obj)
          break
        }
        case 'user': {
          const obj = from_arena ? fromArenaUser(data) : data
          new User(obj)
          break
        }
        case 'connection': {
          const obj = from_arena ? fromArenaConnection(data) : data
          blocks.get(obj.child_id)?.addConnection(obj.parent_id)
          channels.get(obj.parent_id)?.addBlock(obj)
          break
        }
      }
    } else if (action === 'mod') {
      switch (field) {
        case 'image': {
          break;
        }
      }
    }
  }
}

async function insertO<O extends object>(tx: TXAsync, row: O, table: string, stmts: Map<string, StmtAsync>): Promise<[string, StmtAsync]> {
  const keys = Object.keys(row)
  const sql = `INSERT INTO ${table}(${keys.join(',')}) VALUES (${Array(keys.length).fill('?').join(',')});`

  try {
    const stmt = stmts.get(sql) ?? await tx.prepare(sql)
    await stmt.run(tx, ...Object.values(row))
    return [sql, stmt]
  } catch (error) {
    console.error({ error, sql, row })
  }
}
