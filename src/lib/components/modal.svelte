<script lang="ts">
	import type { Snippet } from 'svelte'

	let { id, children }: { id: string; children: Snippet } = $props()
</script>

<div {id} popover="auto">
	<button popovertarget={id} popovertargetaction="hide">X</button>
	{@render children()}
</div>

<style>
	div {
		width: 35ch;
		border-radius: 0.25rem;
		border: 1px solid var(--line);
		top: 50%;
		left: 50%;
		translate: -50% -50%;
		background: var(--b2);
		padding: 1rem;
		&::backdrop {
			backdrop-filter: blur(4px);
		}
	}
	button {
		background: none;
		position: fixed;
		top: 1rem;
		right: 1rem;
	}
</style>
