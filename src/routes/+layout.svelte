<script lang='ts'>
  import '../app.css'
  import Header from '$lib/components/header.svelte'
	import { initTables } from '$lib/store/sqlite.svelte'
	import { pool } from '$lib/store/connectionPool.svelte'
  import { untrack } from 'svelte'
	import { channels } from '$lib/store/data.svelte'
	import { bootstrap } from '$lib/store/sync.svelte'
	let { children } = $props();

	let ready = $state(false)
	let error = $derived(pool.status && pool.status !== 'available' ? pool.status : undefined)
	$effect.pre(() => console.log('status: ', pool.status))

	$effect(()=> {
		if(pool.status === 'available') {
			untrack(() => {
				pool.exec(async (db) => {
					await initTables(db)
					// channels.init(db)
					bootstrap(db)
				})
			})
		}
			// ready = true
	})

</script>

<Header />

{#if error}
	Error initializing database
	<pre><code>{error}</code></pre>
{:else if !ready }
	setting up sqlite
{:else}
	{@render children()}
{/if}
