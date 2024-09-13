import { schema } from '$lib/store/schema'
import type { DB } from "@vlcn.io/crsqlite-wasm"

export async function createTables(db: DB) {
	try {
		const isReady = await db.execA(`SELECT name FROM sqlite_master WHERE type='table' AND name='Users';`)
		if (isReady.length > 0) return

		console.debug('Initializing database...')
		await db.tx(tx => tx.exec(schema))

		// user_id INT NOT NULL default 0,
		// updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		// FOREIGN KEY (user_id) REFERENCES Users(rowid)
		// kind = 'default | 'profile'
		// Tags: published, open, collaboration, (kind == 'default' ? null : 'profile')


	} catch (err) {
		console.error('CAUGHT', err.name, err.message)
	}
}
