import { EventSchema, EventSchemaR } from "./schema"
import { create } from "superstruct"
import { fromArenaBlock, fromArenaChannel, fromArenaUser, fromArenaConnection } from "$lib/services/fromArena"
import type { DB, StmtAsync, TXAsync } from "@vlcn.io/xplat-api"
import { pool } from "./connectionPool.svelte"
const channel = new BroadcastChannel('updates')
import { Block, blocks, Channel, channels, Connection, media, User } from "$lib/pools/block.svelte"

export async function bootstrap(db: TXAsync | DB) {
  const events = await db.execO<EventSchema>('select rowid,* from log')
  console.log({ events })
  try { parseEvent(events) }
  catch (err) { console.error(err) }
}

export const watchEvents = () => {
  let lastRow = 0n

  channel.addEventListener('message', ev => {
    if (ev.data) {
      const ub = [...ev.data.values()]
      pool.exec(async (tx) => {
        const events = await tx.execO<EventSchema>('select *,rowid from log where rowid between ? and ?', [ub[0], ub.at(-1)])
        try { parseEvent(events) }
        catch (err) { console.error(err) }
      })
    }
  })
}

async function parseEvent(events: EventSchema[]) {
  console.log({ events })
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
          if (data.is_channel) {
            if (channels.get(data.child.slug) === undefined) new Channel(fromArenaChannel(data.child))
          } else {
            const bl = blocks.get(data.child.id) ?? new Block(fromArenaBlock(data.child))
            bl.addConnection(data.parent.slug)
          }

          const chan = from_arena ? fromArenaChannel(data.parent) : data.parent;
          (channels.get(data.parent.slug) ?? new Channel(chan)).addEntry(fromArenaConnection(data))
          break
        }
      }
    } else if (action === 'save') {
      switch (field) {
        case 'blob': {
          media.set(data.original, data.url)
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

// class Decorator
function Entity(opts) {
  return function(target: Function) { }
}

// Function Decorator
/** 
 * @example 
 * ```
 *   @Func
 *   hello(name: string) { ... }
 * ```
 */
function hydrate(prop: string) {
  return function Func<
    This,
    Args extends any[],
    Return,
    Fn extends (this: This, ...args: Args) => Return
  >(
    target: This,
    ctx: ClassMethodDecoratorContext<This, Fn>
  ) {
    return function(this: This, ...args: Args) {
      const result = target.call(this, ...args)
      console.log(prop)
      return result
    }
  }
}

// Propery Decorator
function Prop(opts: Object, propertyKey: string) {
  return function(target: Function) { }
}

