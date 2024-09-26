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
	let error = $derived(pool.status && pool.status !== 'available' ? pool.status : undefined)
	$effect.pre(() => console.log('status: ', pool.status))

	$effect(()=> {
		if(pool.status === 'available') {
			untrack(() => {
				pool.exec(async (db) => {
					await createTables(db)
					// channels.init(db)
					bootstrap(db)
				})
			})
		}
			// ready = true
	pool.exec(async (db) => {
		await createTables(db)
		await bootstrap(db)
	})
	// ready = true
</script>

<Header />

{#if pool.status === 'error'}
	{pool.error}
	<pre><code>{error}</code></pre>
{:else if pool.status === 'loading' || !ready}
	setting up sqlite
{:else}
	{@render children()}
{/if}
