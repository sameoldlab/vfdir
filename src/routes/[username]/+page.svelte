<script lang="ts">
  import {page} from '$app/stores'
  import GridView from "$lib/components/GridView.svelte";
  // import { getContents as getArenaContents } from '$lib/store/arena-apiv2.svelte.js'

	const {username} = $page.params
	console.log(username);
	
	// getArenaContents(channel).then(data => {		console.log(data)	})
</script>
<h1>vfdir / {username}</h1>
<br>

<h2>Channels</h2>