import { getContext, setContext } from 'svelte'
import { type Writable, writable } from 'svelte/store'
import type { Promiser } from '@sqlite.org/sqlite-wasm'
import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm'

export async function createPromiser() {
	let promiser = await sqlite3Worker1Promiser.v2({
		debug(...args) {
			console.debug(args)
		},
	})
	return promiser
}

export const promiser = createPromiser()

export function setPromiser(promiser: Promise<Promiser>) {
	const value = writable(promiser)

	setContext('promiser', value)
}

export function getPromiser() {
	const promiser = getContext<Writable<Promiser>>('promiser')
	return promiser
}
