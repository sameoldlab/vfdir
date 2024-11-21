import { EventSchema, EventSchemaR } from "./schema"
import { create, StructError } from "superstruct"
import { fromArenaBlock, fromArenaChannel, fromArenaUser, fromArenaConnection } from "$lib/services/fromArena"
import type { StmtAsync, TXAsync } from "@vlcn.io/xplat-api"
import { pool } from "./connectionPool.svelte"
const channel = new BroadcastChannel('updates')

export const watchEvents = () => {
  let lastRow = 0n

  channel.addEventListener('message', ev => {
    if (ev.data) {
      const ub = [...ev.data.values()]
      pool.exec(async (tx) => {
        await tx.execO<EventSchema>('select *,rowid from log where rowid between ? and ?', [ub[0], ub.at(-1)]).then(events => parseEvent(events, tx))
      })
    }
  })
}

