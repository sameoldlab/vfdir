<script lang="ts">
	// import GridView from '$lib/components/GridView.svelte'
	// import { page } from '$app/stores'
	import { pool } from '$lib/database/connectionPool.svelte'
	import { Block } from '$lib/database/schema'
	import View from '$lib/components/view.svelte'

	const col1 = pool.query<Block>(`
		select *
		from blocks
	  where type='channel'
		order by updated_at desc
	`)
</script>

<View {...col1.data} />
