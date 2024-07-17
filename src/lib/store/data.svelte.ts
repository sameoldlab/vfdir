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

import type { DB } from '@vlcn.io/crsqlite-wasm'

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

	init(db: DB) {
		// load existing items from memory into store
		db.execO<Channel>(`SELECT * FROM Channels`).then(q => this.list = q)

		// callback to upload store on db change
		// type === 18 is an addition have not worked on deletions or updates yet
		db.onUpdate((type, _, tblName, rowid) => {
			if (tblName !== 'Channels') return
			console.log(`row ${rowid} in Blocks was ${type}`);
			this.pull(db, rowid)
		});
	}

	async pull(db: DB, row: bigint | undefined = undefined) {
		const query = await db.execO<Channel>(`SELECT * FROM Channels ${row === undefined ? '' : `WHERE rowId = ${row}`}`)
		// console.log('query', query)
		query.forEach(q => { if (this.list.findIndex(i => i.slug === q.slug) == -1) this.list.push(q) })
		// console.table(this.list)
		// await db.close()
	}

	async push(db: DB, channels: typeof this.list) {
		const stmt = await db.prepare(`INSERT INTO Channels (slug, title, created_at, status, author_slug, flags) VALUES (?, ?, ?, ?, ?, ?);`)
		await db.tx(async (tx) => {
			channels.forEach(async v => {
				if (this.list.findIndex(i => i.slug === v.slug) !== -1) return
				await stmt.run(tx, v.slug, v.title, v.created_at, v.status, v.author_slug, v.flags)
			})
		})
		stmt.finalize(null)
		// this.pull(promiser)
		// promiser('close', { dbId })
		// console.log(this.list)
	}
}

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
