<script lang="ts">
	import { page } from '$app/stores'
	import GridView from '$lib/components/GridView.svelte'
	import Pill from '$lib/components/Pill.svelte'
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

<div>
	{#if channel.data}
		<Pill {...channel.data} />
	{/if}
	<spacer></spacer>

	<GridView content={contents.data} />
</div>

<style>
	div {
		padding: 2rem;
	}
	spacer {
		height: 2rem;
		display: block;
	}
</style>
