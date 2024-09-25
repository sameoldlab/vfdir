import { type GetBlockApiResponse, type GetChannelsApiResponse, type GetUserChannelsApiResponse } from 'arena-ts'
// const client = new ArenaClient({
// 	fetch: 'https://api.are.na/v2/',
// 	token: 'A86xyp6p1qm_ADrW40doxkitwLwDJ4T7HWmQSmZAhyc',
// })
// let Channels = client.channels()
// .then((val)=>{
//  Channels = val
// console.log(val)
// })

export async function getChannels(): Promise<GetUserChannelsApiResponse>{
	let res = await fetch('https://api.are.na/v2/users/408713/channels?per=50', {
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${import.meta.env.VITE_ARENA_KEY}`,
		},
		method: 'GET',
	})

	return res.json()
}

export async function getBlocks(channel: string): Promise<GetBlockApiResponse> {
	const res = await fetch(
		`https://api.are.na/v2/channels/${channel}?per=100&sort=position&direction=desc`,
		{
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer',
			},
			method: 'GET',
		}
	)
	return res.json()
}
