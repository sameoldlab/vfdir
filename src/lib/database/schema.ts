import {
	array,
	assign,
	boolean,
	coerce,
	date,
	enums,
	nullable,
	number,
	object,
	string,
	union,
	type,
	type Infer,
	optional,
	tuple,
	unknown,
	record,
	bigint
} from 'superstruct'
import { ulid } from 'ulidx'

const int_date = coerce(date(), number(), (value) => new Date(value))
const date_int = coerce(number(), union([string(), date()]), (value) => typeof value === 'string' ? new Date(value).valueOf() : value.valueOf())

export const BlockShared = type({
	id: string(),
	title: string(),
	/** block, channel, profile */
	type: string(),
	updated_at: date_int,
	created_at: date_int,
	author_slug: string(),
	/** if imported from external service,
	 * service identifier ':' imported id
	 * @example `arena:2948201`
	 */
})

export const Block = assign(BlockShared, type({
	description: optional(string()),
	provider_url: nullable(string()),
	content: nullable(string()),
	image: nullable(string()),
	filename: nullable(string()),
	/** source url */
	source: nullable(string()),
}))

const BlockParsed = assign(Block, object({
	updated_at: int_date,
	created_at: int_date,
}))

const channelFlags = enums(['published', 'collaboration', 'default', 'profile'])
export const Channel = assign(BlockShared, type({
	type: enums(['channel']),
	slug: nullable(string()),
	/** `JSON.stringified` array */
	flags: coerce(string(), array(channelFlags), (value) => JSON.stringify(value)),
	status: nullable(enums(['private', 'closed', 'public'])),
	/** import source (arena,omnivore,fs,raindrop) */
	source: nullable(string()),
}))
const ChannelParsed = assign(Channel, object({
	updated_at: int_date,
	created_at: int_date,
	flags: coerce(array(channelFlags), string(), value => JSON.parse(value))
}))

export const BlocksRow = union([Block, Channel])
export type BlocksRow = Infer<typeof BlocksRow>
export type Block = Infer<typeof Block>
export type BlockParsed = Infer<typeof BlockParsed>
export type Channel = Infer<typeof Channel>
export type ChannelParsed = Infer<typeof ChannelParsed>

const blocks = `
CREATE TABLE IF NOT EXISTS Blocks(
	id TEXT PRIMARY KEY NOT NULL,
	title TEXT DEFAULT '',
	type TEXT, -- channel or block_{type}
	updated_at INTEGER DEFAULT (strftime('%s', 'now')),
	created_at INTEGER DEFAULT (strftime('%s', 'now')),
	description TEXT DEFAULT '',
	content TEXT,
	image TEXT,
	-- url or (if type=channel) import source (arena,omnivore,fs,raindrop)
	source TEXT,
	filename TEXT,
	provider_url TEXT,
	author_slug TEXT DEFAULT 'local',
	--exists if type='channel'
	slug text,
	flags TEXT DEFAULT '[]',
	status TEXT DEFAULT 'private',
	--exists if type='channel',
	foreign key (author_slug) references Users(slug),
	foreign key (provider_url) references Providers(url)
);
`

// Connections
export const Connection = type({
	id: string(),
	child_id: string(),
	parent_id: string(),
	/** if child block is of type Channel */
	is_channel: enums([0, 1]),
	position: nullable(number()),
	selected: enums([0, 1]),
	connected_at: number(),
	/** User who created the connection */
	user_slug: string()
})
const intToBool = coerce(boolean(), enums([0, 1]), (value) => value === 1)
export const ConnectionParsed = object({
	...Connection.schema,
	is_channel: intToBool,
	selected: intToBool,
})

const connections = `
CREATE TABLE IF NOT EXISTS Connections(
	id TEXT PRIMARY KEY,
	parent_id TEXT NOT NULL,
	child_id TEXT NOT NULL,
	is_channel INTEGER DEFAULT 0,
	position INTEGER,
	selected INTEGER DEFAULT 0,
	connected_at INTEGER DEFAULT (strftime('%s', 'now')),
	user_slug TEXT DEFAULT 'local'
);
`

