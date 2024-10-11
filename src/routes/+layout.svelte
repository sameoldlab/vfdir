<script lang="ts">
	import '../app.css'
	import Header from '$lib/components/header.svelte'
	import { createTables } from '$lib/database/createTables'
	import { pool } from '$lib/database/connectionPool.svelte'
	import { bootstrap } from '$lib/services/sync.svelte'
	import { onMount } from 'svelte'
	let { children } = $props()

	let ready = $state(false)
	onMount(() => {
		pool.exec(async (db) => {
			await createTables(db)
			await bootstrap(db)
			ready = true
		})
	})
</script>

<Header />

{#if pool.status === 'error'}
	<pre><code>{pool.error}</code></pre>
{:else if pool.status === 'loading' || !ready}
	setting up sqlite
{:else}
	{@render children()}
{/if}
