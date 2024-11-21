import type { DB } from '@vlcn.io/crsqlite-wasm'
import { arenaChannels } from '$lib/dummy/channels'
import type { ArenaChannelContents, ArenaChannelWithDetails } from 'arena-ts'
import { ulid } from 'ulidx'
import { Block, Channel, Connection, type ChannelParsed, type User } from '$lib/database/schema'
import { create } from 'superstruct'
import { arena_item_sync, arena_connection_import, arena_user_import, watchEvents, ev_stmt_close } from '$lib/database/events'

export async function bootstrap(db: DB) {
	// const arenaChannels = await getChannels()
	// const arenaBlocks = await getBlocks()
	// await parseArenaChannels(db, arenaChannels)
	// const logs = watchEvents()

	await pullArena(db, arenaChannels)
	ev_stmt_close(db)
}

const insertUser = (db: DB, user: User) =>
	db.exec('insert into Users values (?,?,?,?,?,?);', [
		user.id,
		user.slug,
		user.firstname,
		user.lastname,
		user.avatar,
		user.external_ref,
	])

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
		users: new Set<User['external_ref']>(),
		conns: new Map<Connection['parent_id'], Set<Connection['child_id']>>()
	}

	const promises: Promise<void>[] = []
	const add = (p: Promise<void>) => promises.push(p)
	await db.tx(async (db) => {
		(await db.execA<[Block['external_ref'], Block]>(`select * from Blocks`)).forEach((b) => {
			dedupe.blocks.set(b[0], b[1])
		});
		(await db.execA<User['external_ref'][]>(`select external_ref from Users`)).forEach(u => {
			dedupe.users.add(u[0])
		});
		(await db.execA<Connection['id'][]>(`select objectId from log where type = 'add:connection'`)).forEach(i => {
			const [p, c] = JSON.parse(i[0].split(':')[1])
			const set = dedupe.conns.get(p) ?? dedupe.conns.set(p, new Set()).get(p)
			set.add(c)
		})
	})

	for (const chan of channels) {
		let currentChan = dedupe.blocks.get(`arena:${chan.id}`)
		add(arena_item_sync(db, chan, currentChan))

		if (!chan.contents) continue
		for (const bl of chan.contents) {
			const blockRef = `arena:${bl.id}`
			const currentBlock = dedupe.blocks.get(blockRef)
			if (!currentBlock) {
				add(arena_item_sync(db, bl, currentBlock))
				dedupe.blocks.set(blockRef, currentBlock)
			}

			const userExRef = `arena:${bl.class === 'Channel' ? bl.owner_id : bl.user.id}`
			if (!dedupe.users.has(userExRef)) {
				add(arena_user_import(db, bl.user))
				dedupe.users.add(userExRef)
			}
			const connectedUserExRef = `arena:${bl.connected_by_user_id}`
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
			const conn = dedupe.conns.get(`${chan.id}`)
			if (conn) {
				if (!conn.has(`${bl.id}`)) {
					add(arena_connection_import(db, chan, bl))
					conn.add(`${bl.id}`)
				}
			} else dedupe.conns.set(`${chan.id}`, new Set())
		}
	}
	await Promise.all(promises)
}

