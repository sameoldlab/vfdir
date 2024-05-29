import { sqlite3Worker1Promiser, type Promiser } from '@sqlite.org/sqlite-wasm'

export const filename = 'file:vfdir.sqlite3?vfs=opfs'
export function initSqlite(promiser: Promiser) {
	try {
		console.log('Loading and initializing SQLite3 module...')

		promiser('config-get', {}).then(configResponse => {
			console.info(
				'Running SQLite3 version',
				configResponse.result.version.libVersion
			)
		})

		promiser('open', {
			filename,
		}).then(openResponse => {
			const { dbId } = openResponse
			if (openResponse.type !== 'error') {
				console.info(
					'OPFS is available, created persisted database at',
					openResponse.result.filename.replace(/^file:(.*?)\?vfs=opfs$/, '$1')
				)
			}

			promiser('exec', {
				sql: /*sql*/ `SELECT id FROM Users limit 1`,
			})
				.catch(error => {
					if (
						(error.result.message as string).includes(
							'SQLITE_ERROR: sqlite3 result code 1: no such table: Users'
						)
					) {
						console.info('Initializing database...')
						createTables(promiser)
					}
				})
				.finally(() => {
					promiser('close', { dbId: dbId })
				})
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

function createTables(promiser: Promiser) {
	promiser('exec', {
		sql: /*sql*/ `CREATE TABLE IF NOT EXISTS Users(
			id INT PRIMARY KEY,
			slug TEXT,
			avatar TEXT
		)`,
	})

	//kind = 'default | 'profile'
	// kind: TEXT default 'default',
	promiser('exec', {
		sql: /*sql*/ `CREATE TABLE IF NOT EXISTS Channels(
			id INT PRIMARY KEY,
			title TEXT NOT NULL,
			slug TEXT NOT NULL, 
			created_at DATETIME NOT NULL,
			user_id INT NOT NULL default 0,
			status TEXT default 'private',
			FOREIGN KEY (user_id) REFERENCES Users(id)
		)`,
	})

	// published, open, collaboration
	promiser('exec', {
		sql: /*sql*/ `CREATE TABLE IF NOT EXISTS ChannelTags(
			id INT PRIMARY KEY,
			title TEXT NOT NULL
		)`,
	})

	console.log('', 'Insert some data using exec()...')
	const channelTags = ['published', 'open', 'collaboration']
	channelTags.forEach((v, i) => {
		promiser('exec', {
			sql: /*sql*/ `INSERT INTO ChannelTags(id,title) VALUES (?,?)`,
			bind: [i, v],
		})
	})
	promiser('exec', {
		sql: /*sql*/ `INSERT INTO Users(id) VALUES (0)`,
	})

	promiser('exec', {
		sql: /*sql*/ `SELECT * FROM ChannelTags`,
		callback: result => {
			console.log('', result.row)
			if (!result.row) {
				return
			}
		},
	})
}
