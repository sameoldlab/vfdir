import { DbPool } from "./connectionPool.svelte"
import { ulid, type ULID } from "ulidx"
import { Block, Channel, Connection } from "./schema"
import type { ArenaBlock, ArenaChannel, ArenaChannelContents, ArenaChannelWithDetails } from "arena-ts"
import type { DB } from "@vlcn.io/crsqlite-wasm"

const EVENT_DB_NAME = 'log'
const VERSION = 1
let eventDb: DbPool
if (!eventDb) {
  console.warn('new event db')

  eventDb = new DbPool({ maxConnections: 1, dbName: `${EVENT_DB_NAME}.db` })
}

const now = () => new Date().valueOf()
let deviceId: string = null

export const record = async (
  { originId, data, objectId, type }:
    Pick<EventSchema, 'objectId' | 'data' | 'originId' | 'type'>
) => {
  if (deviceId === null) throw new Error('initialize deviceID before storing events')

  await eventDb.exec(async (db) => {
    await db.exec(`insert into ${EVENT_DB_NAME} (version, localId, originId, data, type, objectId) values(?,?,?,?,?,?)`, [VERSION, `${now()}:${deviceId}`, originId, JSON.stringify(data), type, objectId])
  })
}

export const watchEvents = () => eventDb.query<EventSchema[]>(`select *,rowid from ${EVENT_DB_NAME} order by rowid`)

type EventData = object

/** Unix timestamp */
type Timestamp = number
type SOURCE_ID = 'are.na' | 'filesystem'

type EventSchema = {
  version: number
  /** Unique id on event reception */
  localId: `${Timestamp}:${ULID}`
  /** Unique id from event source */
  originId: `${Timestamp}:${ULID | SOURCE_ID}`
  data: EventData
  /**
   * add|mod|delete-column|row
   * @example mod:title
   */
  type: string
  /** 
   * field to which the event is related 
   * @example block:0L239vsDajfdse...
   */
  objectId: string
}

export const arena_block_sync = async (db: DB, data: ArenaBlock, current?: Block,) => {
  const objectId = `block:${data.id}`
  const updated_at = new Date(data.updated_at).valueOf()
  const originId: EventSchema['originId'] = `${updated_at}:arena`

  const last = await db.execA(`select *,rowid from ${EVENT_DB_NAME} where originId = ? order by rowid DESC limit 1`, [originId])
  console.log(last)
  if (last) return
  if (!current) {
    const seedTime = data.created_at ? new Date(data.created_at).valueOf() : now()
    record({ objectId, type: `add:block`, originId, data: { ...data, id: ulid(seedTime) } })
    return
  }
  if (current.updated_at === updated_at) return

  if (current.title !== data.title)
    record({ objectId, type: `mod:title`, originId, data: { value: data.title } })
  if (current.content !== data.content)
    record({ objectId, type: `mod:content`, originId, data: { value: data.content } })
  if (current.description !== data.description)
    record({ objectId, type: `mod:description`, originId, data: { value: data.description } })
}

export const block_del = (data) => {
  const objectId = `block:${data.slug}`
  const type = `del:${data.slug}`

  // record({ objectId, type, originId, data })
}

export const channel_add = (data) => {
  const objectId = `channel:${data.slug}`

  const type = `add:block`
}
export const arena_channel_sync = async (db: DB, data: ArenaChannelWithDetails | ArenaChannel, current?: Channel) => {
  //consider changing to slug which is predominantly used in the api
  const objectId = `channel:${data.id}`
  const updated_at = new Date(data.updated_at).valueOf()
  const originId: EventSchema['originId'] = `${updated_at}:arena`

  const last = await db.execA(`select *,rowid from ${EVENT_DB_NAME} where originId = ? order by rowid DESC limit 1`, [originId])
  console.log(last)
  if (last) return

  if (!current) {
    const seedTime = data.created_at ? new Date(data.created_at).valueOf() : now()
    record({ objectId, type: `add:channel`, originId, data: { ...data, id: ulid(seedTime) } })
    return
  }
  if (current.updated_at === updated_at) return
  // TODO: this will repeat recorded changes on every check unless I do something to bookmark the latest sync 

  if (current.title !== data.title)
    record({ objectId, type: `mod:title`, originId, data: { value: data.title } })
  if (current.status !== data.status)
    record({ objectId, type: `mod:status`, originId, data: { value: data.status } })
  if (current.description !== data.metadata?.description)
    record({ objectId, type: `mod:description`, originId, data: { value: data.metadata?.description } })

  // title, order of blocks, status, add block, block's selected status, collaborators 
}
export const channel_del = (data) => {
  const objectId = `channel:${data.slug}`

  const type = `del:${data.slug}`
}

// order of blocks, add block, block's selected status
export const connection_add = (data) => {
  const objectId = `connection:${data.slug}`

  const type = `add:connection`
}
export const arena_connection_sync = (
  db: DB,
  data: { parent: ArenaChannelWithDetails, child: ArenaChannelContents },
  current: Connection
) => {
  const objectId = `connection:${data.slug}`

  const type = `mod:${data.slug}`
}
export const connection_del = (data) => {
  const objectId = `connection:${data.slug}`

  const type = `del:${data.slug}`
}

export const extern_user_sync = (data, userId: ULID | undefined = undefined) => {
  if (!userId) {
    let ndata = {
      id: data.id,
      slug: data.slug,
      firstname: data.first_name,
      lastname: data.last_name,
      avatar: data.avatar,
      external_ref: `arena:${data.class === 'Channel'
        ? data.owner_id
        : data.user.id}`
    }
    return
  }


}

export const lcl_user_mod = (data) => { }

/* 
# Function
- pull from are.na
- pull from filesystem

# Action
- push to are.na

# Event
- add channel, block
- create connection
-
- remove connection
- 
- modify block
- delete block
- delete channel


- i think uhat might be it?

open vfdir
  create instance uuid (distinct between devices and browsers)
connect to external account
  import data from source
add new block to channel
  add local image reference  
move block to new position
  set position for block-channel (TODO: need to think about this more) 
publish channel
  set channel visibility public
create collaborative channel
  

*/
