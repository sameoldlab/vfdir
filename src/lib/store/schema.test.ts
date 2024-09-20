import initWasm from '@vlcn.io/crsqlite-wasm'
import wasmUrl from '@vlcn.io/crsqlite-wasm/crsqlite.wasm?url'
import { assert } from 'superstruct'
import { afterAll, describe, expect, it } from 'vitest'
import { createTables } from './createTables'
import { Block, Channel, Connection, Provider, User } from './schema'
import { bootstrap } from './sync.svelte'


describe('Validate types', async () => {
	const sqlite = await initWasm(() => wasmUrl)
	const db = await sqlite.open(':memory:')
	await createTables(db)
	await bootstrap(db)

	afterAll(async () => {
		await db.close()
	})
	// adds in all blocks and connections
	// can find providers based on the block
	// lists all blocks for a channel
	// lists all channels for a block

	it('Users table matches type', async () => {
		const user = (await db.execO('SELECT * FROM Users limit 1'))[0]
		expect(() => assert(user, User)).not.toThrow()
	})

	it('Blocks table matches type', async () => {
		const block = (await db.execO('SELECT * FROM Blocks limit 1'))[0]
		expect(() => assert(block, Block)).not.toThrow()
	})

	it('Channels table matches type', async () => {
		const channel = (await db.execO(`SELECT * FROM Blocks where type='channel' limit 1`))[0]
		expect(() => assert(channel, Channel)).not.toThrow()
	})

	it('Connections table matches type', async () => {
		const connection = (await db.execO('SELECT * FROM Connections limit 1'))[0]
		expect(() => assert(connection, Connection)).not.toThrow()
	})

	it('Providers table matches type', async () => {
		const provider = (await db.execO('SELECT * FROM Providers limit 1'))[0]
		expect(() => assert(provider, Provider)).not.toThrow()
	})
})
