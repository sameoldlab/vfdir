<script lang="ts">
	import { page } from '$app/stores'
	import { getTree } from '$lib/stores.svelte'
	import type { NavigationTarget } from '@sveltejs/kit'

	const tree = getTree()
	const data = $derived({
		title: $page.params.id ? '' : ($page.params?.channel ?? 'All'),
		created_at: 0,
		status: 'public',
		size: 99
	})
</script>

<!--
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
-->

<div class="main">
	<div class="section {data.status}">
		<div>
			<a href="/" aria-label="home"> / home / </a>
			{#snippet route(node: NavigationTarget)}
				<a href={`/` + node.params.username}> {node.params.username}</a>
				/ <a href={node.url.href}> {node.params.channel}</a>
			{/snippet}
			{#if $page.params.channel}
				{@render route($page)}
			{:else if 'channel' in ($tree.at(-1)?.params ?? {})}
				{@render route($tree.at(-1))}
			{/if}
		</div>
	</div>
</div>

<style>
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
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
	}
	div {
		display: inline;
		padding-inline-end: 0.5em;
		a {
			font-weight: inherit;
		}
	}
</style>
