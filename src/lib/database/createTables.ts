import { schema } from '$lib/database/schema'
import type { DB } from "@vlcn.io/crsqlite-wasm"

export async function initStore(db: DB) {
	if (localStorage.getItem('deviceId') !== null) return
	console.debug('Initializing database...')
	await db.tx(tx => tx.execMany(schema))
}
