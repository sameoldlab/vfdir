import type { Block, Channel, Connection, User } from '$lib/pools/block.svelte'
import type { ArenaBlock, ArenaChannel, ArenaChannelWithDetails, ArenaUser } from 'arena-ts'

export function fromArenaChannel(c: ArenaChannel | ArenaChannelWithDetails): Channel {
  const flags = [c.kind] as ChannelParsed['flags']
  if (c.collaboration) flags.push('collaboration')
  if (c.published) flags.push('published')

  return {
    id: c.slug,
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
    id: user.id.toString(),
    slug: user.slug,
    firstname: user.first_name,
    lastname: user.last_name,
    avatar: user.avatar,
  }
}

export function fromArenaBlock(block: ArenaBlock): Block {
  const data = {
    id: block.id,
    type: block.class.toLowerCase(),
    title: block.title ?? '',
    description: block.description ?? '',
    created_at: new Date(block.created_at).valueOf(),
    updated_at: new Date(block.updated_at).valueOf(),
    content: block.content && block.content,
    filename: block.attachment && block.attachment.content_type,
    provider_url: block.source && block.source.provider.url,
    image: block.image && block.image.original.url,
    source: null,
    author_slug: block.user.slug,
    attachment: block.attachment?.url
  }

  if (block.class === 'Text')
    data.source = block.source ? block.source.url : block.source
  else
    data.source = block.source && block.source.url
  // db.exec(`insert or ignore into Providers values (?,?);`, [
  // 	data.source.provider.url,
  // 	data.source.provider.name
  // ])
  return data
}

export function fromArenaConnection(data): Connection {
  return {
    id: `${data.parent.id}:${data.child.id}`,
    parent_id: data.parent.slug,
    child_id: data.is_channel ? data.child.slug : data.child.id,
    is_channel: data.is_channel ? true : false,
    position: data.position,
    selected: data.selected ? true : false,
    connected_at: new Date(data.connected_at).valueOf(),
    user_slug: data.child.user.slug
  }
} 
