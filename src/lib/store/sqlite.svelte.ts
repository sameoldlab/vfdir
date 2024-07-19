import initWasm, { DB } from "@vlcn.io/crsqlite-wasm";
import wasmUrl from "@vlcn.io/crsqlite-wasm/crsqlite.wasm?url";


export class Cr {
	db = $state<DB>(undefined)
	instances = $state(0)
	fulfilled = $state(false)
	error = $state<Error>()
}

export const db = init()

function init() {
	const cr = new Cr()

	async function initialize() {
		cr.fulfilled = false
		cr.instances++
		console.log(`${cr.instances} instances`)
		try {
			const sqlite = await initWasm(() => wasmUrl);
			cr.db = await sqlite.open("my-database.db");
			await initDb(cr.db)
			cr.fulfilled = cr.db !== undefined
		} catch (err) {
			console.error(err)
			cr.error = err
			cr.fulfilled = false
		}
	}
	if (cr.db == undefined) initialize()

	return cr
}

async function initDb(db: DB) {
	try {
		const isReady = await db.execA(`SELECT name FROM sqlite_master WHERE type='table' AND name='Users';`)
		if (isReady.length > 0) return

		console.debug('Initializing database...')
		await db.tx(tx => tx.exec(`
			pragma journal_mode = wal;
			CREATE TABLE IF NOT EXISTS Users(
				id TEXT PRIMARY KEY NOT NULL,
				slug TEXT,
				firstname TEXT,
				lastname TEXT,
				avatar TEXT
			);

			CREATE TABLE IF NOT EXISTS Channels(
				id TEXT PRIMARY KEY NOT NULL,
				slug TEXT,
				title TEXT DEFAULT '',
				created_at TEXT DEFAULT CURRENT_TIMESTAMP,
				status TEXT DEFAULT 'private',
				author_slug TEXT DEFAULT 'local',
				flags TEXT default '[]',
				arena_id INT
			);

			INSERT INTO Users(id) VALUES ('local');
			
			CREATE TABLE IF NOT EXISTS Blocks(
				id TEXT PRIMARY KEY NOT NULL,
				title TEXT DEFAULT '',
				type TEXT,
				created_at TEXT DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
				description TEXT DEFAULT '',
				content TEXT,
				image TEXT,
				source TEXT,
				filename TEXT,
				author_id TEXT DEFAULT 'local',
				arena_id INTEGER
			);

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
				user_id INTEGER
			);
		`
		))

		// user_id INT NOT NULL default 0,
		// updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		// FOREIGN KEY (user_id) REFERENCES Users(rowid)
		// kind = 'default | 'profile'
		// Tags: published, open, collaboration, (kind == 'default' ? null : 'profile')


	} catch (err) {
		console.error('CAUGHT', err.name, err.message)
	}
}
