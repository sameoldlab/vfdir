import { type GetBlockApiResponse, type GetChannelsApiResponse, type GetUserChannelsApiResponse } from 'arena-ts'
// const client = new ArenaClient({
//   //   fetch: ("https://api.are.na/v2/",)
// });
// let Channels = [];
// client.channels().then((val)=>{
//     // Channels = val
//     console.log(val)
//   })

export async function getChannels(id: number | string): Promise<GetUserChannelsApiResponse> {
	let res = await fetch(`https://api.are.na/v2/users/${id}/channels?per=50`, {
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${import.meta.env.VITE_ARENA_KEY}`,
		},
		method: 'GET',
	})
	const data = await res.json()
	pool.exec(async (tx) => {
		await pullArena(tx, ...data.channels)
	})
	return data
}

export async function getBlocks(channel: string): Promise<GetBlockApiResponse> {
	console.log('get blocks: ', channel)
	const res = await fetch(
		`https://api.are.na/v2/channels/${channel}?per=100&sort=position&direction=asc`,
		{
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer',
			},
			method: 'GET',
		}
	)
	const data = await res.json()
	pool.exec(async (tx) => {
		await pullArena(tx, data)
	})
	return data
}
