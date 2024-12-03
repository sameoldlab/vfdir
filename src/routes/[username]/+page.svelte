<script lang="ts">
	import { page } from '$app/stores'
	import View from '$lib/components/view.svelte'
	import { users } from '$lib/pools/block.svelte'
	import type { Snapshot } from '@sveltejs/kit'

	const user = $derived(users.get($page.params.username))
	const data = $derived(user?.all)
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

{#if !user}
	<div class="error">
		User: {$page.params.username} not found. Try searching one of their channels
		instead.
	</div>
{:else if data.length === 0}
	empty
{:else}
	<View {data} {y} />
{/if}
