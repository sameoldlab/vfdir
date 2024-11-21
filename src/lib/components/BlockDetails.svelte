<script lang="ts">
	import { pool } from '$lib/database/connectionPool.svelte'
	import { Block, User } from '$lib/database/schema'
	import { firstPick, first } from '@vlcn.io/xplat-api'
	import { naturalDate } from '$lib/utils/naturalDate'
	import { handleFile } from '$lib/utils/getFile'
	import { fade } from 'svelte/transition'

	// import block from '$lib/dummy/block.js'
	// console.log(block);
	let { id }: { id: string } = $props()

	let b = $derived(
		pool.query<Block, Block>(
			`
			SELECT b.author_slug,b.title,b.type,b.description,b.image,b.created_at,b.updated_at,b.source
			FROM blocks b
			WHERE b.id = ?
		`,
			[id],
			first
		)
	)

	// TODO: calculate channel length
	let connections = $derived(
		pool.query<
			Pick<Block, 'title' | 'source' | 'id' | 'author_slug'> & {
				slug: string
			}
		>(
			`
		select b.title, b.slug, b.id, b.author_slug, b.source, b.author_slug
		from blocks b
		join connections c on c.parent_id = b.id
		where c.child_id= ?
		`,
			[id]
		)
	)
</script>

{#if !b.loading}
	<article>
		<div class="block">
			{#if b.data.image}
				<img
					use:handleFile={{ src: b.data.image }}
					src={b.data.image}
					transition:fade
					crossorigin="anonymous"
					alt={b.data.image}
				/>
			{/if}
		</div>
		<div>
			<header>
				<h1>{b.data.title}</h1>
				<p class="description text-6">{b.data.description}</p>
			</header>
			<div class="metadata">
				<div class="data-item">
					<p>Type</p>
					<p>{b.data.type}</p>
				</div>
				<div class="data-item">
					<p>Modified</p>
					<time datetime={new Date(b.data.updated_at).toLocaleString()}
						>{naturalDate(b.data.updated_at)}</time
					>
				</div>
				<div class="data-item">
					<p>Added</p>
					<time datetime={new Date(b.data.created_at).toLocaleString()}
						>{naturalDate(b.data.created_at)}</time
					>
				</div>
				<div class="data-item">
					<p>By</p>
					<a href={b.data.author_slug}> {b.data.author_slug} </a>
				</div>

				{#if b.data.source}
					<div class="data-item">
						<p>Source</p>
						<a href={b.data.source}> {b.data.title} </a>
					</div>
				{/if}
				<div class="data-item">
					<p>Connections</p>
					<div class="connections">
						{#each connections.data as conn}
							<a href={`/${conn.author_slug}/${conn.slug}`} class="connection">
								<span>{conn.title} by {conn.author_slug}</span>
								<!--<p>{conn.length} blocks</p>-->
							</a>
						{/each}
					</div>
				</div>
			</div>
			<!--<pre>{JSON.stringify(block).replaceAll(/\{/g, '\n    ')}</pre>-->
		</div>
	</article>
{/if}

<style>
	article {
		width: 100%;
		container-name: article;
		container-type: size;
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
	h1 {
		font-size: 1rem;
		padding-block-start: 0.75em;
		padding-block-end: 0.25em;
	}
	header {
		width: 100%;
	}
	.metadata {
		margin-inline-start: auto;
		margin-inline: auto;
		width: 100%;
		padding-inline-end: 1rem;
	}
	.data-item {
		display: grid;
		grid-template-columns: 1fr 2fr;
		justify-content: space-between;
		padding-block: 0.25rem;
		border-block-end: var(--border);
		&:first-child {
			border-block-start: var(--border);
		}
		p:first-child {
			color: var(--b6);
			font-weight: 500;
			font-size: 0.95rem;
		}
		& > * {
			padding-block: 0.25rem;
		}
	}
	.connections {
		display: grid;
		gap: 0.75rem;
	}
	.connection {
		display: flex;
		justify-content: space-between;
		/* padding-block: 0.5rem; */
		/* border-block: 1px solid var(--line); */
	}
	@container article(width > 400px) {
	}
</style>
