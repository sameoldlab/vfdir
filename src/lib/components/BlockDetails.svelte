<script lang="ts">
	import { pool } from '$lib/database/connectionPool.svelte'
	import { Block } from '$lib/database/schema'
	import { first, pick } from '$lib/utils/queryProcess'
	import { create } from 'superstruct'
	import { untrack } from 'svelte'

	// import block from '$lib/dummy/block.js'
	// console.log(block);
	let { id }: { id: string } = $props()

	let block = $derived(
		pool.query<Block, Block>(
			`
			SELECT u.slug as username,b.title,b.type,b.description,b.image,b.created_at,b.updated_at,b.source
			FROM blocks b
			JOIN users u
			ON b.author_id = u.id
			WHERE b.id = ?
		`,
			[id],
			first
		)
	)

	let {
		title,
		type: cl,
		description,
		username,
		image,
		source,
		author_id: user_id,
		created_at,
		updated_at
	} = $derived(block.loading === false && block.data)

	// TODO: calculate channel length
	let connections = $derived(
		pool.query<
			Pick<Block, 'title' | 'source' | 'id' | 'author_id'> & {
				slug: string
			}
		>(
			`
		select b.title, b.slug, b.id, b.author_id, b.source
		from blocks b
		join connections c on c.parent_id = b.id
		where c.child_id= ?
		`,
			[id]
		)
	)

	let cacheDir: FileSystemDirectoryHandle
	navigator.storage.getDirectory().then(async (fsdh) => {
		cacheDir = await fsdh.getDirectoryHandle('cache', { create: true })
	})

	async function saveOrGet(url: string) {
		const secureHash = await crypto.subtle.digest(
			'SHA-256',
			new TextEncoder().encode(url)
		)
		const filename = Array.from(new Uint8Array(secureHash))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('')
		const cacheImg = await cacheDir.getFileHandle(filename, {
			create: true
		})

		let file = await cacheImg.getFile()
		if (file.size > 0) return URL.createObjectURL(file)

		console.log('fetching asset')
		const response = await fetch(url)
		const writableStream = await cacheImg.createWritable()
		await response.body.pipeTo(writableStream)

		file = await cacheImg.getFile()
		return URL.createObjectURL(file)

		// console.log(img)
	}
	let img: string = $state()
	$effect(() => {
		if (typeof image === 'string')
			untrack(() => saveOrGet(image).then((res) => (img = res)))
	})
</script>

{#if block.loading === false}
	<article>
		<div class="block">
			<img src={img} crossorigin="anonymous" alt="failed" />
		</div>
		<div>
			<header>
				<h1>{title}</h1>
				<p class="description">{description}</p>
			</header>
			<div class="metadata">
				<div class="data-item">
					<p>Type</p>
					<p>{cl}</p>
				</div>
				<div class="data-item">
					<p>Modified</p>
					<p>{new Date(updated_at).toLocaleDateString()}</p>
				</div>
				<div class="data-item">
					<p>Added</p>
					<p>{new Date(created_at).toLocaleDateString()}</p>
				</div>
				<div class="data-item">
					<p>By</p>
					<a href={username}> {username} </a>
				</div>

				{#if source}
					<div class="data-item">
						<p>Source</p>
						<a href={source}> {title} </a>
					</div>
				{/if}
				<div class="data-item">
					<p>Connections</p>
					<div class="connections">
						{#each connections.data as conn}
							<a href={`/${conn.author_id}/${conn.slug}`} class="connection">
								<span>{conn.title} by {conn.author_id}</span>
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
		border-block-end: 1px solid var(--line);
		&:first-child {
			border-block-start: 1px solid var(--line);
		}
		p:first-child {
			opacity: 0.64;
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
</style>
