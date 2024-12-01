<script lang="ts">
	import { naturalDate } from '$lib/utils/naturalDate'
	import { handleFile } from '$lib/utils/getFile'
	import { fade } from 'svelte/transition'
	import type { Entry } from '$lib/pools/block.svelte'
	import { micromark } from 'micromark'

	let { block: b }: { block: Entry } = $props()

	const content = b.type === 'text' ? micromark(b.content) : null
</script>

<article>
	<div class="block">
		{#if b.image}
			<img
				use:handleFile={{ src: b.image }}
				src={b.image}
				data-src={b.image}
				in:fade
				crossorigin="anonymous"
				alt={b.image}
			/>
		{:else if b.type === 'attachment'}
			<video
				use:handleFile={{ src: b.attachment }}
				data-src={b.attachment}
				muted
				autoplay
				loop
				controls
			></video>
		{:else if b.type === 'channel'}
			<div class="channel">
				<p class="title">{b.title}</p>
				<p class="author">by {b.author.slug}</p>
			</div>
		{:else if content}
			<div class="text"><p>{@html content}</p></div>
		{/if}
	</div>
	<div>
		<header>
			<h1>{b.title}</h1>
			<p class="description text-6">{b.description}</p>
		</header>
		<div class="metadata">
			<div class="data-item">
				<p>Type</p>
				<p>{b.type}</p>
			</div>
			<div class="data-item">
				<p>Modified</p>
				<time datetime={new Date(b.updated_at).toLocaleString()}
					>{naturalDate(b.updated_at)}</time
				>
			</div>
			<div class="data-item">
				<p>Added</p>
				<time datetime={new Date(b.created_at).toLocaleString()}
					>{naturalDate(b.created_at)}</time
				>
			</div>
			<div class="data-item">
				<p>By</p>
				<a href={'/' + b.author.slug}> {b.author.slug} </a>
			</div>

			{#if b.source}
				<div class="data-item">
					<p>Source</p>
					<a href={b.source}> {b.title} </a>
				</div>
			{/if}
			<div class="data-item">
				<p>Connections</p>
				<div class="connections">
					{#each b.connections as channel}
						<a
							href={`/${channel.author.slug}/${channel.slug}`}
							class="connection"
						>
							<span>{channel.title} by {channel.author.slug}</span>
							<p>{channel.length} blocks</p>
						</a>
					{/each}
				</div>
			</div>
		</div>
		<!--<pre>{JSON.stringify(block).replaceAll(/\{/g, '\n    ')}</pre>-->
	</div>
</article>

<style>
	article {
		width: 100%;
		height: 100%;
		flex-direction: column;
		overflow-y: scroll;
		container-name: article;
		margin-inline: auto;
		padding: 1em 1em 4em;
		& > div {
			display: flex;
			gap: 1em;
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
	img,
	video {
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
