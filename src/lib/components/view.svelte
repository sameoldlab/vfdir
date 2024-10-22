<script lang="ts">
	import { view } from '$lib/stores'
	import GridView from './views/GridView.svelte'
	import MillerView from './views/MillerView.svelte'
	type Props = {}[]

	let { ...data }: Props = $props()
</script>

{#if $view === 'block'}
	<GridView {...data} />
{:else if $view === 'miller'}
	<MillerView {...data} />
{/if}
