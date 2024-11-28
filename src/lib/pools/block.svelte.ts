export const blocks = new Map<string, Block>()
export const channels = new Map<string, Channel>()
export const users = new Map<string, User>()

export type BlockT = {
  id: string
  title: string
  description: string
  connections: string[]
  media: string
  content?: string
  user: string
}
export type ChannelT = {
  id: string
  title: string
  description: string
  blocks: Connection[]
  media: string
  content?: string
  user: User
}
export type ConnectionT = {
  id: string
  postion: number
  selected: boolean
}
export type UserT = {
  slug: string
  avatar: string
  channels: Channel[]
  blocks: Block[]
}
export const media = new Map<string, string>()

export class User {
  id: string = $state()
  slug: string = $state()
  firstname: string = $state()
  lastname: string = $state()
  avatar: string = $state()
  #channels: string[] = $state([])
  #blocks: string[] = $state([])

  constructor(obj: User) {
    this.id = `${obj.id}`
    this.slug = obj.slug
    this.firstname = obj.firstname
    this.lastname = obj.lastname
    this.avatar = obj.avatar
    users.set(this.slug, this)
  }
  addBlock(id: string) {
    this.#blocks.push(`${id}`)
  }
  addChannel(slug: string) {
    this.#channels.push(`${slug}`)
  }
  get blocks() {
    return this.#blocks.map(id => blocks.get(id))
  }
  get channels() {
    return this.#channels.map(slug => channels.get(slug))
  }
}
export class Connection {
  id
  parent_id
  child_id
  is_channel
  position
  selected
  connected_at
  user_slug
  connected_by
  constructor(obj: Connection) {
    this.id = `${obj.id}`
    this.parent_id = `${obj.parent_id}`
    this.child_id = `${obj.child_id}`
    this.is_channel = obj.is_channel === 1
    this.position = obj.position
    this.selected = obj.selected
    this.connected_at = obj.connected_at
    this.connected_by = obj.user_slug

    if (this.is_channel) console.log(this)
  }
  get() {
    const child = this.is_channel ? channels.get(this.child_id) : blocks.get(this.child_id)
    return child ? Object.assign(child, this) : this
  }
}
export class Channel {
  id
  type
  title
  slug
  description
  created_at
  updated_at
  source
  status
  image
  author_slug
  #author_id
  #blocks: Connection[] = $state([])
  constructor(obj: Channel) {
    this.id = `${obj.id}`
    this.type = obj.type
    this.title = obj.title
    this.slug = obj.slug
    this.status = obj.status
    this.description = obj.description
    this.created_at = obj.created_at
    this.updated_at = obj.updated_at
    this.image = obj.image
    this.source = obj.source
    this.author_slug = obj.author_slug
    channels.set(this.slug, this)
  }
  get author() {
    return users.get(this.author_slug)
  }
  addBlock(conn: Connection) {
    this.#blocks.push(new Connection(conn))
  }
  get blocks() {
    return this.#blocks.map(id => id.get())
  }
  get length() {
    return this.#blocks.length
  }
}
export class Block {
  id: string = $state('')
  title: string = $state('')
  description: string = $state('')
  #connections: string[] = $state([])
  media?: string = $state('')
  content?: string = $state('')
  #user: string = ''
  type
  created_at
  updated_at
  filename
  provider_url
  image
  source

  constructor(b: BlockT) {
    this.type = b.type
    this.created_at = b.created_at
    this.updated_at = b.updated_at
    this.filename = b.filename
    this.provider_url = b.provider_url
    this.image = b.image
    this.source = b.source

    this.id = `${b.id}`
    this.title = b.title
    this.description = b.description
    this.media = b.media
    this.content = b.content
    this.#user = b.author_slug
    blocks.set(this.id, this)
  }
  addConnection(slug: string) {
    this.#connections.push(slug)
  }
  get author() {
    return users.get(this.#user)
  }
  get connections() {
    const conns = this.#connections.map(c => channels.get(c))
    return conns
  }
}