export async function parseArenaChannels(db: DB, channels: ArenaChannelWithDetails[]) {
	let blockRefs: [Block['external_ref'], Block['id']][] = []
	let userRefs: [User['external_ref'], User['id']][] = []

	await db.tx(async (db) => {
		blockRefs.push(...(await db.execA<[Block['external_ref'], Block['id']]>(`select external_ref,id from Blocks`)))
		userRefs.push(...(await db.execA<[User['external_ref'], User['id']]>(`select external_ref,id from Users`)))
	})
	const dedupe = {
		blocks: new Map<Block['external_ref'], Block['id']>(blockRefs),
		user: new Map<User['external_ref'], User['id']>(userRefs),
	}
	const blocks = []
	const chans = []

	channels.map((chan) => {
		const external_ref = `arena:${chan.id}`
		let chanId = dedupe.blocks.get(external_ref)
		// console.log(chanId)

		// add channel if it is not already in database
		if (!chanId) {
			const flags: ChannelParsed['flags'] = [chan.kind]
			if (chan.collaboration) flags.push('collaboration')
			if (chan.published) flags.push('published')

			chanId = ulid()
			dedupe.blocks.set(external_ref, chanId)

			chans.push(create({
				id: chanId,
				type: 'channel',
				title: chan.title,
				slug: chan.slug,
				created_at: chan.created_at,
				updated_at: chan.updated_at,
				flags: flags,
				status: chan.status,
				source: 'arena',
				author_id: chan.owner_slug,
				external_ref
			}, Channel))
		}

		// Parse and insert Blocks
		chan.contents && chan.contents.map((bl) => {
			const blockRef = `arena:${bl.id}`
			let blockId = dedupe.blocks.get(blockRef)
			// if block is already in db, insert connections and return
			if (blockId) {

				return
			}

			blockId = ulid()
			dedupe.blocks.set(blockRef, blockId)

			const userExRef = `arena:${bl.class === 'Channel' ? bl.owner_id : bl.user.id}`
			let userId = dedupe.user.get(userExRef)
			if (!userId) {
				userId = ulid()
				insertUser(db, {
					id: userId,
					slug: bl.user.slug,
					firstname: bl.user.first_name,
					lastname: bl.user.last_name,
					avatar: bl.user.avatar,
					external_ref: userExRef
				})
				dedupe.user.set(userExRef, userId)
			}

			const connectedUserExRef = `arena:${bl.connected_by_user_id}`
			let connectedBy = dedupe.user.get(connectedUserExRef)
			if (!connectedBy) {
				connectedBy = ulid()
				insertUser(db, {
					id: connectedBy,
					slug: bl.connected_by_user_slug,
					firstname: null,
					lastname: null,
					avatar: null,
					external_ref: connectedUserExRef
				})
				dedupe.user.set(connectedUserExRef, connectedBy)
			}

			db.exec(`insert into Connections(id,parent_id, child_id, is_channel, position, selected, connected_at, user_id) values (?,?,?,?,?,?,?,?);`, [
				chanId + '+' + blockId,
				chanId,
				blockId,
				bl.class === 'Channel' ? 1 : 0,
				bl.position,
				bl.selected ? 1 : 0,
				bl.connected_at,
				connectedBy
			])

			if (bl.class === 'Channel') {
				const flags: ChannelParsed['flags'] = [bl.kind]
				if (bl.collaboration) flags.push('collaboration')
				if (bl.published) flags.push('published')
				chans.push(create({
					id: blockId,
					type: bl.class.toLowerCase(),
					title: bl.title,
					slug: bl.slug,
					created_at: bl.created_at,
					updated_at: bl.updated_at,
					flags,
					status: bl.status,
					source: 'arena',
					author_id: userId,
					external_ref: blockRef,
				}, Channel))

			} else {
				const block = {
					id: blockId,
					type: bl.class.toLowerCase(),
					title: bl.title ?? '',
					description: bl.description ?? '',
					created_at: bl.created_at,
					updated_at: bl.updated_at,
					content: null,
					filename: null,
					provider_url: null,
					image: null,
					source: null,
					author_id: userId,
					external_ref: `arena:${bl.id}`,
				}

				switch (bl.class) {
					case 'Text':
						block.content = bl.content
						block.source = bl.source ? bl.source?.url : block.source
						break
					case 'Attachment':
						block.filename = bl.attachment.content_type
					case 'Link':
					case 'Image':
					case 'Media':
						block.image = bl.image.original.url
						if (bl.source) {
							db.exec(`insert or ignore into Providers values (?,?);`, [
								bl.source.provider.url,
								bl.source.provider.name
							])
							block.source = bl.source.url
							block.provider_url = bl.source.provider.url
						}
						break
				}
				blocks.push(create(block, Block))
			}
		})
	})
	// console.log(chans)
	// console.log(blocks)

	await Promise.all([
		insertO(db, blocks, 'Blocks'),
		insertO(db, chans, 'Blocks')
	])

	/*
		get user's channels and blocks
		save to database
		create poll to check if there are new blocks
	*/
}


function parseBlock(block: ArenaChannelContents) { }
