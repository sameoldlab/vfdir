<script lang="ts">
	import { page } from '$app/stores'
	import BlockDetails from '$lib/components/BlockDetails.svelte'
	import { blocks } from '$lib/pools/block.svelte'
	const block = $derived(blocks.get($page.params.id))
</script>

<div>
	<BlockDetails {block} />
</div>

<style>
	div {
		overflow-y: scroll;
		height: 100%;
	}
</style>
