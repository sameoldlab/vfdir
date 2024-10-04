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
		</div>
	</div>
	<p class="title">{c.title || c.type}</p>
</div>

<style>
	.item {
		/* border: 1px solid #66666632; */
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		/* border-radius: 1rem; */
		display: grid;
		justify-items: center;

		& > a {
			aspect-ratio: 1 / 1;
			display: block;
			width: 100%;
			overflow: hidden;
			box-sizing: border-box;
			border: 1px solid transparent;
			transition: border 120ms ease-in;
		}
		&:hover,
		&:has(a:focus) {
			& > a {
				border: 1px solid #666;
			}
			.title {
				opacity: 1;
			}
		}
	}
	.title {
		padding-block-start: 0.5rem;
		opacity: 0;
		transition: opacity 120ms ease-in;
		text-align: center;
	}

	.contain {
		position: relative;
		display: grid;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		width: 100%;
		height: 100%;
		font-size: 0.9rem;
	}
	img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}
	.public {
		border: 1px solid green;
	}
	.private {
		border: 1px solid #666;
	}
	.closed {
		border: 1px solid red;
	}
</style>
