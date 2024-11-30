import type { DB } from '@vlcn.io/crsqlite-wasm'
import type { ArenaChannelWithDetails } from 'arena-ts'
import { arena_entry_sync, arena_connection_import, arena_user_import, ev_stmt_close } from '$lib/database/events'
import type { TXAsync } from '@vlcn.io/xplat-api'
import { blocks, users, channels } from '$lib/pools/block.svelte'

export async function pullArena(db: DB | TXAsync, ...aChannels: ArenaChannelWithDetails[]) {
	const dedupe = {
		entries: new Map(blocks),
		users: new Set<string>(users.keys()),
		conns: channels.entries().reduce((acc, [k, v]) => {
			if (!acc.has(k)) acc.set(k, new Set())
			v.blocks.forEach(b => { acc.get(k).add(b.key) })
			return acc
		}, new Map<string, Set<string>>())
	}


	const promises: Promise<void>[] = []
	const add = (p: Promise<void>) => promises.push(p)

	for (const chan of aChannels) {
		let currentChan = dedupe.entries.get(chan.slug)
		if (!currentChan) dedupe.entries.set(chan.slug, chan)
		add(arena_entry_sync(db, chan, currentChan))

		if (!chan.contents) continue
		for (const bl of chan.contents) {
			const key = bl.base_class === 'Channel' ? bl.slug : bl.id.toString()
			const currentBlock = dedupe.entries.get(key)
			if (!currentBlock) dedupe.entries.set(key, bl)
			add(arena_entry_sync(db, bl, currentBlock))

			if (!dedupe.users.has(bl.user.slug)) {
				add(arena_user_import(db, bl.user))
				dedupe.users.add(bl.user.slug)
			}
			if (!dedupe.users.has(bl.connected_by_user_slug)) {
				const [first_name, last_name] = bl.connected_by_username.split(' ')
				add(arena_user_import(db, {
					id: bl.connected_by_user_id,
					slug: bl.connected_by_user_slug,
					first_name,
					last_name,
				}))
				dedupe.users.add(bl.connected_by_user_slug)
			}

			const conn = dedupe.conns.get(chan.slug)
			if (conn) {
				if (conn.has(key)) continue
				add(arena_connection_import(db, chan, bl))
				conn.add(key)
			} else {
				add(arena_connection_import(db, chan, bl))
				dedupe.conns.set(key, new Set())
			}
		}
	}
	await Promise.all(promises).then(() => {
		ev_stmt_close(db)
	})
}
