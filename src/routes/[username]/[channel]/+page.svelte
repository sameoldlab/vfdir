<script lang="ts">
	import { page } from '$app/stores'
	import View from '$lib/components/view.svelte'
	import { pool } from '$lib/database/connectionPool.svelte'
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
	const contents = $derived(
		pool.query(
			`
		SELECT b.*
		FROM Connections conn
		JOIN Blocks b ON conn.child_id = b.id
		WHERE conn.parent_id = ?
		ORDER BY conn.position desc;
	`,
			[channel.data?.id]
		)
	)
</script>

<div>
	<View {...contents.data} />
</div>

<style>
	spacer {
		height: 2rem;
		display: block;
	}
</style>
