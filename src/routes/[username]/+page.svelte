<script lang="ts">
	import { page } from '$app/stores'
	import View from '$lib/components/view.svelte'
	import { pool } from '$lib/database/connectionPool.svelte'

	const { username } = $derived($page.params)
	const channels = $derived(
		pool.query(`select * from blocks where author_slug = ?`, [username])
	)
	$inspect(channels.data)
</script>

{#if !channels.loading}
	<View {...channels.data} />
{/if}
