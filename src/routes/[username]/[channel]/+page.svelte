<script lang="ts">
	import { page } from '$app/stores'
	import View from '$lib/components/view.svelte'
	import { channels } from '$lib/pools/block.svelte'
	import type { Snapshot } from '@sveltejs/kit'

	const channel = $derived(channels.get($page.params.channel))
	const data = $derived(channel?.blocks)

	const scroll = (init = 0) => {
		let val = $state(init)
		return {
			get val() {
				return val
			},
			set val(v) {
				val = v
			}
		}
	}
	let y = scroll(0)
	export const snapshot: Snapshot<number> = {
		capture() {
			return y.val
		},
		restore(value) {
			y.val = value
		}
	}
</script>

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
	<View {data} {y} />
{/if}
