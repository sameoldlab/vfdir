import type { DB } from '@vlcn.io/crsqlite-wasm'
// import { getChannels, getBlocks } from '$lib/store/api/arenav2'
import { arenaChannels } from '$lib/dummy/channels'
import type { ArenaChannelContents } from 'arena-ts'
import { nanoid } from 'nanoid/non-secure'
import type { Block, Channel, ChannelParsed } from './schema'
import { coerce, create, number, string } from 'superstruct'

const parseDate = coerce(number(), string(), (value) => new Date(value).valueOf())

export async function bootstrap(db: DB) {
	// const arenaChannels = await getChannels()
	// const arenaBlocks = await getBlocks()

	let chans = arenaChannels.map((chan) => {
		const chanId = nanoid(10)
		// console.log(chan.slug)
		// Parse and insert Blocks
		let blocks = chan?.contents?.map((bl) => {
			const userId = `arena-${bl.class === 'Channel' ? bl.owner_id : bl.user.id}`
			const blockId = nanoid(10)
			const block: Block = {
				id: blockId,
				type: bl.class,
				created_at: create(bl.created_at, parseDate),
				updated_at: create(bl.updated_at, parseDate),
				title: bl.title ?? '',
				arena_id: bl.id,
				description: null,
				content: null,
				filename: null,
				source: null,
				provider_id: null,
				image: null,
				author_id: userId
			}

			block.description = bl.class !== 'Channel' ? bl.description : null

			switch (bl.class) {
				case 'Channel':
					{
						db.exec('insert or ignore into Users values (?,?,?,?,?)', [
							userId,
							bl.user.slug,
							bl.user.first_name,
							bl.user.last_name,
							bl.user.avatar
						])
						db.exec(`insert into Connections values (?,?,?,?,?,?,?);`, [
							blockId,
							chanId,
							1,
							bl.position,
							bl.selected ? 1 : 0,
							bl.connected_at,
							userId
						])
					}
					break;
				case 'Text':
					block.content = bl.content
					break
				case 'Attachment':
					block.filename = bl.attachment.content_type
				case 'Link':
				case 'Image':
				case 'Media':
					block.image = bl.image.original.url
					if (bl.source) {
						block.source = bl.source.url
						const provider = {
							...bl.source.provider,
							id: nanoid(8)
						}
						console.log(provider)
						db.exec(`insert into Providers values (?,?,?);`, [
							provider.id,
							provider.url,
							provider.name
						])
						block.provider_id = provider.id
					}
					break
			}
			return block
		})

		const flags: ChannelParsed['flags'] = [chan.kind]
		if (chan.collaboration) flags.push('collaboration')
		if (chan.published) flags.push('published')

		return {
			...chan,
			// updated_at: new P
			id: chanId,
			flags: JSON.stringify(flags),
			status: chan.status,
			created_at: create(chan.created_at, parseDate),
			updated_at: create(chan.updated_at, parseDate),
			author_id: chan.owner_slug,
			external_id: `arena:${chan.id}`

			// blocks: blocks?.map((v) => v.id),
		} satisfies Channel
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
}


function parseBlock(block: ArenaChannelContents) { }
