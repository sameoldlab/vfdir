<script lang="ts">
	import '../app.css'
	import Header from '$lib/components/header.svelte'
	import { createTables } from '$lib/database/createTables'
	import { pool } from '$lib/database/connectionPool.svelte'
	import { untrack } from 'svelte'
	// import { channels } from '$lib/store/data.svelte'
	import { bootstrap } from '$lib/services/sync.svelte'
	import type { User } from '$lib/database/schema'
	let { children } = $props()

	let ready = $state(false)
	pool.exec(async (db) => {
		await createTables(db)
		await bootstrap(db)
		ready = true
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
