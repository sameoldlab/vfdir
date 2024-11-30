export const blocks = new Map<string, Block>()
export const channels = new Map<string, Channel>()
export const users = new Map<string, User>()
export const media = new Map<string, string>()

export class User {
  key: string
  id: string
  slug: string = $state()
  firstname: string = $state()
  lastname: string = $state()
  avatar: string = $state()
  #keys = new Set<string>()
  #channels: string[] = []
  #blocks: string[] = []

  constructor(obj: User) {
    this.id = `${obj.id}`
    this.slug = obj.slug
    this.key = this.slug
    this.firstname = obj.firstname
    this.lastname = obj.lastname
    this.avatar = obj.avatar
    users.set(this.key, this)
  }
  addEntry(key: string, type: 'blocks' | 'channels') {
    if (this.#keys.has(key)) return
    this.#keys.add(key)
    if (type === 'channels')
      this.#channels.push(key)
    else this.#blocks.push(key)
  }
  get blocks() {
    return this.#blocks.map(id => blocks.get(id))
  }
  get channels() {
    return this.#channels.map(slug => channels.get(slug))
  }
  get all(): (Channel | Block)[] {
    const c = this.#channels.map(slug => channels.get(slug))
    const b = this.#blocks.map(id => blocks.get(id))
    return c.concat(b).sort((a, b) => a.updated_at - b.updated_at)
  }
}
export type Child = Connection & ({ is_channel: false } & Block | { is_channel: true } & Channel)
export class Connection {
  key: string
  id: string
  parent_id: string
  child_id: string
  is_channel: true | false
  position: number
  selected: boolean
  connected_at: number
  user_slug: string
  connected_by: string

  constructor(obj: Connection) {
    this.id = `${obj.id}`
    this.key = this.id
    this.parent_id = `${obj.parent_id}`
    this.child_id = `${obj.child_id}`
    this.is_channel = obj.is_channel === 1
    this.position = obj.position
    this.selected = obj.selected
    this.connected_at = obj.connected_at
    this.connected_by = obj.user_slug
  }
  get(): Child {
    const child = this.is_channel ? channels.get(this.child_id) : blocks.get(this.child_id)
    if (!child) {
      throw new Error(`Child not found for ${this.key} `);
    }
    return Object.assign(child, this) as Child
  }
}
export class Channel {
  key: string
  slug: string
  id: string
  title: string
  description: string
  created_at: number
  updated_at: number
  status: string
  image: string
  #author: string
  #keys = new Set<string>()
  get author() {
    return users.get(this.#author)
  }
  #blocks: Connection[] = []
  get blocks(): ((Block | Channel) & Connection)[] {
    return this.#blocks.map(id => id.get())
  }
  constructor(obj: Channel) {
    this.id = `${obj.id}`
    this.title = obj.title
    this.slug = obj.slug
    this.key = this.slug
    this.status = obj.status
    this.description = obj.description
    this.created_at = obj.created_at
    this.updated_at = obj.updated_at
    this.image = obj.image
    this.#author = obj.author_slug
    channels.set(this.key, this)
    populateUser(this.key, this.#author, 'channels')
  }
  addBlock(conn: Connection) {
    if (this.#keys.has(conn.child_id)) return
    this.#keys.add(conn.child_id)
    this.#blocks.push(new Connection(conn))
  }
  get length() {
    return this.#blocks.length
  }
}
function populateUser(key: string, userId: string, type = 'blocks') {
  const user = users.get(userId)
  if (user) user.addEntry(key, type)
}
export class Block {
  key: string
  id: string
  title: string = $state('')
  description: string = $state('')
  media?: string = $state('')
  content?: string = $state('')
  type
  created_at: number
  updated_at: number
  filename
  provider_url
  image
  source
  #author: string = ''
  get author() {
    const a = users.get(this.#author)
    if (!a) throw Error(`${this.#author} not found`)
    return a
  }
  #connections = new Set<string>()
  get connections() {
    return [...this.#connections.values()].map(c => channels.get(c))
  }

  constructor(b: Block) {
    this.type = b.type
    this.created_at = b.created_at
    this.updated_at = b.updated_at
    this.filename = b.filename
    this.provider_url = b.provider_url
    this.image = b.image
    this.source = b.source

    this.id = `${b.id}`
    this.key = this.id
    this.title = b.title
    this.description = b.description
    this.media = b.media
    this.content = b.content
    this.#author = b.author_slug
    blocks.set(this.key, this)

    populateUser(this.key, this.#author)
  }
  addConnection(slug: string) {
    this.#connections.add(slug)
  }
}
