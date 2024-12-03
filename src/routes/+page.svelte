<script lang="ts">
	import View from '$lib/components/view.svelte'
	import { blocks } from '$lib/pools/block.svelte'
	import type { Snapshot } from '@sveltejs/kit'
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

<View data={[...blocks.values()]} {y} />
<!--
-->
