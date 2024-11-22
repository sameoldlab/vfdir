<script lang="ts">
	import { page } from '$app/stores'
	import View from '$lib/components/view.svelte'
	import { pool } from '$lib/database/connectionPool.svelte'
	import { getBlocks } from '$lib/services/api/arenav2'
	import { first } from '$lib/utils/queryProcess'

	const channel = $derived(
		pool.query(
			`
		select 
			b.id,b.slug,b.title,b.created_at,b.status,b.type,
			coalesce(c.conn_count, 0) as size 
		from blocks b
		left join (
			select parent_id,count(*) as conn_count
			from connections
			group by parent_id
		) c on b.id = c.parent_id
	  where slug=?
	`,
			[$page.params.channel],
			first
		)
	)
	$effect(() => {
		getBlocks($page.params.channel)
	})
	const contents = $derived(
		!channel.loading &&
			channel.data.id &&
			pool.query(
				`
		SELECT b.*
		FROM Connections conn
		JOIN Blocks b ON conn.child_id = b.id
		WHERE conn.parent_id = ?
		ORDER BY conn.position asc;
	`,
				[channel.data.id]
			)
	)
</script>

<div>
	{#if !contents.loading}
		<View {...contents.data} />
	{/if}
</div>

<style>
	spacer {
		height: 2rem;
		display: block;
	}
</style>
