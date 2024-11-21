<script lang="ts">
	import '../app.css'
	import Header from '$lib/components/header.svelte'
	import { createTables } from '$lib/database/createTables'
	import { pool } from '$lib/database/connectionPool.svelte'
	import { bootstrap } from '$lib/services/sync.svelte'
	import { onMount } from 'svelte'
	import { beforeNavigate } from '$app/navigation'
	import { getTree, setTree } from '$lib/stores.svelte'
	import { fade } from 'svelte/transition'
	import { watchEvents } from '$lib/database/watchEvents.svelte'

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
		pool.exec(async (tx, db) => {
			await createTables(tx)
			watchEvents()
			await bootstrap(tx)
			ready = true
		})
	})
</script>

{#if pool.status === 'error'}
	<pre><code>{pool.error}</code></pre>
{:else if pool.status === 'loading' || !ready}
	<div transition:fade={{ duration: 300 }}>
		<p>Creating visually fluid dispensaries...</p>
	</div>
{:else}
	<Header />
	{@render children()}
{/if}

<style>
	div {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100svh;
		p {
			color: var(--b6);
			font-weight: 500;
			animation: pulse 5s infinite ease-in-out;
			text-shadow: 0 0 16px var(--b5);
		}
	}

	@keyframes pulse {
		50% {
			opacity: 0.75;
			text-shadow: 0 0 16px var(--b5);
			color: var(--b5);
		}
		0%,
		100% {
			opacity: 1;
			text-shadow: 0 0 8px var(--b5);
			color: var(--b6);
		}
	}
</style>
