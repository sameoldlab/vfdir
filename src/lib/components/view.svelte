<script lang="ts">
	import { page } from '$app/stores'
	import GridView from './views/GridView.svelte'
	import MillerView from './views/MillerView.svelte'
	import { pool } from '$lib/database/connectionPool.svelte'
	import { VIEWS } from '$lib/stores'

	let { ...data } = $props()
	const view = pool.query<{ view: VIEWS }, VIEWS>(
		`select view from state where route=?`,
		[$page.url.href],
		(data) => (!data ? undefined : data[0]?.view || VIEWS[0])
	)
</script>

{#if view.data === 'table'}
	todo
{:else if view.data === 'canvas'}
	todo
{:else if view.data === 'miller'}
	<MillerView {...data} />
{:else}
	<GridView {...data} />
{/if}
