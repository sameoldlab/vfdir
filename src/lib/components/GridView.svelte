<script lang="ts">
	import type { Block, Channel } from '$lib/database/schema'
	import BlockTypeCard from './BlockTypeCard.svelte'
	let { ...content }: (Block | Channel)[] = $props()
	console.log(content)
</script>

<div class="grid">
	{#each content as c, i (c.id)}
		<BlockTypeCard {...c} />
	{/each}
</div>

<style>
	.grid {
		--size: 260px;
		display: grid;
		gap: 1em;
		grid-template-columns: repeat(auto-fill, minmax(var(--size), 1fr));
		box-sizing: border-box;
	}
	div {
		display: block;
	}
</style>
