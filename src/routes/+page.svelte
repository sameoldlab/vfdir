<script lang="ts">
  import GridView from '$lib/components/GridView.svelte'
  import { getChannels } from '$lib/store/sqlite.svelte.js'
	import { onMount } from 'svelte'
	import { getPromiser } from '$lib/store/promiser'

	let promiser = getPromiser()
	
	console.log($promiser);

	let channels
	onMount( async () => {
		
		console.log('fetching "channels"')
		channels = await getChannels($promiser)
		console.log(channels.list);
		// 
	})

</script>

<main>
	{channels ? channels.list : 'sadge'} 
<!--  <GridView content={channels.list} /> -->
</main>
