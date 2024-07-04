<script>
  import '../app.css'
  import Header from '$lib/components/header.svelte'
	import { db } from '$lib/store/initSqlite.svelte'
	// import { bootstrap } from '$lib/store/data.svelte'
	let { children } = $props();
</script>

<Header />

{#if db.fulfilled === false }
	setting up sqlite
{:else}
	{@render children()}
{/if}
