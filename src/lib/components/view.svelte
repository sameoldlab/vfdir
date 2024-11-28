<script lang="ts">
	import { page } from '$app/stores'
	import GridView from './views/GridView.svelte'
	import MillerView from './views/MillerView.svelte'
	import { pool } from '$lib/database/connectionPool.svelte'
	import { VIEWS } from '$lib/stores.svelte'
	import type { Block, Channel } from '$lib/pools/block.svelte'

	let { data }: { data: (Block | Channel)[] } = $props()
	const view = pool.query<{ pageview: VIEWS }, VIEWS>(
		`select pageview from state where route = ?`,
		[$page.url.pathname],
		(data) => (!data ? undefined : data[0]?.pageview || VIEWS[0])
	)
</script>

{#if view.data === 'table'}
	todo
{:else if view.data === 'canvas'}
	todo
{:else if view.data === 'miller'}
	<MillerView {data} />
{:else}
	<GridView {...data} />
{/if}
