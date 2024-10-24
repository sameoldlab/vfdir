<script lang="ts">
	import { page } from '$app/stores'
	import { getTree, VIEWS } from '$lib/stores'
	import block from './svg/block.svelte'
	import miller from './svg/miller.svelte'
	import table from './svg/table.svelte'
	import canvas from './svg/canvas.svelte'
	import type { NavigationTarget } from '@sveltejs/kit'
	import { pool } from '$lib/database/connectionPool.svelte'

	type Props = {
		title: string
		status: 'public'
		size: number
		created_at: Date
	}

	const tree = getTree()
	const inChannel = $page.params?.channel
	const data = $derived({
		title: $page.params.id ? '' : ($page.params?.channel ?? 'All'),
		created_at: 0,
		status: 'public',
		size: 99
	})

	const view = $derived(
		pool.query<{ view: VIEWS }, VIEWS>(
			`select view from state where route=?`,
			[$page.url.href],
			(data) => (!data ? undefined : data[0]?.view || VIEWS[0])
		)
	)

	let activeView = $derived(view.data)
	const viewIcons = [block, miller, table, canvas]
	const setView = (newView: string) => {
		pool.exec(async (db) => {
			await db.exec(
				`INSERT INTO state(route,view) VALUES(?,?) 
				ON CONFLICT DO UPDATE SET view = ? WHERE route = ?`,
				[$page.url.href, newView, newView, $page.url.href]
			)
		})
	}
</script>

<header>
	<nav>
		<!-- <a href="/" class="main">
			<div class="section">
				<svg
					width="15"
					height="15"
					viewBox="0 0 15 15"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					><path
						d="M7 0.22C7.31 0 7.68 0 8 0.22L14.67 6.86C14.9 7 15 7.5 14.67 7.71C14.5 8 14 8 13.82 7.7L13 6.9V12.5C13 12.77 12.77 13 12.5 13H2.5C2.22 13 2 12.77 2 12.5V6.9L1.17 7.71C1 8 0.55 8 0.32 7.71C0 7.5 0 7 0.32 6.86L7 0.22ZM7.5 1.5L12 6V12H10V8.5C10 8.22 9.77 8 9.5 8H6.5C6.22 8 6 8.22 6 8.5V12H3V6L7.5 1.5ZM7 12H9V9H7V12Z"
						fill="currentColor"
						fill-rule="evenodd"
						clip-rule="evenodd"
					>
					</path></svg
				>
			</div>
		</a> -->
		<div class="main">
			<div class="section {data.status}">
				<h1 class="tree">
					<a href="/">~/</a>
					{#snippet route(node: NavigationTarget)}
						<a href={`/` + node.params.username}> {node.params.username}</a>
						/ <a href={node.url.href}> {node.params.channel}</a>
					{/snippet}
					{#if 'channel' in ($tree.at(-1)?.params ?? {})}
						{@render route($tree.at(-1))}
					{:else if $page.params.channel}
						{@render route($page)}
					{/if}
				</h1>
				{#if data.status === 'public'}
					<svg
						viewBox="0 0 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						><path
							d="M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z"
							fill="oklch(.7 .08 180)"
							fill-rule="evenodd"
							clip-rule="evenodd"
						></path></svg
					>
				{/if}
			</div>
			{#if inChannel}
				<div class="section">
					<span class="light">updated: </span>
					{new Date(data.created_at).toLocaleDateString()}
				</div>
				<div class="section">
					{data.size} <span class="light">items</span>
				</div>
			{/if}
		</div>
	</nav>
	<div class="main">
		{#each VIEWS as view, i}
			{@const Icon = viewIcons[i]}
			<button
				class="view light"
				class:selected={activeView === view}
				onclick={() => setView(view)}
				aria-label={view}
			>
				<Icon />
			</button>
		{/each}
	</div>
</header>

<style>
	header {
		display: flex;
		position: sticky;
		top: 0;
		left: 0;
		right: 0;
		justify-content: space-between;
		padding-inline: 1em;
		grid-row: header-start / header-end;
		grid-column: full-start / full-end;
		border-bottom: 1px solid var(--line);
		background: oklch(0.25 0 0);

		font-weight: 400;
		z-index: 99;
	}

	button.view {
		background: none;
		height: 2rem;
		width: 2rem;
		padding: 0;
		&:hover,
		&.selected {
			color: oklch(0.8 0 0);
		}
		:global(svg) {
			height: 100%;
			width: 100%;
		}
	}
	nav {
		display: flex;
		gap: 0.5rem;
	}
	.main {
		display: flex;
		gap: 0.375rem;
		align-items: center;
		border-radius: 1rem;
		& * {
			font-size: 0.85rem;
			line-height: 100%;
		}
	}
	.section {
		display: flex;
		gap: 0.25rem;
		align-items: center;
		/* background: oklch(0.2 0 0); */
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
	}
	h1 {
		display: inline;
		font-weight: 600;
		padding-inline-end: 0.5em;
		a {
			font-weight: inherit;
		}
	}
	svg {
		height: 1rem;
		width: 1rem;
	}
	.light {
		color: oklch(0.64 0 0);
	}
</style>
