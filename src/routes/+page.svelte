<script lang="ts">
  import GridView from "$lib/GridView.svelte";
  import { getChannels } from '$lib/stores/arena-apiv2.svelte.js'

  const channels = getChannels()
</script>

<main>
  <GridView content={channels.list} />
</main>
