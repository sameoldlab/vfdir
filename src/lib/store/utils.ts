import type { DB } from "@vlcn.io/crsqlite-wasm";

type ChannelStatus = "private" | "closed" | "public";
type ChannelFlags = "published" | "collaboration" | "default" | "profile";

export type Block = {
	id: number;
	title: string;
	filename?: string;
	description: string;
	type: string;
	content?: string;
	image?: string;
	created_at: string;
	updated_at: string;
	source: string;
	author_id: string;
	arena_id: number;
};

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

/**
	Insert an array off items into the given database.
	Expects the table to already exist
	@param {DB} db - DB Connection. Recommended to run inside a transaction
	@param {Array} channels
*/
export const insertChannels = async (db: DB, channels: Channel[]) => {
	let list = await db.execO<Channel>(`SELECT * FROM Channels`)
	const stmt = await db.prepare(
		`INSERT INTO Channels (slug, title, created_at, status, author_slug, flags) VALUES (?, ?, ?, ?, ?, ?);`,
	);

	channels.forEach(async (v) => {
		// if (this.#list.has(v[keys.Channels])) return;
		await stmt.run(
			db,
			v.slug,
			v.title,
			v.created_at,
			v.status,
			v.author_slug,
			v.flags,
		);
	});

	stmt.finalize(null);
};

/**
	Insert an array off items into the given database.
	Expects the table to already exist
	@param {DB} db - DB Connection. Recommended to run inside a transaction
	@param {Array} blocks
*/
export const insertBlocks = async (db: DB, blocks: Exclude<Block, "id">[]) => {
	let list = await db.execO<Block>(`SELECT * FROM Blocks`);

	const stmt = await db.prepare(`
		INSERT INTO Blocks
						(title,filename,description,type,content,image,created_at,updated_at,source)
		VALUES 	(		 ?, 			?, 				  ?,   ?,      ?,    ?,         ?,         ?,     ?);
		`);

	blocks.forEach(async (v) => {
		// if (.has(v[keys.Blocks])) return;
		await stmt.run(
			db,
			v.title,
			v.filename,
			v.description,
			v.type,
			v.content,
			v.image,
			v.created_at,
			v.updated_at,
			v.source,
		);
	});
	stmt.finalize(null);
};
