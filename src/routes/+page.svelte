<script lang="ts">
	import View from '$lib/components/view.svelte'
	import { blocks } from '$lib/pools/block.svelte'
</script>

<View data={[...blocks.values()]} />
<!--
-->
