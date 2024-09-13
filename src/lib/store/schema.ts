// user_id INT NOT NULL default 0,
// updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
// FOREIGN KEY (user_id) REFERENCES Users(rowid)
// kind = 'default | 'profile'
// Tags: published, open, collaboration, (kind == 'default' ? null : 'profile')

export type Block = {
	id: string;
	title: string;
	type: string;
	updated_at: Date;
	created_at: Date;
	description: string;
	content?: string;
	image?: string;
	source?: string;
	filename?: string;
	author_id: string;
	arena_id?: number;
};

export type BlockRaw = {
	id: string;
	title: string;
	type: string;
	updated_at: string;
	created_at: string;
	description: string;
	content?: string;
	image?: string;
	filename?: string;
	author_id: string;
	arena_id?: number;
};

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
	source_id TEXT,
	filename TEXT,
	author_id TEXT DEFAULT 'local',
	arena_id INTEGER
);
`

export type ChannelStatus = "private" | "closed" | "public";
export type ChannelFlags = "published" | "collaboration" | "default" | "profile";

export type Channel = {
	slug: string;
	title: string;
	updated: Date;
	created_at: Date;
	status: ChannelStatus;
	author_slug: string;
	flags: ChannelFlags[];
	blocks: Block[];
};

export type ChannelRaw = {
	id: string;
	slug?: string;
	title: string;
	updated_at: string;
	created_at: string;
	status: string;
	author_slug: string;
	flags: `[${string}]`;
	arena_id?: number
	// blocks: Block[];
};

const channels = `
CREATE TABLE IF NOT EXISTS Channels(
	id TEXT PRIMARY KEY NOT NULL,
	slug TEXT,
	title TEXT DEFAULT '',
	updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
	created_at TEXT DEFAULT CURRENT_TIMESTAMP,
	status TEXT DEFAULT 'private',
	author_slug TEXT DEFAULT 'local',
	flags TEXT default '[]',
	arena_id INT
);
`

export const schema = /*sql*/`
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
CREATE TABLE IF NOT EXISTS Connections(
		block_id INTEGER NOT NULL,
		channel_slug TEXT NOT NULL,
		is_channel INTEGER DEFAULT 0,
		position INTEGER,
		selected INTEGER,
		connected_at TEXT,
		user_id TEXT
);
`
