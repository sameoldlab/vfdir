import { DbPool } from "./connectionPool.svelte"
import { ulid, type ULID } from "ulidx"
import { Block, Channel, EVENT_DB_NAME } from "./schema"
import type { ArenaBlock, ArenaChannel, ArenaChannelContents, ArenaChannelWithDetails, ArenaUser } from "arena-ts"
import type { DB } from "@vlcn.io/crsqlite-wasm"
import { hlc, type HLC } from "./hlc"

const VERSION = 1
let eventDb: DbPool
if (!eventDb) {
  console.warn('new event db')
  eventDb = new DbPool({ maxConnections: 1, dbName: `${EVENT_DB_NAME}.db` })
}

export const record = async (
  { originId, data, objectId, type }:
    Pick<EventSchema, 'objectId' | 'data' | 'type'> & { originId?: EventSchema['originId'] }
) => {
  const localId = hlc.inc()
  originId = originId ?? localId
  const props = [VERSION, localId, originId, JSON.stringify(data), type, objectId]
  await eventDb.exec(async (db) => {
    await db.exec(`insert into ${EVENT_DB_NAME} (version, localId, originId, data, type, objectId) values(?,?,?,?,?,?)`, props)
  })
}

export const watchEvents = () => eventDb.query<EventSchema[]>(
  `select *,rowid from ${EVENT_DB_NAME} order by rowid`
)

type EventData = object
type EventSchema = {
  version: number
  /** Unique id on event reception */
  localId: HLC
  /** Unique id from event source */
  originId: HLC
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



export const diffItem = (
  { data, current, objectId, originId }:
    {
      data: ArenaChannel | ArenaBlock,
      current?: Channel | Block,
      originId: () => EventSchema['originId'],
      objectId: EventSchema['objectId']
    }
) => {
  if (data.title && current.title !== data.title)
    record({
      objectId, type: 'mod:title', originId: originId(), data: {
        title: data.title
      }
    })
  if (data.class === 'Channel' && current.type === 'channel') {
    if (data.status && current.status !== data.status)
      record({
        objectId, type: 'mod:status', originId: originId(), data: {
          status: data.status
        }
      })
    if (data.metadata?.description && current.description !== data.metadata.description)
      record({
        objectId, type: 'mod:description', originId: originId(), data: {
          description: data.metadata.description
        }
      })
  } else if (data.class !== 'Channel' && current.type === 'block') {
    if (data.content && current.content !== data.content)
      record({
        objectId, type: 'mod:content', originId: originId(), data: {
          content: data.content
        }
      })
    if (data.description && current.description !== data.description)
      record({
        objectId, type: 'mod:description', originId: originId(), data: {
          description: data.description
        }
      })
  }
}
export const arena_item_sync = async (db: DB, data: ArenaChannel | ArenaBlock, current?: Channel | Block) => {
  const classType = data.class === 'Channel' ? 'channel' : 'block'
  const objectId = `${classType}:${data.id}`
  const updated_at = new Date(data.updated_at).valueOf()
  let c = -1
  const originId = (): EventSchema['originId'] => hlc.receive(`${updated_at}:${c++}:arena`)

  const sql = `
  SELECT * FROM ${EVENT_DB_NAME} 
  WHERE originId LIKE ?
  ORDER BY CAST(
    SUBSTR(
      originId, 
      LENGTH(? || ':') + 1,
      INSTR(SUBSTR(originId, LENGTH(? || ':') + 1), ':')
    ) AS INTEGER
  ) DESC 
  LIMIT 1
`;
  const params = [
    `${updated_at}:%:arena`,
    updated_at,
    updated_at
  ];

  const last = await db.execA(sql, params);
  console.log({ last })
  if (last) return

  if (!current) {
    record({
      objectId, type: `add:${classType}`, originId: originId(),
      data: { ...data, id: ulid(new Date(data.created_at).valueOf()) }
    })
    return
  }

  if (current.updated_at === updated_at) return
  diffItem({ data, current, objectId, originId })
}


/** 
  * CHECK IF CONNECTION EXISTS BEFORE CALLING THIS 
  */
export const arena_user_import = async (user: Partial<ArenaUser>) => {
  const objectId = `user:${user.id}`
  const originId: EventSchema['originId'] = hlc.receive(`${Date.now()}:0:arena`)
  record({ objectId, type: `add:user`, originId, data: user })
}

/** CHECK IF CONNECTION EXISTS BEFORE CALLING THIS */
export const arena_connection_import = (
  parent: ArenaChannelWithDetails,
  child: ArenaChannelContents,
) => {
  const objectId = `connection:${JSON.stringify([parent.id, child.id])}`
  const connected_at = new Date(child.connected_at).valueOf()
  const originId: EventSchema['originId'] = hlc.receive(`${connected_at}:0:arena`)

  let { contents, ...parentData } = parent
  record({
    objectId, type: `add:connection`, originId, data: {
      parent: parentData,
      child,
      position: child.position,
      connected_at,
      is_channel: child.class === 'Channel',
      selected: child.selected,
    }
  })
}
/* 
  Need a different way to track the order of changes as the data from the api does not record updates
  to the connection data (selected, position).
  I think hybrid logical clocks or lambert clocks could work? 
  Similar to the local-first event sourcing article.
  But I'm not sure how to implement this in my current system
*/

/* 
Arena's api also has an option to `GET /v2/channels/:id/contents`. 
So I could ignore this pain and use `GET /v2/channels/:id/contents` to read position
 and `PUT /v2/channels/:slug/sort` to update it 
PUT /v2/channels/:slug/sort
Resource URL:
http://api.are.na/v2/channels/:slug/sort
Parameters:
:ids (required)
Serialized array of IDs
 
Accepts a serialized array of IDs. Updates the order of the channel to the order of the IDs.
*/

export const block_del = (data) => {
  const objectId = `block:${data.slug}`
  const type = `del:${data.slug}`

  // record({ objectId, type, originId, data })
}

export const channel_add = (data) => {
  const objectId = `channel:${data.slug}`

  const type = `add:block`
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

export const connection_del = (data) => {
  const objectId = `connection:${data.slug} `

  const type = `del:${data.slug} `
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
        : data.user.id
        } `
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
