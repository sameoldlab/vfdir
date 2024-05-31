import { sqlite3Worker1Promiser, type Promiser } from '@sqlite.org/sqlite-wasm'

export const filename = 'file:vfdir.sqlite3?vfs=opfs'
export async function initSqlite(promiser: Promiser) {
	try {
		console.debug('Loading and initializing SQLite3 module...')

		await promiser('config-get', {}).then(configResponse => {
			console.info(
				'Running SQLite3 version',
				configResponse.result.version.libVersion
			)
		})

		const openResponse = await promiser('open', {
			filename,
		})
		const { dbId } = openResponse
		if (openResponse.type !== 'error') {
			console.debug(
				'OPFS is available, created persisted database at',
				openResponse.result.filename.replace(/^file:(.*?)\?vfs=opfs$/, '$1')
			)
		}

		await promiser('exec', {
			sql: /*sql*/ `SELECT count(*) FROM Users limit 1`,
		})
			.catch(async error => {
				if (
					(error.result.message as string).includes(
						'SQLITE_ERROR: sqlite3 result code 1: no such table: Users'
					)
				) {
					console.debug('Initializing database...')
					await createTables(promiser)
				}
			})
			.finally(() => {
				promiser('close', { dbId: dbId })
			})
	} catch (err) {
		if (!(err instanceof Error)) {
			err = new Error(err.result.message)
		}
		console.error(err.name, err.message)
	}
}

/*^************************************************
	              Create Tables
**************************************************/

async function createTables(promiser: Promiser) {
	await promiser('exec', {
		sql: /*sql*/ `CREATE TABLE IF NOT EXISTS Users(
			id INTEGER PRIMARY KEY,
			slug TEXT,
			avatar TEXT
		);
		
		CREATE TABLE IF NOT EXISTS Channels(
			slug TEXT PRIMARY KEY, 
			title TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			status TEXT DEFAULT 'offline',
			flags TEXT default '[]'
		) WITHOUT ROWID;

		INSERT INTO Users(id) VALUES (0);
		`,
	})

	// user_id INT NOT NULL default 0,
	// updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	// FOREIGN KEY (user_id) REFERENCES Users(rowid)
	// kind = 'default | 'profile'
	// Tags: published, open, collaboration, (kind == 'default' ? null : 'profile')
}
