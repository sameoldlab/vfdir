<script lang="ts">
	import GridView from '$lib/components/views/GridView.svelte'
	import { pool } from '$lib/database/connectionPool.svelte'

	const types = pool.query(
		`select * from blocks b where b.id in (
			select min(id) from blocks
			group by type
			);`,
		undefined
	)
	let selected = $state({})
	const select = (e) => {
		selected = e
	}
</script>

<!-- prettier-ignore -->
<div class="item">
	{#each types.data as { ...item }}
		| <button onclick={() => select(item)}>{item.type}</button> &nbsp;
	{/each}|
<pre><code>{#each Object.entries(selected) as [k, v]}{#if v}{k}: {v}<br/>{/if}{/each}</code></pre>
</div>

<GridView {...types.data} />

<style>
	button {
		background: none;
		padding: 0;
	}
	pre {
		height: 12rem;
		overflow: auto;
		margin: 0.25rem;
	}
	code {
		text-wrap: wrap;
		line-break: strict;
	}
</style>
