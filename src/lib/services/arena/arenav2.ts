import { type GetBlockApiResponse, type GetChannelsApiResponse, type GetUserChannelsApiResponse } from 'arena-ts'
import { pullArena } from './sync'
import { pool } from '$lib/database/connectionPool.svelte'
interface FetchError extends Error {
	status: number
	statusText: string
	url: string
}
export async function getChannels(id: number | string): Promise<GetUserChannelsApiResponse> {
	let res = await fetch(`https://api.are.na/v2/users/${id}/channels?per=50`, {
		headers: {
			'Content-Type': 'application/json',
		},
		method: 'GET',
	})
	try {
		if (!res.ok) {
			const error: FetchError = new Error(`HTTP Error ${res.status}`)
			error.status = res.status
			error.statusText = res.statusText
			error.url = res.url
			throw error
		}
		const data = await res.json()
		pool.exec(async (tx) => {
			await pullArena(tx, ...data.channels)
		})
		return data

	} catch (err) {
		if (err instanceof TypeError) {
			throw new Error('Type error: Fetch failed')
		}
	}
}

export async function getBlocks(channel: string): Promise<GetBlockApiResponse> {
	const res = await fetch(
		`https://api.are.na/v2/channels/${channel}?per=100&sort=position&direction=asc`,
		{
			headers: {
				'Content-Type': 'application/json',
			},
			method: 'GET',
		}
	)
	try {
		if (!res.ok) {
			const error: FetchError = new Error(`HTTP Error ${res.status}`)
			error.status = res.status
			error.statusText = res.statusText
			error.url = res.url
			throw error
		}
		const data = await res.json()
		console.debug(data)
		pool.exec(async (tx) => {
			await pullArena(tx, data)
		})
		return data

	} catch (err) {
		if (err instanceof TypeError) {
			throw new Error('Type error: Fetch failed')
		}
	}
}
