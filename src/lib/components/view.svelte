<script lang="ts">
	import { view } from '$lib/stores'
	import GridView from './GridView.svelte'
	type Props = {}[]

	let { ...data }: Props = $props()
</script>

{#if $view === 'block'}
	<GridView {...data} />
{:else if $view === 'miller'}
	miller
{/if}
