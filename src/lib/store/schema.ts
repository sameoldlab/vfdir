import {
	array,
	assign,
	boolean,
	coerce,
	date,
	defaulted,
	enums,
	nullable,
	number,
	object,
	string,
	union,
	type,
	type Infer
} from 'superstruct'

const parseDate = coerce(date(), number(), (value) => new Date(value).valueOf())

export const Block = type({
	id: string(),
	title: string(),
	/** block, channel, profile */
	type: string(),
	updated_at: number(),
	created_at: number(),
	description: string(),
	content: nullable(string()),
	image: nullable(string()),
	/** source url or (if type===channel) import source (arena,omnivore,fs,raindrop) */
	source: nullable(string()),
	filename: nullable(string()),
	provider_id: nullable(string()),
	author_id: string(),
	/** if imported from external service,
	 * service identifier ':' imported id
	 * @example `arena:2948201`
	 */
	external_ref: nullable(string()),
})

const BlockParsed = assign(Block, object({
	updated_at: parseDate,
	created_at: parseDate,
}))

export const Channel = assign(Block, object({
	type: enums(['channel']),
	slug: nullable(string()),
	/** `JSON.stringified` array */
	flags: string(),
	status: defaulted(enums(['private', 'closed', 'public']), 'private'),
}))
const ChannelParsed = assign(Channel, object({
	updated_at: parseDate,
	created_at: parseDate,
	flags: coerce(array(enums(['published', 'collaboration', 'default', 'profile'])), string(), value => JSON.parse(value))
}))
const BlocksRow = union([Block, Channel])

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
	provider_id TEXT,
	author_id TEXT DEFAULT 'local',
	external_ref text UNIQUE,
	--exists if type='channel'
	slug text,
	flags TEXT DEFAULT '[]',
	status TEXT DEFAULT 'private',
	--exists if type='channel',
	foreign key (author_id) references Users(id),
	foreign key (provider_id) references Providers(id)
);
`

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
	user_id: string()
})
const intToBool = coerce(boolean(), enums([0, 1]), (value) => value === 1)
export const ConnectionsParsed = object({
	...Connections.schema,
	is_channel: intToBool,
	selected: intToBool,
})

const connections = `
CREATE TABLE IF NOT EXISTS Connections(
	parent_id TEXT NOT NULL,
	child_id TEXT NOT NULL,
	is_channel INTEGER DEFAULT 0,
	position INTEGER,
	selected INTEGER DEFAULT 0,
	connected_at INTEGER DEFAULT (strftime('%s', 'now')),
	user_id TEXT DEFAULT 'local',
	unique (parent_id, child_id)
);
`

export type Connections = Infer<typeof Connections>
export type ConnectionsParsed = Infer<typeof ConnectionsParsed>

// Users
export const Users = object({
	id: string(),
	slug: nullable(string()),
	firstname: nullable(string()),
	lastname: nullable(string()),
	avatar: nullable(string()),
	external_ref: nullable(string())
})

const users = `
CREATE TABLE IF NOT EXISTS Users(
	id TEXT PRIMARY KEY NOT NULL,
	slug TEXT UNIQUE,
	firstname TEXT,
	lastname TEXT,
	avatar TEXT,
	external_ref TEXT UNIQUE
);
`
export type Users = Infer<typeof Users>

// Providers
export const Providers = object({
	id: string(),
	url: nullable(string()),
	name: nullable(string())
})
const providers = `
CREATE TABLE IF NOT EXISTS Providers(
	id TEXT PRIMARY KEY NOT NULL,
	url TEXT UNIQUE NOT NULL,
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
${connections}
${providers}

CREATE INDEX idx_blocks_type_author_id ON Blocks(type, author_id);
CREATE INDEX idx_blocks_author_id ON Blocks(author_id);
CREATE INDEX idx_blocks_created_at ON Blocks(created_at);

CREATE INDEX idx_connections_child_id ON Connections(child_id);
CREATE INDEX idx_connections_parent_child ON Connections(parent_id, child_id);
CREATE INDEX idx_connections_position ON Connections(parent_id, position);
`
