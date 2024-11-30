<script lang="ts">
	import { page } from '$app/stores'
	import GridView from './views/GridView.svelte'
	import MillerView from './views/MillerView.svelte'
	import { pool } from '$lib/database/connectionPool.svelte'
	import { VIEWS } from '$lib/stores.svelte'
	import type { Block, Channel } from '$lib/pools/block.svelte'
	import { pageview } from '$lib/utils/pageView.svelte'

	let { data }: { data: (Block | Channel)[] } = $props()
</script>

{#if pageview.v === 'table'}
	todo
{:else if pageview.v === 'canvas'}
	todo
{:else if pageview.v === 'miller'}
	<MillerView {data} />
{:else}
	<GridView {...data} />
{/if}
