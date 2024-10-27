<script lang="ts">
	import '../app.css'
	import Header from '$lib/components/header.svelte'
	import { createTables } from '$lib/database/createTables'
	import { pool } from '$lib/database/connectionPool.svelte'
	import { bootstrap } from '$lib/services/sync.svelte'
	import { onMount } from 'svelte'
	import { beforeNavigate, pushState } from '$app/navigation'
	import { getTree, setTree } from '$lib/stores.svelte'

	let { children } = $props()
	setTree()
	const tree = getTree()
	// let channels = {list: []}
	beforeNavigate((nav) => {
		switch (nav.type) {
			case 'link':
				if (nav.from.route.id === '/') $tree = [nav.from]
				else $tree.push(nav.from)
				break
			case 'popstate':
				if (nav.to.url.href === $tree.at(-1)?.url.href) $tree.pop()
				else $tree.push(nav.from)
		}
	})


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
