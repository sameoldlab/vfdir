import type { DB } from '@vlcn.io/crsqlite-wasm'
import { SvelteMap } from 'svelte/reactivity'

async function pull<V extends object, K extends keyof V, >({ db, row, list, key, table }:
	{ db: DB, row: bigint | undefined, list: Map<V[K], V>, key: K, table: string }) {
	const query = await db.execO<V>(`SELECT * FROM ${table}${row === undefined ? '' : ` WHERE rowId = ${row}`};`)
	query.forEach(q => {if (!list.has(q[key])) list.set(q[key], q)})
}

const keys = Object.freeze({
	'Channels': 'slug',
	'Blocks': 'id'
})

type ChannelStatus = "private" | "closed" | "public"
type ChannelFlags =  'published' | 'collaboration' | 'default' | 'profile'

export type Channel = {
	slug: string
	title: string
	updated: Date
	created_at: Date
	status: ChannelStatus
	author_slug: string
	flags: ChannelFlags[]
	blocks: Block[]
}

class Channels {
	#list = $state<Map<Channel['slug'], Channel>>(new SvelteMap())

	get list() {
		return this.#list
	}

	init(db: DB) {
		// load existing items from memory into store
		db.execO<Channel>(`SELECT * FROM Channels`).then(q => {
			this.#list = q.reduce((acc, curr) => acc.set(curr.slug, curr), this.#list)
		})

		// callback to upload store on db change
		// type === 18 is an addition have not worked on deletions or updates yet
		db.onUpdate((type, _, table, row) => {
			if (table !== 'Channels') return
			console.log(`row ${row} in ${table} was ${type}`);
			pull({db, row, list: this.#list, key: keys.Channels, table})
			// this.pull(db, row)
		});
	}

	async push(db: DB, channels: Channel[]) {
		const stmt = await db.prepare(`INSERT INTO Channels (slug, title, created_at, status, author_slug, flags) VALUES (?, ?, ?, ?, ?, ?);`)
		await db.tx(async (tx) => {
			channels.forEach(async v => {
				if (this.#list.has(v[keys.Channels])) return
				await stmt.run(tx, v.slug, v.title, v.created_at, v.status, v.author_slug, v.flags)
			})
		})

		stmt.finalize(null)
		// this.pull(promiser)
		// promiser('close', { dbId })
		// console.log(this.#list)
	}
}

export const channels = new Channels()

export type Block = {
	"id": number,
	"title": string,
	"filename"?: string,
	"description": string,
	"type": string,
	"content"?: string,
	"image"?: string,
	"created_at": string,
	"updated_at": string,
	"source": string,
	"author_id": string,
	"arena_id": number
}
class Blocks {
	#list = $state<Map<Block['id'], Block>>(new SvelteMap())
	get list() {return this.#list}

	init(db: DB) {
		db.execO<Block>(`SELECT * FROM Blocks`).then(q => {
			this.#list = q.reduce((acc, curr) => acc.set(curr.id, curr), this.#list)
		})

		db.onUpdate((type, _, table, row) => {
			if (table !== 'Blocks') return
			console.log(`row ${row} in ${table} was ${type}`);
			pull({db, row, list: this.#list, key: keys.Blocks, table})
		})
	}

	async push(db: DB, blocks: Exclude<Block, 'id'>[]) {
		const stmt = await db.prepare(`INSERT INTO Blocks (title,filename,description,type,content,image,created_at,updated_at,source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`)

		await db.tx(async (tx) => {
			blocks.forEach(async v => {
				if (this.#list.has(v[keys.Blocks])) return
				await stmt.run(tx, v.title, v.filename, v.description, v.type, v.content, v.image, v.created_at, v.updated_at, v.source)
			})
		})
		stmt.finalize(null)
		// console.log(this.list)
	}
}

export const blocks = new Blocks()

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


