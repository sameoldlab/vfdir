import type { DB } from "@vlcn.io/crsqlite-wasm"
// import { getChannels, getBlocks } from '$lib/store/api/arenav2'
import { blocks, channels, type Channel, type Block } from '$lib/store/data.svelte'
import { arenaChannels } from '$lib/dummy/channels'
import { nanoid } from 'nanoid/non-secure'

export async function bootstrap(db: DB) {
}
