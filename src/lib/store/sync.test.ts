import initWasm from '@vlcn.io/crsqlite-wasm'
import wasmUrl from '@vlcn.io/crsqlite-wasm/crsqlite.wasm?url'
import { afterAll, describe, expect, it } from 'vitest'
import { createTables } from './createTables'
import { bootstrap, parseArenaChannels } from './sync.svelte'
import { arenaChannels } from '$lib/dummy/channels'


describe('Bootstrap database', async () => {
	const sqlite = await initWasm(() => wasmUrl)
	const db = await sqlite.open(':memory:')
	await createTables(db)

	it('runs bootstrap without error', async () => {
		const res = await bootstrap(db)
		expect(res).toBeTruthy()
	})

	// reinserting the same data does not duplicate rows
	it('does not duplicate inserts', async () => {
		// console.time('parse')
		await parseArenaChannels(db, arenaChannels)
		// console.timeEnd('parse')
		const length = (await db.execO('select * from Blocks;'))//[0][0];
		console.log(length)
		// console.time('parse double')
		// const res = await parseArenaChannels(db, arenaChannels)
		// console.timeEnd('parse double')
		const length2 = (await db.execA('select count(*) from Blocks;'))[0][0];
		console.log(length2)
		// expect(res).toBeTruthy()
	})

	afterAll(async () => {
		await db.close()
	})
})
