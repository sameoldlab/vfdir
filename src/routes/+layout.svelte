<script lang="ts">
	import '../app.css'
	import Header from '$lib/components/header.svelte'
	import { initStore } from '$lib/database/createTables'
	import { pool } from '$lib/database/connectionPool.svelte'
	import { onMount, tick } from 'svelte'
	import { beforeNavigate } from '$app/navigation'
	import { getTree, setTree } from '$lib/stores.svelte'
	import { fade } from 'svelte/transition'
	import type { Snapshot } from '@sveltejs/kit'
	import { blocks } from '$lib/pools/block.svelte'
	let { children } = $props()

	setTree()
	const tree = getTree()
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
		pool.exec(async (tx) => {
			await initStore(tx)
			const { watchEvents, bootstrap } = await import(
				'$lib/database/watchEvents.svelte'
			)
			watchEvents()
			await bootstrap(tx)
			console.log('ready')
			ready = true
			let str = JSON.stringify(blocks.entries())
			console.log([...blocks.entries()])
			console.log(blocks.size)
		})
	})
</script>

<svelte:window onbeforeunload={() => pool.closeAll()} />

{#if pool.status === 'error'}
	<div class="error">{pool.error}</div>
{:else if pool.status === 'loading' || !ready}
	<div transition:fade={{ duration: 200 }}>
		<p>Creating visually fluid dispensaries...</p>
	</div>
{:else}
	<Header />
	<div id="padheader"></div>
	{@render children()}
{/if}

<style>
	:global(div#contents) {
		display: flex;
		flex-direction: column;
		position: relative;
		overflow: hidden;
		height: 100vh;
	}
	#padheader {
		height: 2.125rem;
		height: 0px;
		position: relative;
	}
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
