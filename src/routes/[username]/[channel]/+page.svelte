<script lang="ts">
	import { page } from '$app/stores'
	import View from '$lib/components/view.svelte'
	import { channels } from '$lib/pools/block.svelte'

	const channel = $derived(channels.get($page.params.channel))
	const data = $derived(channel?.blocks)
</script>

<div>
	{#if !channel}
		<div class="error">Channel not saved. Fetching...</div>
	{:else if data.length === 0}
		<div class="error">
			There doesn't seem to be anything here. Searching arena for a matching
			channel.
			<p>
				or... make one of your o-- <span class="text-4"
					>sorry! haven't built this part yet</span
				>
			</p>
		</div>
	{:else}
		<View {data} />
	{/if}
</div>
