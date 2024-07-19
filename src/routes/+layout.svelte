<script>
  import '../app.css'
  import Header from '$lib/components/header.svelte'
	import { db } from '$lib/store/sqlite.svelte'
	import { channels } from '$lib/store/data.svelte'
	let { children } = $props();

	let ready = $state(false)
	$effect(()=> {
		if(db.fulfilled) {
			channels.init(db.db)
			ready = true
		}
	})

</script>

<Header />

{#if !ready }
	setting up sqlite
{:else}
	{@render children()}
{/if}
