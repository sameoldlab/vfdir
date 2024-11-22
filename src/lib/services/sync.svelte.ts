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
}



export async function pullArena(db: DB, channels: ArenaChannelWithDetails[]) {
	const dedupe = {
		blocks: new Map<number, Block>(),
		users: new Set<number>(),
		conns: new Map<number, Set<number>>()
	}

	const promises: Promise<void>[] = []
	const add = (p: Promise<void>) => promises.push(p)
	await db.tx(async (db) => {
		(await db.execO<Block>(`select * from Blocks`)).forEach((b) => {
			dedupe.blocks.set(Number(b.id.split(':')[1]), b)
		});
		(await db.execA<User['id'][]>(`select id from Users`))
			.forEach(u => {
				dedupe.users.add(Number(u[0].split(':')[1]))
			});
		(await db.execA<Connection['id'][]>(`select id from Connections`)).forEach(i => {
			const [_p, c] = i[0].split(':')
			let p = Number(_p)
			const set = dedupe.conns.get(p) ?? dedupe.conns.set(p, new Set()).get(p)
			set.add(Number(c))
		})
	})

	for (const chan of channels) {
		let currentChan = dedupe.blocks.get(chan.id)
		if (!currentChan) dedupe.blocks.set(chan.id, chan)
		add(arena_item_sync(db, chan, currentChan))

		if (!chan.contents) continue
		for (const bl of chan.contents) {
			const currentBlock = dedupe.blocks.get(bl.id)
			if (!currentBlock) dedupe.blocks.set(bl.id, bl)
			add(arena_item_sync(db, bl, currentBlock))

			if (!dedupe.users.has(bl.user.id)) {
				add(arena_user_import(db, bl.user))
				dedupe.users.add(bl.user.id)
			}
			if (!dedupe.users.has(bl.connected_by_user_id)) {
				const [first_name, last_name] = bl.connected_by_username.split(' ')
				add(arena_user_import(db, {
					id: bl.connected_by_user_id,
					slug: bl.connected_by_user_slug,
					first_name,
					last_name,
				}))
				dedupe.users.add(bl.connected_by_user_id)
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
	await Promise.all(promises).then(() => {
		ev_stmt_close(db)
	})
}
