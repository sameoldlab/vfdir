// import { ArenaClient } from "arena-ts";
// const client = new ArenaClient({
//   //   fetch: ("https://api.are.na/v2/",)
//   token: "A86xyp6p1qm_ADrW40doxkitwLwDJ4T7HWmQSmZAhyc",
// });
// let Channels = [];
// client.channels().then((val)=>{
//     // Channels = val
//     console.log(val)
//   })

import type { Promiser } from '@sqlite.org/sqlite-wasm'
import { filename } from './initSqlite.svelte'
type ChannelStatus = "local" | "closed" | "public" | "open"
export type Channel = {
	slug: string
	title: string
	created_at: string
	status: ChannelStatus
	author_slug: string
	flags: string[]
}
class Channels {
	list = $state<Channel[]>([])

	async pull(promiser: Promiser, dbId: string | undefined) {
		dbId = dbId ?? (await promiser('open', { filename })).dbId
		console.log(`updating with ${dbId}`)

		await promiser('exec', {
			dbId,
			sql: 'SELECT slug,title,created_at,status,author_slug,flags FROM Channels LIMIT 50',
			callback: result => {
				if (!result.row) return
				const { row } = result
				if (this.list.find(i => i.slug === row[0]) !== undefined) return
				const item = {
					slug: row[0],
					title: row[1],
					created_at: row[2],
					status: row[3],
					author_slug: row[4],
					flags: row[5]
				}
				console.log(item)
				console.log('pulled item from db')

				this.list.push(item)
				console.log('saved item from to this.list')
				console.log(this.list)
			},
		})
		await promiser('close', { dbId })
		console.log(this.list)
	}

	async push(promiser: Promiser, channels: typeof this.list) {
		console.log('promiser is ', promiser)
		
		const { dbId } = await promiser('open', { filename })
		console.log(`opening ${dbId} for push`)

		channels.forEach(v => {
			console.log(v)
			if (
				this.list.find(i => {
					console.log(i)
					return i?.slug === v.slug
				}) !== undefined
			)
				return
			console.log('item added to db')
			promiser('exec', {
				dbId,
				sql: /* sql */ `
					INSERT INTO Channels(slug,title,created_at,status,author_id,flags) VALUES(?,?,?,?,?,?);
				`,
				bind: [v.slug, v.title, v.created_at, v.status, v.author_slug, v.flags],
			})
		})

		this.pull(promiser, dbId)
		promiser('close', { dbId })
		// console.log(this.list)
	}
}

export const channels = new Channels()

function populateChannels() {
	/* 
		1. fetch 
		2. save channels 
		3. save any users found 
		4. save any blocks found 
	
	*/
}
function getBlocks() {
	
}
