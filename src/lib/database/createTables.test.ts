import type { DB } from '@vlcn.io/crsqlite-wasm'
import initWasm from '@vlcn.io/crsqlite-wasm'
import wasmUrl from '@vlcn.io/crsqlite-wasm/crsqlite.wasm?url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTables } from './createTables'

describe('Database initialization', () => {
	let db: DB
	beforeAll(async () => {
		const sqlite = await initWasm(() => wasmUrl)
		db = await sqlite.open(':memory:')
	})
	afterAll(() => {
		if (db) db.close()
	})

	it('succesfully creates tables', () => {
		expect(() => createTables(db)).not.toThrow()
	})

	it('has an initial user', async () => {
		await createTables(db)
		const user = (await db.execO('select * from users limit 1'))[0]
		expect(user.id).toEqual('local')
	})
})

