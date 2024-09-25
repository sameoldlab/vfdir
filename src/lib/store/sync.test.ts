import initWasm from '@vlcn.io/crsqlite-wasm'
import wasmUrl from '@vlcn.io/crsqlite-wasm/crsqlite.wasm?url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTables } from './createTables'
import { bootstrap, parseArenaChannels } from './sync.svelte'
import { arenaChannels as mockChannels } from '$lib/dummy/channels'
import duplicateChans from '$lib/dummy/duplicateChans'

describe('Bootstrap database', async () => {
	let db
	beforeAll(async () => {
		const sqlite = await initWasm(() => wasmUrl)
		db = await sqlite.open()
		/* await db.exec(`
			delete from users;
			delete from blocks;
			delete from connections;
			delete from providers;
		`) */
		await createTables(db)

	})
	afterAll(async () => {
		await db.close()
	})

	it('runs bootstrap without error', async () => {
		// const res = await bootstrap(db)
		// expect(res).toBeTruthy()
	})

	// reinserting the same data does not duplicate rows
	it('does not duplicate inserts', async () => {
		console.time('parse')
		await parseArenaChannels(db, mockChannels)
		console.timeEnd('parse')
		const length1 = (await db.execA('select count(*) from Blocks;'))[0][0];

		const totalUniques = mockChannels.reduce((r, c) => {
			r.add(c.id)
			c.contents && c.contents.forEach((b) => r.add(b.id))
			return r
		}, new Set())

		console.time('parse double')
		await parseArenaChannels(db, mockChannels)
		console.timeEnd('parse double')
		const length2 = (await db.execA('select count(*) from Blocks;'))[0][0];

		expect(length1).toEqual(totalUniques.size)
		expect(length2).toEqual(totalUniques.size)
	})
})

describe('Deduplication and sync', async () => {
	let db
	beforeAll(async () => {
		const sqlite = await initWasm(() => wasmUrl)
		db = await sqlite.open()
		await createTables(db)

	})
	afterAll(async () => {
		await db.close()
	})

	it('skips repeated blocks', async () => {
		await parseArenaChannels(db, duplicateChans)
		const bLen = (await db.execA('select count(*) from Blocks;'))[0][0];
		const cLen = (await db.execA('select count(*) from Connections;'))[0][0];
		const uLen = (await db.execA('select count(*) from Users;'))[0][0];
		const pLen = (await db.execA('select count(*) from Providers;'))[0][0];

		expect(bLen).toEqual(2)
		expect(cLen).toEqual(1)
		expect(uLen).toEqual(2)
		expect(pLen).toEqual(1)
	})
})