export type Connection = Infer<typeof Connection>
export type ConnectionParsed = Infer<typeof ConnectionParsed>

// Users
export const User = type({
	id: string(),
	slug: nullable(string()),
	firstname: nullable(string()),
	lastname: nullable(string()),
	avatar: nullable(string()),
})

const users = `
CREATE TABLE IF NOT EXISTS Users(
	id TEXT PRIMARY KEY NOT NULL,
	slug TEXT,
	firstname TEXT,
	lastname TEXT,
	avatar TEXT
);
`
export type User = Infer<typeof User>

// Providers
export const Provider = type({
	url: nullable(string()),
	name: nullable(string())
})
const providers = `
CREATE TABLE IF NOT EXISTS Providers(
	url TEXT PRIMARY KEY,
	name TEXT
);
`
export type Provider = Infer<typeof Provider>

const state = `
CREATE TABLE IF NOT EXISTS state(
	route TEXT PRIMARY KEY,
	pageview TEXT DEFAULT 'grid'
);
`
if (!localStorage.getItem('deviceId')) {
	localStorage.setItem('deviceId', ulid())
}
export const deviceId: string = localStorage.getItem('deviceId')
export const EVENT_DB_NAME = 'log'
export const EventSchema = object({
	version: number(),
	/** Unique id on event reception */
	localId: string(),
	/** Unique id from event source */
	originId: string(),
	data: string(),
	/**
	 * add|mod|delete-column|row
	 * @example mod:title
	 */
	type: string(),
	/** 
	 * field to which the event is related 
	 * @example block:0L239vsDajfdse...
	 */
	objectId: string()
})
// const [action, field] = e.type.split(':')
// const [ts, c, device] = e.originId.split(':')
const hlc = coerce(tuple([number(), number(), string()]), string(), (hlc) => {
	const p = hlc.split(':')
	return [Number(p[0]), Number(p[1]), p[2]]
})
export const EventSchemaR = object({
	version: number(),
	/** Unique id on event reception */
	localId: hlc,
	/** Unique id from event source */
	originId: hlc,
	data: coerce(record(string(), unknown()), string(), (data) => JSON.parse(data)),
	/**
	 * add|mod|delete-column|row
	 * @example mod:title
	 */
	type: coerce(tuple([enums(['add', 'mod', 'del']), string()]), string(), (data) => data.split(':')),
	/** 
	 * field to which the event is related 
	 * @example block:0L239vsDajfdse...
	 */
	objectId: coerce(tuple([string(), union([string(), number()])]), string(), (data) => {
		const p = data.split(':')
		const id = Number(p[1])
		return [p[0], isNaN(id) ? p[1] : id]
	}),
	rowid: number()
})
export type EventSchema = Infer<typeof EventSchema>
const log = `
CREATE TABLE IF NOT EXISTS ${EVENT_DB_NAME}(
	version INT NOT NULL,
	localId TEXT NOT NULL,
	originId TEXT NOT NULL,
	data TEXT NOT NULL,
	type TEXT NOT NULL,
	objectId TEXT NOT NULL
);
`

// schema
export const schema = [
	'pragma journal_mode = wal;',
	log,
	users,
	blocks,
	connections,
	providers,
	state,
	`INSERT INTO Users(id) VALUES ('${deviceId}');`,
	'CREATE INDEX idx_blocks_type_author_slug ON Blocks(type, author_slug);',
	'CREATE INDEX idx_blocks_author_slug ON Blocks(author_slug);',
	'CREATE INDEX idx_blocks_created_at ON Blocks(created_at);',
	'CREATE INDEX idx_connections_child_id ON Connections(child_id);',
	'CREATE INDEX idx_connections_parent_child ON Connections(parent_id, child_id);',
	'CREATE INDEX idx_connections_position ON Connections(parent_id, position);',
]
