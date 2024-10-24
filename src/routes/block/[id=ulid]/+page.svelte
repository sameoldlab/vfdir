<script lang="ts">
	import { page } from '$app/stores'
	import BlockDetails from '$lib/components/BlockDetails.svelte'
	const { id } = $page.params
</script>

<div>
	<BlockDetails {id} />
</div>

<style>
	div {
		max-width: 80ch;
		margin-inline: auto;
		padding: 2em;
	}
</style>
