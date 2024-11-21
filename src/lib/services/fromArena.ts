import type { ArenaBlock, ArenaChannel, ArenaChannelWithDetails, ArenaUser } from 'arena-ts'
import { Block, Channel, Connection, type ChannelParsed, type User } from '$lib/database/schema'
import { create } from 'superstruct'
import { arena_item_sync, arena_connection_import, arena_user_import, ev_stmt_close } from '$lib/database/events'

export function fromArenaChannel(c: ArenaChannel | ArenaChannelWithDetails): Channel {
  const flags = [c.kind] as ChannelParsed['flags']
  if (c.collaboration) flags.push('collaboration')
  if (c.published) flags.push('published')

  return {
    id: `arena:${c.id}`,
    type: 'channel',
    title: c.title,
    slug: c.slug,
    created_at: new Date(c.created_at).valueOf(),
    updated_at: new Date(c.updated_at).valueOf(),
    flags: JSON.stringify(flags),
    status: c.status,
    source: 'arena',
    author_slug: c.user?.slug ?? c.user_id,
  }
}

export function fromArenaUser(user: ArenaUser): User {
  return {
    id: `arena:${user.id}`,
    slug: user.slug,
    firstname: user.first_name,
    lastname: user.last_name,
    avatar: user.avatar,
  }
}

export function fromArenaBlock(block: ArenaBlock): Block {
  const data = {
    id: `arena:${block.id}`,
    type: block.class.toLowerCase(),
    title: block.title ?? '',
    description: block.description ?? '',
    created_at: new Date(block.created_at).valueOf(),
    updated_at: new Date(block.updated_at).valueOf(),
    content: null,
    filename: null,
    provider_url: null,
    image: null,
    source: null,
    author_slug: block.user.slug,
  }

  switch (block.class) {
    case 'Text':
      data.content = block.content
      data.source = block.source ? block.source?.url : block.source
      break
    case 'Attachment':
      data.filename = block.attachment.content_type
    case 'Link':
    case 'Image':
    case 'Media':
      data.image = block.image.original.url
      if (block.source) {
        // db.exec(`insert or ignore into Providers values (?,?);`, [
        // 	data.source.provider.url,
        // 	data.source.provider.name
        // ])
        data.source = block.source.url
        data.provider_url = block.source.provider.url
      }
  }
  return data
}

export function fromArenaConnection(data): Connection {
  return {
    id: `${data.parent.id}:${data.child.id}`,
    parent_id: data.parent.id,
    child_id: data.child.id,
    is_channel: data.is_channel ? 1 : 0,
    position: data.position,
    selected: data.selected ? 1 : 0,
    connected_at: new Date(data.connected_at).valueOf(),
    user_slug: data.child.user.slug
  }
} 
