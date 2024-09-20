import type { DB } from '@vlcn.io/crsqlite-wasm'
// import { getChannels, getBlocks } from '$lib/store/api/arenav2'
import { arenaChannels } from '$lib/dummy/channels'
import type { ArenaChannelContents, ArenaChannelWithDetails } from 'arena-ts'
import { nanoid } from 'nanoid/non-secure'
import { Block, Channel, type ChannelParsed, Provider, type User } from './schema'
import { coerce, create, number, string } from 'superstruct'

const parseDate = coerce(number(), string(), (value) => new Date(value).valueOf())

export async function bootstrap(db: DB) {
	// const arenaChannels = await getChannels()
	// const arenaBlocks = await getBlocks()
	await parseArenaChannels(db, arenaChannels)
	return true
}

const cachedFn = <T>(fn: (cache: Map<string, string>) => T) => {
	const cache = new Map<string, string>()
	return fn(cache)
}

const upsertUser = cachedFn((cache) => async (db: DB, user: Omit<User, 'id'>) => {
	const cached = cache.get(user.slug)
	if (cached) return cached

	const id = (await db.execA<User['id'][]>('insert or ignore into Users values (?,?,?,?,?,?) returning id;', [
		nanoid(10),
		user.slug,
		user.firstname,
		user.lastname,
		user.avatar,
		user.external_ref,
	]))[0]

	if (id === undefined)
		return db.execA<User['id'][]>(`select id from Users where slug='${user.slug}'`)
			.then((id) => id[0][0])
	cache.set(user.slug, id[0])
	return id[0]
})

const upsertProvider = cachedFn((cache) => async (db: DB, provider: Omit<Provider, 'id'>) => {
	const cached = cache.get(provider.url)
	if (cached) return cached
	const id = (await db.execA<Provider['id'][]>(`insert or ignore into Providers values (?,?,?) returning id;`, [
		nanoid(10),
		provider.url,
		provider.name
	]))[0]
	if (id === undefined)
		return db.execA(`select (id) from Providers where url='${provider.url}'`)
			.then((id) => id[0][0])
	cache.set(provider.url, id[0])
	return id[0]
})

const insertO = async <O extends object>(db: DB, rows: O[], table: string) => {
	const keys = Object.keys(rows[0])
	console.log(rows.length)
	const sql = `
		INSERT INTO ${table}(${keys.join(',')})
		VALUES (${Array(keys.length).fill('?').join(', ')});`

	return db.prepare(sql).then(stmt =>
		Promise.all(rows.map(async (value) => {
			stmt.bind(Object.values(value))
			await stmt.run(db)
			// stmt.run(db, Object.values(value))
		}))
			.finally(() =>
				stmt.finalize(db)
			)
	)
}

export async function parseArenaChannels(db: DB, channels: ArenaChannelWithDetails[]) {
	// const blockIds = await db.execO(`select id,external_ref from blocks`)
	// console.log(blockIds)
	const dedupe = {
		blocks: new Map<string, string>(),
		provider: new Map<string, string>(),
		user: new Map<string, string>(),
	}
	const blocks = []
	const chans = []

	await Promise.all(channels.map(async (chan) => {
		const external_ref = `arena:${chan.id}`
		let chanId = dedupe.blocks.get(external_ref)

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
		chan.contents && await Promise.all(
			chan.contents.map(async (bl) => {
				const blockRef = `arena:${bl.id}`
				let blockId = dedupe.blocks.get(blockRef)
				// if block is already in db, insert connections and return
				if (blockId) {

					return
				}

				blockId = nanoid(10)
				dedupe.blocks.set(blockRef, blockId)

				const userId = await upsertUser(db, {
					slug: bl.user.slug,
					firstname: bl.user.first_name,
					lastname: bl.user.last_name,
					avatar: bl.user.avatar,
					external_ref: `arena:${bl.class === 'Channel' ? bl.owner_id : bl.user.id}`
				})

				const connectedBy = await upsertUser(db, {
					slug: bl.connected_by_user_slug,
					firstname: null,
					lastname: null,
					avatar: null,
					external_ref: `arena:${bl.connected_by_user_id}`
				})
				db.exec(`insert into Connections(parent_id, child_id, is_channel, position, selected, connected_at, user_id) values (?,?,?,?,?,?,?);`, [
					chanId,
					blockId,
					bl.class === 'Channel' ? 1 : 0,
					bl.position,
					bl.selected ? 1 : 0,
					bl.connected_at,
					userId
				])

				if (bl.class === 'Channel') {
					const flags: ChannelParsed['flags'] = [bl.kind]
					if (bl.collaboration) flags.push('collaboration')
					if (bl.published) flags.push('published')
					chans.push(create({
						id: blockId,
						type: bl.class.toLowerCase(),
						title: bl.title,
						created_at: bl.created_at,
						updated_at: bl.updated_at,
						source: 'arena',
						flags,
						author_id: userId,
						external_ref: blockRef,
						slug: bl.slug
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
						provider_id: null,
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
								block.source = bl.source.url
								block.provider_id = await upsertProvider(db, bl.source.provider)
							}
							break
					}
					blocks.push(create(block, Block))
				}
			}))
	}))
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
