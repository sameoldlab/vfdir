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

export function getChannels(promiser: Promiser) {
	let list = $state<
		{
			slug: string
			title: string
			created_at: string
			status: string
		}[]
	>([])
	const update = async () => {
		const { dbId } = await promiser('open', { filename })
		console.log(`opening ${dbId} for update`)

		await promiser('exec', {
			dbId,
			sql: 'SELECT slug,title,created_at,status FROM Channels LIMIT 50',
			callback: result => {
				if (!result.row) return
				const { row } = result
				if (list.find(i => i.slug === row[0]) !== undefined) return
				const item = {
					slug: row[0],
					title: row[1],
					created_at: row[2],
					status: row[3],
				}
				console.log(item)
				console.log('pulled item from db')

				list.push(item)
				console.log('saved item from to list')
				console.log(list)
			},
		})
		await promiser('close', { dbId })
		console.log(list)
	}
	update()

	/** Checks for duplicates then adds each element to database*/
	const push = async (vals: typeof list) => {
		const { dbId } = await promiser('open', { filename })
		console.log(`opening ${dbId} for push`)

		vals.forEach(v => {
			console.log(
				'wtfwtfwtfwtfwtfwtfwtfwtfwtfwtfwtfwtfwtfwtfwtfwtfwtfwtfwtfwtf'
			)
			console.log(v)

			if (
				list.find(i => {
					console.log(i)
					return i?.slug === v.slug
				}) !== undefined
			)
				return
			console.log('item added to db')
			promiser('exec', {
				dbId,
				sql: /* sql */ `
				INSERT INTO Channels(title,slug,created_at,status) VALUES (?,?,?,?)`,
				bind: [v.title, v.slug, v.created_at, v.status],
			})
		})
		promiser('close', { dbId })
		console.log(list)
		await update()
	}

	return {
		get list() {
			return list
		},
		update,
		push,
	}
}