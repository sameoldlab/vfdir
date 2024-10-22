<script lang="ts">
	import { page } from '$app/stores'
	import GridView from '$lib/components/views/GridView.svelte'
	const channel = $page.params.id
</script>

{channel}
