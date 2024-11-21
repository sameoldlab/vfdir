import type { DB } from '@vlcn.io/crsqlite-wasm'
import { arenaChannels } from '$lib/dummy/channels'
import type { ArenaChannelWithDetails } from 'arena-ts'
import { Block, Connection, type User } from '$lib/database/schema'
import { arena_item_sync, arena_connection_import, arena_user_import, ev_stmt_close } from '$lib/database/events'

export async function bootstrap(db: DB) {
	// const arenaChannels = await getChannels()
	// const arenaBlocks = await getBlocks()
	// await parseArenaChannels(db, arenaChannels)
	// const logs = watchEvents()

	await pullArena(db, arenaChannels)
	ev_stmt_close(db)
}

const insertO = async <O extends object>(db: DB, rows: O[], table: string) => {
	if (!rows || rows.length === 0) return

	const keys = Object.keys(rows[0])
	const sql = `INSERT INTO ${table}(${keys.join(',')}) VALUES (${Array(keys.length).fill('?').join(',')});`
	const stmt = await db.prepare(sql)

	try {
		await db.tx(async (tx) => {
			await Promise.all(rows.map((value) =>
				stmt.run(tx, ...Object.values(value))
			))
		})
		await stmt.finalize(null)
	} catch (error) {
		console.error({ error, sent_bind: stmt.bindings, sql })
		throw error
	}
}

export async function pullArena(db: DB, channels: ArenaChannelWithDetails[]) {
	const dedupe = {
		blocks: new Map<Block['external_ref'], Block>(),
		users: new Set<number>(),
		conns: new Map<number, Set<number>>()
	}

	const promises: Promise<void>[] = []
	const add = (p: Promise<void>) => promises.push(p)
	await db.tx(async (db) => {
		(await db.execA<[Block['external_ref'], Block]>(`select * from Blocks`)).forEach((b) => {
			dedupe.blocks.set(b[0], b[1])
		});
		(await db.execA<User['external_ref'][]>(`select objectId from log where type = 'add:user'`))
			.forEach(u => {
				const id = u[0].split(':')[1]
				dedupe.users.add(Number(id))
			});
		(await db.execA<Connection['id'][]>(`select objectId from log where type = 'add:connection'`)).forEach(i => {
			const [p, c] = JSON.parse(i[0].split(':')[1])
			const set = dedupe.conns.get(p) ?? dedupe.conns.set(p, new Set()).get(p)
			set.add(c)
		})
	})

	for (const chan of channels) {
		let currentChan = dedupe.blocks.get(chan.id.toString())
		add(arena_item_sync(db, chan, currentChan))

		if (!chan.contents) continue
		for (const bl of chan.contents) {
			const blockRef = `arena:${bl.id}`
			const currentBlock = dedupe.blocks.get(blockRef)
			if (!currentBlock) {
				add(arena_item_sync(db, bl, currentBlock))
				dedupe.blocks.set(blockRef, currentBlock)
			}

			if (!dedupe.users.has(bl.user.id)) {
				add(arena_user_import(db, bl.user))
				dedupe.users.add(bl.user.id)
			}
			const connectedUserExRef = bl.connected_by_user_id
			if (!dedupe.users.has(connectedUserExRef)) {
				const [first_name, last_name] = bl.connected_by_username.split(' ')
				add(arena_user_import(db, {
					id: bl.connected_by_user_id,
					slug: bl.connected_by_user_slug,
					first_name,
					last_name,
				}))
				dedupe.users.add(connectedUserExRef)
			}
			const conn = dedupe.conns.get(chan.id)
			if (conn) {
				if (!conn.has(bl.id)) {
					add(arena_connection_import(db, chan, bl))
					conn.add(bl.id)
				}
			} else dedupe.conns.set(chan.id, new Set())
		}
	}
	await Promise.all(promises)
}
