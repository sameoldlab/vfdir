import {
	array,
	coerce,
	date,
	enums,
	nullable,
	number,
	object,
	string,
	type Infer
} from 'superstruct'

const parseDate = coerce(string(), number(), (value) => new Date(value).valueOf())

export const Block = object({
	id: string(),
	title: string(),
	// block, channel, profile
	type: string(),
	updated_at: number(),
	created_at: number(),
	description: string(),
	content: nullable(string()),
	image: nullable(string()),
	source: nullable(string()),
	filename: nullable(string()),
	provider_id: nullable(string()),
	arena_id: nullable(number()),
	author_id: string()
})

const blocks = `
CREATE TABLE IF NOT EXISTS Blocks(
	id TEXT PRIMARY KEY NOT NULL,
	title TEXT DEFAULT '',
	type TEXT,
	updated_at INTEGER DEFAULT (strftime('%s', 'now')),
	created_at INTEGER DEFAULT (strftime('%s', 'now')),
	description TEXT DEFAULT '',
	content TEXT,
	image TEXT,
	source TEXT,
	filename TEXT,
	provider_id TEXT,
	author_id TEXT DEFAULT 'local',
	arena_id INTEGER,
	foreign key (author_id) references Users(id)
);
`

// Application Block Schema
const BlockParsed = object({
	...Block.schema,
	updated_at: date(),
	created_at: date()
})

export type Block = Infer<typeof Block>
export type BlockParsed = Infer<typeof BlockParsed>

// Channels

export const Channel = object({
	id: string(),
	slug: nullable(string()),
	title: string(),
	/** `JSON.stringified` array */
	flags: string(),
	status: enums(['private', 'closed', 'public']),
	updated_at: number(),
	created_at: number(),
	author_id: string(),
	/** if imported from external service,
	 * service identifier ':' imported id
	 * @example `arena:2948201`
	 */
	external_id: nullable(string())
})

const channels = `
CREATE TABLE IF NOT EXISTS Channels(
	id TEXT PRIMARY KEY NOT NULL,
	slug TEXT,
	title TEXT DEFAULT '',
	flags TEXT DEFAULT '[]',
	status TEXT DEFAULT 'private',
	updated_at INTEGER DEFAULT (strftime('%s', 'now')),
	created_at INTEGER DEFAULT (strftime('%s', 'now')),
	author_id TEXT DEFAULT 'local',
	external_id TEXT UNIQUE
);
`
// Tags: published, open, collaboration, (kind == 'default' ? null : 'profile')
export const ChannelParsed = object({
	...Channel.schema,
	updated_at: date(),
	created_at: date(),
	flags: array(enums(['published', 'collaboration', 'default', 'profile']))
})

export type Channel = Infer<typeof Channel>
export type ChannelParsed = Infer<typeof ChannelParsed>

// Connections
export const Connections = object({
	child_id: string(),
	parent_id: string(),
	/** if child block is of type Channel */
	is_channel: enums([0, 1]),
	position: nullable(number()),
	selected: enums([0, 1]),
	connected_at: string(),
	/** User who created the connection */
	user_id: string(),
})

const connections = `
CREATE TABLE IF NOT EXISTS Connections(
	parent_id TEXT NOT NULL,
	child_id TEXT NOT NULL,
	is_channel INTEGER DEFAULT 0,
	position INTEGER,
	selected INTEGER DEFAULT 0,
	connected_at INTEGER DEFAULT (strftime('%s', 'now')),
	user_id TEXT DEFAULT 'local'
);
`

export type Connections = Infer<typeof Connections>

// Users
export const Users = object({
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
export type Users = Infer<typeof Users>

// Providers
export const Providers = object({
	id: string(),
	url: nullable(string()),
	name: nullable(string()),
})
const providers = `
CREATE TABLE IF NOT EXISTS Providers(
	id TEXT PRIMARY KEY NOT NULL,
	url TEXT,
	name TEXT
);
`
export type Providers = Infer<typeof Providers>

// schema
export const schema = /*sql*/ `
pragma journal_mode = wal;
${users}
INSERT INTO Users(id) VALUES ('local');
${blocks}
${channels}
${connections}
${providers}

CREATE INDEX idx_blocks_type_author_id ON Blocks(type, author_id);
CREATE INDEX idx_blocks_author_id ON Blocks(author_id);
CREATE INDEX idx_blocks_created_at ON Blocks(created_at);

CREATE INDEX idx_connections_child_id ON Connections(child_id);
CREATE INDEX idx_connections_parent_child ON Connections(parent_id, child_id);
CREATE INDEX idx_connections_position ON Connections(parent_id, position);
`
