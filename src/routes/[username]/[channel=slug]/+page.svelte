<script lang="ts">
  import {page} from '$app/stores'
  import GridView from "$lib/components/GridView.svelte";
  import { getContents } from '$lib/store/arena-apiv2.svelte.js'

  const channel = $page.params.channel
  const contents = getContents(channel)
</script>

<h1>{channel}</h1>
<GridView content={contents.list} />
