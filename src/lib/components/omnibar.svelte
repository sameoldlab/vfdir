<script lang="ts">
	import { page } from '$app/stores'
	import { getTree } from '$lib/stores.svelte'
	import type { NavigationTarget } from '@sveltejs/kit'
	import type { Action } from 'svelte/action'

	const tree = getTree()

	const trigger: Action<HTMLDivElement> = (el) => {
		const input = el.querySelector('input')
		const onToggle = (e: ToggleEvent) => {
			const invoker: HTMLButtonElement = document.querySelector(
				`[popovertarget="${el.id}"]`
			)

			if (e.newState === 'open') {
				const clientRect = invoker.getBoundingClientRect()
				input.focus()
				console.log(clientRect)
			} else {
				input.value = ''
			}
		}
		el.addEventListener('toggle', onToggle)
		return {
			destroy() {
				el.removeEventListener('toggle', onToggle)
			}
		}
	}
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
{#snippet route(node: NavigationTarget)}
	<a href={`/` + node.params.username}> {node.params.username} /</a>
	<button popovertarget="omninput" class="current" popovertargetaction="toggle"
		>{node.params.channel}</button
	>
{/snippet}

<div id="omnibar" class="section">
	<div id="route">
		<a href="/" aria-label="home"> ~/ </a>
		{#if $page.params.channel}
			{@render route($page)}
		{:else if 'channel' in ($tree.at(-1)?.params ?? {})}
			{@render route($tree.at(-1))}
		{/if}
	</div>
	<div id="omninput" popover="auto" use:trigger>
		<input placeholder="hello world" />
		<div>
			<ul>
				<li>Create Item</li>
				<li>Create Item</li>
				<li>Create Item</li>
				<li>Create Item</li>
				<li>Create Item</li>
			</ul>
		</div>
	</div>
</div>

<style>
	#omnibar {
		display: inline-flex;
		color: var(--b5);
		/* background: var(--b2); */
		border-radius: 0.25rem;
		margin-block: 0.2rem;
		line-height: 100%;
		justify-self: stretch;
		padding-inline: 1.25rem;

		&:has(#omninput[popover]:popover-open) {
			#route {
				opacity: 0;
			}
		}
	}
	#route {
		display: inline-flex;
		align-items: center;
		& > * {
			padding-inline: 0.5ch;
			padding-block: 0.25rem;
			&:focus,
			&:hover {
				text-decoration: underline;
				outline: none;
				background: var(--b3);
				border-radius: 0.25rem;
				color: var(--b7);
			}
		}
	}
	a {
		transition: color 100ms ease-in;
		font-weight: inherit;
	}
	.current {
		color: var(--highlight);
		cursor: text;
	}
	#omninput {
		left: 50%;
		translate: -50% 0;
		background: var(--b1);
		border: none;
		width: 50vw;
		outline: none;
		&:focus-within {
			border-bottom: 1px solid var(--highlight);
		}
		input {
			width: 100%;
			background: inherit;
			border: none;
			font-weight: inherit;
			padding-block: 0.25rem;
			outline: none;
		}
	}
</style>
