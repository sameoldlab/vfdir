import type { DELETE, UPDATE, UpdateType } from "@vlcn.io/xplat-api"
import { DbPool } from "./connectionPool.svelte"

const EVENT_DB_NAME = 'log'
let eventDb: DbPool
if (!eventDb) {
  console.warn('new event db')

  eventDb = new DbPool({ maxConnections: 1, dbName: `${EVENT_DB_NAME}.db` })
}
  await eventDb.exec(async (db) => {
    await db.exec(`insert into ${EVENT_DB_NAME} values(?,?,?,?)`, [JSON.stringify(data)])
  })
}

export const watch = async () => eventDb.query(`select *,rowid from ${EVENT_DB_NAME}  order by rowid`)

type EventData = {
  version: number
  table: string
} & ({
  type: 'update'
  payload: {
    changed: string[]
    value: any[]
  }
} | {
  type: 'delete'
  payload: {
    identifier: string
    value: any
  }
})

type EventDbSchema = {
  localId: string
  originId: string
  /** Unix timestamp */
  timestamp: number
  data: EventData
}

let d: EventData


if (d.type === 'update') {
  d.payload.changed
}


/* 
- pull from are.na
- push to are.na
- add channel, block
- connect block/channel
- modify block
- delete block
- delete channel
- i think uhat might be it?


*/
