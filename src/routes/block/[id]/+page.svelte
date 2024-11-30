<script lang="ts">
	import { page } from '$app/stores'
	import BlockDetails from '$lib/components/BlockDetails.svelte'
	import { blocks } from '$lib/pools/block.svelte'
	const { id } = $page.params
	const block = blocks.get(id)
</script>

<div>
	<BlockDetails {block} />
</div>

<style>
	div {
		max-width: 80ch;
		margin-inline: auto;
		padding: 2em;
	}
</style>
