import type { DB } from '@vlcn.io/crsqlite-wasm'
import initWasm from '@vlcn.io/crsqlite-wasm'
import wasmUrl from '@vlcn.io/crsqlite-wasm/crsqlite.wasm?url'
import { assert } from 'superstruct'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTables } from './createTables'
import { Block, Channel, Connection, Provider, User } from './schema'
import { bootstrap, parseArenaChannels } from './sync.svelte'
import { arenaChannels } from '$lib/dummy/channels'

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

describe('Bootstrap database', async () => {
	const sqlite = await initWasm(() => wasmUrl)
	const db = await sqlite.open(':memory:')
	await createTables(db)

	it('runs bootstrap without error', async () => {
		const res = await bootstrap(db)
		expect(res).toBeTruthy()
	})

	it('does not duplicate inserts', async () => {
		await parseArenaChannels(db, arenaChannels)
		const res = await parseArenaChannels(db, arenaChannels)
		expect(res).toBeTruthy()
	})

	afterAll(async () => {
		// await db.close()
	})
})

describe('Validate types', async () => {
	const sqlite = await initWasm(() => wasmUrl)
	const db = await sqlite.open(':memory:')
	await createTables(db)
	await bootstrap(db)

	afterAll(async () => {
		await db.close()
	})
	// reinserting the same data does not duplicate rows
	// adds in all blocks and connections
	// can find a providers based on the block
	// lists all blocks for a channel
	// lists all channels for a block

	it('Users table matches type', async () => {
		const user = (await db.execO('SELECT * FROM Users  limit 1'))[0]
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
