<script lang="ts">
	import { page } from '$app/stores'
	import { channels } from '$lib/store/data.svelte.js'
	const { channel: slug, username } = $page.params

	// const channels = getChannels(db.promiser)

	// console.log('fetching "channels"')
	// getArenaChannels().then(async res => {
	// 	console.log("res", res)
	// 	await channels.push(res.channels)
	// 	console.log('Filled', channels.list)
	// })

	const metadata = $derived(channels.list.get(slug))
	$effect(() => console.log(metadata))
</script>

<h1>{slug}</h1>
<!-- <GridView content={contents.list} /> -->
Data:
{#if metadata}
	<li>{metadata.created_at}</li>
	<li>{metadata.slug}</li>
	<li>{metadata.status}</li>
	<li>{metadata.title}</li>
{/if}
