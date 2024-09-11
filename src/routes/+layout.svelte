<script>
  import '../app.css'
  import Header from '$lib/components/header.svelte'
	import { db } from '$lib/store/sqlite.svelte'
	import { channels } from '$lib/store/data.svelte'
	import { bootstrap } from '$lib/store/sync.svelte'
	let { children } = $props();

	let ready = $state(false)
	$effect(()=> {
		if(db.fulfilled) {
			channels.init(db.db)
			ready = true
			bootstrap(db.db)
		}
	})

</script>

<Header />

{#if !ready }
	setting up sqlite
{:else}
	{@render children()}
{/if}
