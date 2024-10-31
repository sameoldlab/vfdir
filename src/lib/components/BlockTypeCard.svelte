<script lang="ts">
	import './blockType.css'
	import type { BlocksRow } from '$lib/database/schema'
	import * as T from './types'
	import { handleFile } from '$lib/utils/getFile'

	let { ...c }: BlocksRow = $props()
	const Type = T[c.type]
	const connect = (e: MouseEvent) => {
		e.preventDefault()
		console.log(c)
	}
	const makeLink = () => {
		let link = ''
		switch (c.source) {
			case 'arena':
				link = `are.na/${c.author_id}/${c.slug}`
				break
		}
		return 'https://' + link
	}
	const source = !c.source ? null : c.type !== 'channel' ? c.source : makeLink()
</script>

<div class="block-item {status}">
	<div class="box">
		<a
			class={c.type}
			href={c.type === 'channel'
				? `/${c.author_id}/${c.slug}`
				: `/block/${c.id}`}
		>
			{#if c.image}
				<img use:handleFile={{ src: c.image }} src={c.image} alt={c.image} />
			{:else}
				<Type {...c} />
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
