<script lang="ts">
	import GridView from '$lib/components/GridView.svelte'
	import { getChannels } from '$lib/store/data.svelte.js'
	import { getChannels as getArenaChannels } from '$lib/store/arena-apiv2.svelte'
	import { db } from '$lib/store/initSqlite.svelte'
	
	let channels = getChannels(db.promiser)
	
	console.log('fetching "channels"')
	getArenaChannels().then(async res => {
		console.log(res)
		await channels.push(res.channels)
		console.log('Filled', channels.list)
	})
	
</script>

<main>
	{#if channels.list}
		<GridView content={channels} />
	{/if}
</main>
