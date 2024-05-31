<script>
  import '../app.css'
  import Header from '$lib/components/header.svelte'
	import { db } from '$lib/store/initSqlite.svelte'
	let { children } = $props();
	
</script>

<Header />

{#if !db.fulfilled }
	setting up sqlite
{:else}
	{@render children()}
{/if}
