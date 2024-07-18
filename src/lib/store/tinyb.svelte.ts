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
			CREATE TABLE IF NOT EXISTS Users(
						id INT PRIMARY KEY,
						slug TEXT,
						firstname TEXT,
						lastname TEXT,
						avatar TEXT
					) WITHOUT ROWID;
					
			CREATE TABLE IF NOT EXISTS Channels(
				id INT PRIMARY KEY,
				slug TEXT, 
				title TEXT DEFAULT '',
				created_at TEXT DEFAULT CURRENT_TIMESTAMP,
				status TEXT DEFAULT 'offline',
				author_slug TEXT DEFAULT 'local',
				flags TEXT default '[]'
			);
			
			INSERT INTO Users(id) VALUES ('local');
			
			CREATE TABLE IF NOT EXISTS Blocks(
				id INTEGER PRIMARY KEY,
				title TEXT DEFAULT '',
				filename TEXT DEFAULT '',
				description TEXT DEFAULT '',
				type TEXT ,
				content TEXT,
				image TEXT
				created_at TEXT DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
				source TEXT,
				author_id TEXT DEFAULT 'local'
			);
			
			CREATE TABLE IF NOT EXISTS BlocksConnections(
				block_id INTEGER NOT NULL,
				channel_slug TEXT NOT NULL
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
