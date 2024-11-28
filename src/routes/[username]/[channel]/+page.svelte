<script lang="ts">
	import { page } from '$app/stores'
	import View from '$lib/components/view.svelte'
	import { channels } from '$lib/pools/block.svelte'
	import { getBlocks } from '$lib/services/api/arenav2'

	const data = channels.get($page.params.channel).blocks

	// $effect(() => {
	// 	getBlocks($page.params.channel)
	// })
</script>

<div>
	{#if data.length === 0}
		<div class="error">
			There doesn't seem to be anything here. Searching arena for a matching
			channel.
			<p>
				or... make one of your own? <span class="text-4"
					>sorry! haven't built this part yet</span
				>
			</p>
		</div>
	{:else}
		<View {data} />
	{/if}
</div>
