import type { DB } from '@vlcn.io/crsqlite-wasm'
// import { getChannels, getBlocks } from '$lib/store/api/arenav2'
import { arenaChannels } from '$lib/dummy/channels'
import type { ArenaChannelContents, ArenaChannelWithDetails } from 'arena-ts'
import { nanoid } from 'nanoid/non-secure'
import { Block, Channel, Provider, type ChannelParsed, type User } from './schema'
import { create, Struct } from 'superstruct'

export async function bootstrap(db: DB) {
	// const arenaChannels = await getChannels()
	// const arenaBlocks = await getBlocks()
	await parseArenaChannels(db, arenaChannels)
	return true
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


const insertO = async <O extends object>(db: DB, rows: O[], table: string, schema: Struct) => {
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

			chanId = nanoid(10)
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

			blockId = nanoid(10)
			dedupe.blocks.set(blockRef, blockId)

			const userExRef = `arena:${bl.class === 'Channel' ? bl.owner_id : bl.user.id}`
			let userId = dedupe.user.get(userExRef)
			if (!userId) {
				userId = nanoid(10)
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
				connectedBy = nanoid(10)
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
		insertO(db, blocks, 'Blocks', Block),
		insertO(db, chans, 'Blocks', Channel)
	])

	/*
		get user's channels and blocks
		save to database
		create poll to check if there are new blocks
	*/
}


function parseBlock(block: ArenaChannelContents) { }
