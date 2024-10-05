<script lang="ts">
	import './blockType.css'
	import { Block, Channel } from '$lib/database/schema'
	import * as T from './types'

	let { ...c }: Block | Channel = $props()
	const Type = T[c.type]
</script>

<div class="block-item {status}">
	<div class="stack">
		<a href={c.type === 'channel' ? `${c.user}/${c.slug}` : `/block/${c.id}`}>
			<div class="contain {c.type}">
				<Type {...c} />
			</div>
		</a>
		<div class="overlay">
			<div class="start">
				<div class="start">**</div>
				<button class="end">...</button>
			</div>
			<div class="end">
				<button onclick={connect} class="btn">Connect</button>
			</div>
		</div>
	</div>
	<p class="title">{c.title || c.type}</p>
</div>
