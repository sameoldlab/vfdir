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

export async function parseArenaChannels(db: DB, channels: ArenaChannelWithDetails[]) {
	let chans = channels.map((chan) => {
		const chanId = nanoid(10)
		// Parse and insert Blocks
		let blocks = chan?.contents?.map(async (bl) => {

			let userId = await upsertUser(db, {
				slug: bl.user.slug,
				firstname: bl.user.first_name,
				lastname: bl.user.last_name,
				avatar: bl.user.avatar,
				external_ref: `arena:${bl.class === 'Channel' ? bl.owner_id : bl.user.id}`
			})

			const block = create({
				id: nanoid(10),
				type: bl.class,
				created_at: create(bl.created_at, parseDate),
				updated_at: create(bl.updated_at, parseDate),
				title: bl.title ?? '',
				external_ref: `arena:${bl.id}`,
				description: bl.class !== 'Channel' ? bl.description : null,
				content: null,
				filename: null,
				source: null,
				provider_id: null,
				image: null,
				author_id: userId
			}, Block)

			switch (bl.class) {
				case 'Channel':
					{
						db.exec(`insert into Connections(parent_id, child_id, is_channel, position, selected, connected_at, user_id) values (?,?,?,?,?,?,?);`, [
							chanId,
							block.id,
							1,
							bl.position,
							bl.selected ? 1 : 0,
							bl.connected_at,
							userId // TODO: not acurrate. someone else can create a blocak which I create a connetion for
						])
					}
					break;
				case 'Text':
					block.content = bl.content
					block.source = bl.source.url
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
			if (debug) {
				// console.log(block)
				// console.log(bl)
			}
			// if (bl.source.url !== bl.source.provider.url)
			// console.log({ name: bl.name, type: bl.class, source: bl.source })
			return block
		})

		const flags: ChannelParsed['flags'] = [chan.kind]
		if (chan.collaboration) flags.push('collaboration')
		if (chan.published) flags.push('published')

		return create({
			...chan,
			// updated_at: new P
			id: chanId,
			flags: JSON.stringify(flags),
			status: chan.status,
			created_at: create(chan.created_at, parseDate),
			updated_at: create(chan.updated_at, parseDate),
			author_id: chan.owner_slug,
			external_ref: `arena:${chan.id}`
		}, Channel)
	}

		// console.log(chans);
		// channels.push(db, chans)
		// channels.push(db,
		// arenaChannels.channels.map(chan =>
		// 	chan.contents.map(block => [block.id, {...block}]
		// ))
		// )
		// Create tables

		/*
			get user's channels and blocks
			save to database

			create poll to check if there are new blocks
		*/
		// await db.exec(`INSERT INTO Channels() VALUES()`)
	)
	return true
}


function parseBlock(block: ArenaChannelContents) { }
