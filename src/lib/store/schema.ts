// user_id INT NOT NULL default 0,
// updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
// FOREIGN KEY (user_id) REFERENCES Users(rowid)
// kind = 'default | 'profile'
// Tags: published, open, collaboration, (kind == 'default' ? null : 'profile')

interface BlockBase {
    id: string;
    title: string;
    type: string;
    description: string;
    content?: string;
    image?: string;
    source?: string;
    filename?: string;
    provider_id: string;
    arena_id?: number;
    /** creator of block */
    author_id: string;
}

// Block interface for use in application logic
export interface Block extends BlockBase {
    updated_at: Date;
    created_at: Date;
}

// Raw block data as stored in the database
export interface BlockRaw extends BlockBase {
    updated_at: string;
    created_at: string;
}

const blocks = `
CREATE TABLE IF NOT EXISTS Blocks(
	id TEXT PRIMARY KEY NOT NULL,
	title TEXT DEFAULT '',
	type TEXT,
	updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
	created_at TEXT DEFAULT CURRENT_TIMESTAMP,
	description TEXT DEFAULT '',
	content TEXT,
	image TEXT,
	source TEXT,
	filename TEXT,
	provider_id TEXT,
	author_id TEXT DEFAULT 'local',
	arena_id INTEGER,
	foreign key (author_id) refrenences Users(id)
);
`

export type ChannelStatus = 'private' | 'closed' | 'public'
export type ChannelFlag = 'published' | 'collaboration' | 'default' | 'profile'

// Base interface with common properties
interface ChannelBase {
    slug?: string
    title: string
    status: ChannelStatus
    author_id: string
    /** if imported from external service,
     * service identifier ':' imported id
     * @example `arena:2948201`
     */
    external_id?: string
}

// Channel interface for use in application logic
export interface Channel extends ChannelBase {
    updated_at: Date
    created_at: Date
    flags: ChannelFlag[]
}

// Raw channel data as stored in the database
export interface ChannelRaw extends ChannelBase {
    id: string
    updated_at: string
    created_at: string
    /** `JSON.stringified` array */
    flags: string
}

const channels = `
CREATE TABLE IF NOT EXISTS Channels(
	id TEXT PRIMARY KEY NOT NULL,
	slug TEXT,
	title TEXT DEFAULT '',
	flags TEXT DEFAULT '[]',
	status TEXT DEFAULT 'private',
	updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
	created_at TEXT DEFAULT CURRENT_TIMESTAMP,
	author_id TEXT DEFAULT 'local',
	external_id TEXT UNIQUE
);
`
interface ConnectionsBase {
	child_id: string
	parent_id: string
	/** if child block is of type Channel */
	is_channel: 0 | 1
	position?: number
	selected: 0 | 1
	connected_at: string
	/** User who created the connection */
	user_id: string
}

export interface ConnectionsRaw extends ConnectionsBase {}

const connections = `
CREATE TABLE IF NOT EXISTS Connections(
	parent_id TEXT NOT NULL,
	child_id TEXT NOT NULL,
	is_channel INTEGER DEFAULT 0,
	position INTEGER,
	selected INTEGER DEFAULT 0,
	connected_at TEXT DEFAULT CURRENT_TIMESTAMP,
	user_id TEXT DEFAULT 'local'
);
`

export const schema = /*sql*/ `
pragma journal_mode = wal;
CREATE TABLE IF NOT EXISTS Users(
	id TEXT PRIMARY KEY NOT NULL,
	slug TEXT,
	firstname TEXT,
	lastname TEXT,
	avatar TEXT
);
INSERT INTO Users(id) VALUES ('local');
${blocks}
${channels}
CREATE TABLE IF NOT EXISTS Providers(
	id TEXT PRIMARY KEY NOT NULL,
	url TEXT,
	name TEXT
);
${connections}
`
