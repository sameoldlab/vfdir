<script lang="ts">
  import GridView from '$lib/components/GridView.svelte'
  import { getChannels } from '$lib/store/arena-apiv2.svelte.js'

  const channels = getChannels()
</script>

<main>
  <GridView content={channels.list} />
</main>
