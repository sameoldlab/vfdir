<script lang="ts">
	import { page } from '$app/stores'
	import View from '$lib/components/view.svelte'
	import { users } from '$lib/pools/block.svelte'

	const user = users.get($page.params.username)
	const data = user?.all
</script>

{#if !user}
	<div class="error">
		User: {$page.params.username} not found. Try searching one of their channels
		instead.
	</div>
{:else if data.length === 0}
	empty
{:else}
	<View {data} />
{/if}
