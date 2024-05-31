<script lang="ts">
  import {page} from '$app/stores'
  import GridView from "$lib/components/GridView.svelte";
  import { getContents as getArenaContents } from '$lib/store/arena-apiv2.svelte.js'

	const channel = $page.params.channel
	let contents
	getArenaContents(channel).then(data => {
		console.log(data)
	})
</script>

<h1>{channel}</h1>
{#if contents}
	{contents}
	<!-- <GridView content={contents.list} /> -->
{/if}