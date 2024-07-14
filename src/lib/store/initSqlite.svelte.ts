import { sqlite3Worker1Promiser, type Promiser } from '@sqlite.org/sqlite-wasm'
// import { browser } from '$app/environment'
// let sqlite3Worker1Promiser = browser ? import('@sqlite.org/sqlite-wasm').then(module => module.sqlite3Worker1Promiser) : null

class Db {
	promiser = $state<Promiser>()
	instances = $state(0)
	fulfilled = $state(false)
}
export const filename = 'file:vfdir.sqlite3?vfs=opfs'
export const db = createPromiser()

function createPromiser() {
	let db = new Db()

	function initialize() {
		db.fulfilled = false
		db.instances++
		console.log(`${db.instances} instances`)
		sqlite3Worker1Promiser.v2({
			debug(...args) {
				console.debug(args)
			},
		}).then(promiser => {
			console.log('debug')
			db.promiser = promiser
			initSqlite(db.promiser)
			db.fulfilled = true
		}).catch((err) => {
			console.error(err)
		}).finally(() => {
			console.log(db.promiser)
			console.log('complete')
		})
	}
	if (db.promiser == undefined) initialize()
	return db
}

export async function bootstrap(promiser: Promiser) {
	/* 
		Check if OPFS is available
		Create tablesb

		get user's channels and blocks
		save to database
		
		create poll to check if there are new blocks
	*/
	const { dbId } = await promiser('open', { filename })
	await promiser('exec', {
		dbId,
		sql: /* sql */`INSERT INTO Channels(slug,title,created_at,status,author_id,flags) VALUES(?,?,?,?,?,?)`,
		// bind: [slug,title,created_at,status,author_id,flags]	
	})
	promiser('close', { dbId })
}

async function initSqlite(promiser: Promiser) {
	try {
		console.debug('Loading and initializing SQLite3 module...')

		promiser('config-get', {}).then(configResponse => {
			console.info(
				'Running SQLite3 version',
				configResponse.result.version.libVersion
			)
		})

		const openResponse = await promiser('open', { filename })
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
					/*^************************************************
													Create Tables
					**************************************************/
					await promiser('exec', {
						sql: /*sql*/ `CREATE TABLE IF NOT EXISTS Users(
							slug TEXT PRIMARY KEY,
							firstname TEXT,
							lastname TEXT,
							avatar TEXT
						) WITHOUT ROWID;
						
						CREATE TABLE IF NOT EXISTS Channels(
							slug TEXT PRIMARY KEY, 
							title TEXT NOT NULL,
							created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
							status TEXT DEFAULT 'offline',
							author_slug TEXT DEFAULT 'local',
							flags TEXT default '[]'
						) WITHOUT ROWID;
				
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
						`,
					})

					// user_id INT NOT NULL default 0,
					// updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					// FOREIGN KEY (user_id) REFERENCES Users(rowid)
					// kind = 'default | 'profile'
					// Tags: published, open, collaboration, (kind == 'default' ? null : 'profile')
				}
			})
			.finally(() => {
				promiser('close', { dbId })
			})
	} catch (err) {
		if (!(err instanceof Error)) {
			err = new Error(err.result.message)
		}
		console.error(err.name, err.message)
	}
}
