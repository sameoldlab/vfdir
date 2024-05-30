<script>
  import '../app.css'
  import Header from '$lib/components/header.svelte'
  import { initSqlite } from '$lib/store/initSqlite.svelte'
  import { onMount } from 'svelte'
	import { getPromiser, promiser, setPromiser } from '$lib/store/promiser'
	let { children } = $props();

	setPromiser(promiser)
	let res = getPromiser()
	let resolved = $state(false)
	
	onMount(async () => {
		$res = await Promise.resolve($res)
		await initSqlite($res)
		resolved = true
	})
</script>

<Header />

{#if resolved }
	{@render children()}
{/if}
