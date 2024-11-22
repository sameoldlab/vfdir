<script lang="ts">
	import './blockType.css'
	import type { BlocksRow } from '$lib/database/schema'
	import { handleFile } from '$lib/utils/getFile'
	import { micromark } from 'micromark'

	let { ...c }: BlocksRow = $props()
	const connect = (e: MouseEvent) => {
		e.preventDefault()
		console.log(c)
	}
	const makeLink = () => {
		let link = ''
		switch (c.source) {
			case 'arena':
				link = `are.na/${c.author_slug}/${c.slug}`
				break
		}
		return 'https://' + link
	}
	const source = !c.source ? null : c.type !== 'channel' ? c.source : makeLink()
	const content = c.type === 'text' ? micromark(c.content) : null
</script>

<div class="block-item {status}">
	<div class="box">
		<a
			class={c.type}
			href={c.type === 'channel'
				? `/${c.author_slug}/${c.slug}`
				: `/block/${c.id}`}
		>
			{#if c.image}
				<img use:handleFile={{ src: c.image }} alt={c.image} />
			{:else if c.type === 'channel'}
				<div class="channel">
					<p class="title">{c.title}</p>
					<p class="author">by {c.author_slug}</p>
				</div>
			{:else if content}
				<div class="text"><p>{@html content}</p></div>
			{/if}
		</a>
		<div class="overlay">
			<div class="start">
				<div class="start">**</div>
				<button class="end">...</button>
			</div>
			<div class="end">
				{#if source}
					<a href={source} class="btn">Source</a>
				{/if}
				<button onclick={connect} class="btn">Connect</button>
			</div>
		</div>
	</div>
	<p class="title">{c.title || ''}</p>
</div>

<style>
	.text > p {
		height: 100%;
		padding: 1ch;
		max-width: 100%;
		line-break: strict;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		text-overflow: clip;
	}
	.channel {
		.title {
			font-size: 1.5rem;
		}
		div {
			color: var(--type);
			display: flex;
			flex-direction: column;
			text-align: center;
			justify-content: center;
		}
	}
</style>
