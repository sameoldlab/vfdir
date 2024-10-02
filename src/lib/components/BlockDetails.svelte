<script lang="ts">
	import { pool } from '$lib/database/connectionPool.svelte'
	import { Block } from '$lib/database/schema'
	import { first, pick } from '$lib/utils/queryProcess'
	import { create } from 'superstruct'

	// import block from '$lib/dummy/block.js'
	// console.log(block);
	let { id }: { id: string } = $props()

	const pickTitle = pick('title')
	let block = $derived(
		pool.query<Block>(
			`
			SELECT u.slug as username,b.title,b.type,b.description,b.image,b.created_at
			FROM blocks b
			JOIN users u
			ON b.author_id = u.id
			WHERE b.id = ?
		`,
			[id],
			(first)
		)
	)

	$inspect(block.data)
	let {
		title,
		type: cl,
		description,
		username,
		image,
		author_id: user_id,
		created_at
	} = $derived.by(() => {
		if (block.loading === false) {
			console.log(block)
			return block.data
		}
	})
	let connections = $derived(
		pool.query(`
		select b.title, b.slug,id b.from
		from connections c
		join blocks b on c.child_id = b.id
		`)
	)
	$inspect(connections.data)
	let d = `
		SELECT b.id, b.title, b.type
		FROM Connections conn
		JOIN Blocks b ON conn.child_id = b.id
		WHERE conn.parent_id = ?
		ORDER BY conn.position;
	`
</script>

{#if block.loading === false}
	<article>
		<header>
			<h1>{title}</h1>
			<p class="description">{description}</p>
		</header>
		<div>
			<div class="block">
				<img src={image} crossorigin="anonymous" alt="failed" />
			</div>
			<div class="metadata">
				<div class="data-item">
					<p>Type</p>
					<p>{cl}</p>
				</div>
				<div class="data-item">
					<p>Added</p>
					<p>{new Date(created_at).toLocaleDateString()}</p>
				</div>
				<div class="data-item">
					<p>By</p>
					<a href={username}> {username} </a>
				</div>
				<h2>Related</h2>
				<div class="connections">
					{#each connections as conn}
						<div class="connection">
							<p>
								<a href={conn.slug}>{conn.title}</a>
							</p>
							<p>{conn.length} blocks</p>
							<p>{conn.user_id}</p>
						</div>
					{/each}
				</div>
				<!--<pre>{JSON.stringify(block).replaceAll(/\{/g, '\n    ')}</pre>-->
			</div>
		</div>
	</article>
{/if}

<style>
	article {
		width: 100%;
		& > div {
			display: flex;
			gap: 2em;
			flex-wrap: wrap;
			width: 100%;
			justify-content: space-evenly;
			align-items: center;
		}
	}
	div.block {
		flex-grow: 1;
		display: flex;
		justify-content: center;
		padding-block: 1rem;
	}
	img {
		width: min(100%, 700px);
	}
	h1,
	h2 {
		font-size: 1rem;
		padding-block-start: 0.75em;
		padding-block-end: 0.25em;
	}
	.metadata {
		margin-inline-start: auto;
		margin-inline: auto;
		padding-inline-end: 1rem;
		max-width: 28ch;
	}
	.data-item {
		display: flex;
		gap: 1rem;
		justify-content: space-between;
		border-block-end: 1px solid var(--line);
	}
	.connections {
		display: grid;
		gap: 0.75rem;
	}
	.connection {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		background: var(--line);
	}
</style>
