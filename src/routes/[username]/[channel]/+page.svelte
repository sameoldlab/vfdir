<script lang="ts">
	import { page } from '$app/stores'
	import GridView from '$lib/components/GridView.svelte'
	import { pool } from '$lib/database/connectionPool.svelte'
	import { first } from '$lib/utils/queryProcess'
	const { channel: slug, username } = $page.params

	const channel = pool.query(
		`
		select id,slug,title,created_at,status 
		from blocks
	  where slug=?
	`,
		[slug],
		first
	)
	const contents = $derived(
		pool.query(
			`
		SELECT b.id, b.title, b.type
		FROM Connections conn
		JOIN Blocks b ON conn.child_id = b.id
		WHERE conn.parent_id = ?
		ORDER BY conn.position;
	`,
			[channel.data?.id]
		)
	)
	$inspect(contents)
</script>

{#if channel.data}
	<h1>{channel.data.title}</h1>

	<li>{new Date(channel.data.created_at).toUTCString()}</li>
	<li>{channel.data.status}</li>
{/if}
<GridView content={contents.data} />

<!--  -->
