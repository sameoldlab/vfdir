import type { DB } from "@vlcn.io/crsqlite-wasm"

export async function initStore(db: DB) {
	console.log('init')
	if (localStorage.getItem('deviceId') !== null) return

	const { ulid } = await import('ulidx')
	if (!localStorage.getItem('deviceId')) {
		localStorage.setItem('deviceId', ulid())
	}
	console.debug('Initializing database...')
	const { schema } = await import('$lib/database/schema')
	await db.tx(tx => tx.execMany(schema))
	return
}
