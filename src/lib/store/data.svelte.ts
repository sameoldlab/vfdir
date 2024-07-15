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

import { db, Cr } from '$lib/store/tinyb.svelte'
import type { DB} from '@vlcn.io/crsqlite-wasm'

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
	#db: DB

	init(db: DB) {
		this.#db = db

		db.onUpdate((type, dbName, tblName, rowid) => {
		  console.log(`row ${rowid} in ${dbName}.${tblName} was ${type}`);
		  this.pull()
		});
	}

	async pull() {
		const query = await this.#db.execO<Channel>('SELECT slug,title,created_at,status,author_slug,flags FROM Channels')
		console.log(query)
		this.list=[...new Set([query, this.list].flat(1))]
		// if (this.list.find(i => i.slug === row[0]) !== undefined) return
		console.log(this.list)

		// await db.close()
	}

	async push(db: DB, channels: typeof this.list) {
		const stmt = await db.prepare(`INSERT INTO Channels (slug, title, created_at, status, author_slug, flags) VALUES (?, ?, ?, ?, ?, ?);`)
		// await db.tx(async (tx) => {
			channels.forEach(async v => {
				console.log(v)
				if (
					this.list.find(i => {
						console.log(i)
						return i?.slug === v.slug
					}) !== undefined
				) return
					await stmt.run(null, v.slug, v.title, v.created_at, v.status, v.author_slug, v.flags)
				})
		// })
		stmt.finalize(null)
		// this.pull(promiser)
		// promiser('close', { dbId })
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
