import type { ULID } from "ulidx"
import type { ArenaBlock, ArenaChannel, ArenaChannelContents, ArenaChannelWithDetails, ArenaUser } from "arena-ts"
import type { DB } from "@vlcn.io/crsqlite-wasm"
import { Hlc, type HLC } from "./hlc"
import type { StmtAsync, TXAsync } from "@vlcn.io/xplat-api"
import type { Entry } from "$lib/pools/block.svelte"

const VERSION = 1
let stmt: StmtAsync = null
const hlc = new Hlc(localStorage.getItem('deviceId'))
export const record = async <D extends object>(db: TXAsync | DB,
  { originId, data, objectId, type }:
    Pick<EventSchema<D>, 'objectId' | 'data' | 'type'> & { originId?: HLC }
) => {
  stmt = (stmt === null || stmt.finalized === true) ? await db.prepare(`
      insert into log (version, localId, originId, data, type, objectId) values(?,?,?,?,?,?)
    `) : stmt

  const localId = hlc.inc()
  originId = originId ?? localId
  const props = [VERSION, localId, originId, JSON.stringify(data), type, objectId]
  // if (type === 'add:user')
  // console.info(props)
  try {
    return await stmt.run(null, ...props)
  } catch (err) {
    console.log(stmt)
    console.error(`Error recording log: ${err}`)
  }
}
export const ev_stmt_close = async (tx?: TXAsync) => {
  stmt && await stmt.finalize(tx)
  stmt = null
  console.log('finalized stmt', stmt)
  return
}

export type EventSchema<O extends object> = {
  version: number
  /** Unique id on event reception */
  localId: HLC
  /** Unique id from event source */
  originId: HLC
  data: O
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

export const diffEntry = <D extends ArenaChannelContents>(db: DB | TXAsync,
  { data, current, objectId, originId }:
    {
      data: D,
      current?: Entry,
      originId: () => HLC,
      objectId: HLC
    }
) => {
  const promises: Promise<void>[] = []
  if (data.title && current.title !== data.title)
    promises.push(record(db, {
      objectId, type: 'mod:title', originId: originId(), data: {
        title: data.title
      }
    }))
  if (data.class === 'Channel' && current.type === 'channel') {
    if (data.status && current.status !== data.status)
      promises.push(record(db, {
        objectId, type: 'mod:status', originId: originId(), data: {
          status: data.status
        }
      }))
    if (data.metadata?.description && current.description !== data.metadata.description)
      promises.push(record(db, {
        objectId, type: 'mod:description', originId: originId(), data: {
          description: data.metadata.description
        }
      }))
  } else if (data.class !== 'Channel' && current.type === 'block') {
    if (data.content && current.content !== data.content)
      promises.push(record(db, {
        objectId, type: 'mod:content', originId: originId(), data: {
          content: data.content
        }
      }))
    if (data.description && current.description !== data.description)
      promises.push(record(db, {
        objectId, type: 'mod:description', originId: originId(), data: {
          description: data.description
        }
      }))
  }
  return Promise.all(promises)
}
export const arena_entry_sync = async <D extends ArenaChannelContents>(db: DB | TXAsync, data: D, current?: Entry) => {
  const classType = data.base_class.toLowerCase()
  const objectId = `${classType}:${data.id}`
  const updated_at = new Date(data.updated_at).valueOf()
  let c = -1
  const originId = (): HLC => hlc.receive(`${updated_at}:${c++}:arena`)

  if (!current) {
    return record(db, {
      objectId,
      type: `add:${classType}`,
      originId: originId(),
      data
    })
  }

  if (current.updated_at === updated_at) return
  return diffEntry(db, { data, current, objectId, originId })
}


/** 
  * CHECK IF CONNECTION EXISTS BEFORE CALLING THIS 
  */
export const arena_user_import = async (db: DB | TXAsync, user: Partial<ArenaUser>) => {
  const objectId = `user:${user.id}`
  const originId: HLC = hlc.receive(`${Date.now()}:0:arena`)
  return record(db, { objectId, type: `add:user`, originId, data: user })
}

/** CHECK IF CONNECTION EXISTS BEFORE CALLING THIS */
export const arena_connection_import = (
  db: DB | TXAsync,
  parent: ArenaChannelWithDetails,
  child: ArenaChannelContents,
) => {
  const objectId = `connection:${JSON.stringify([parent.id, child.id])}`
  const connected_at = new Date(child.connected_at).valueOf()
  const originId: HLC = hlc.receive(`${connected_at}:0:arena`)

  let { contents, ...parentData } = parent
  return record(db, {
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
