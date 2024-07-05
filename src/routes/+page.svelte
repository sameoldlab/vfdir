<script lang="ts">
	// import GridView from '$lib/components/GridView.svelte'
	import { channels } from '$lib/store/data.svelte.js'
	import type { Action } from 'svelte/action'
	let leftWidth: number
	const resizer: Action<HTMLDivElement> = el => {
		const leftPane = el.previousElementSibling as HTMLDivElement
		const rightPane = el.nextElementSibling as HTMLDivElement
		// let directionX = 0

		const doc_mouseMove = (e: MouseEvent) => {
			leftPane.style.width = `${leftWidth + e.movementX}px`
			document.body.style.cursor = 'col-resize'
			document.body.style.userSelect = 'none'
			document.body.style.pointerEvents = 'none'
			// directionY = e.movementY
		}
		const doc_mouseUp = () => {
			document.body.style.removeProperty('cursor')
			document.body.style.removeProperty('user-select')
			document.body.style.removeProperty('pointer-events')

			document.removeEventListener('mousemove', doc_mouseMove)
			document.removeEventListener('mouseup', doc_mouseUp)
		}

		const el_mouseDown = () => {
			el.style.cursor = 'col-resize'

			document.addEventListener('mousemove', doc_mouseMove)
			document.addEventListener('mouseup', doc_mouseUp)
		}

		el.addEventListener('mousedown', el_mouseDown)

		return {
			destroy() {
				el.removeEventListener('mousedown', el_mouseDown)
				document.removeEventListener('mousemove', doc_mouseMove)
				document.removeEventListener('mouseup', doc_mouseUp)
			},
		}
	}
</script>

<div class="pane left" bind:clientWidth={leftWidth}>
	<a href="/df/adsaf" class="item">link</a>
	<a href="/gf/adsdsafdsf" class="item">link</a>
	<a href="/rtf/fsdsaf" class="item">link</a>
	<a href="/dhf/adsdsf" class="item">link</a>
	<a href="/dh/adsaf" class="item">link</a>
	<a href="/nf/adfsaf" class="item">link</a>
	<a href="/erwf/adsdaf" class="item">link</a>
	<!-- 		{#each channels.list as { title, slug }}
			{title}
			<!-- <GridView content={channels} /> --
		{:else}
			<div class="item">empty</div>
		{/each} -->
</div>
<div class="handle" draggable use:resizer>
	<div></div>
</div>
<div class="pane right">
	<a href="/df/adsaf" class="item"> link</a>
	<a href="/gf/adsdsafdsf" class="item"> link</a>
	<a href="/rtf/fsdsaf" class="item"> link</a>
	<a href="/dhf/adsdsf" class="item"> link</a>
	<a href="/dh/adsaf" class="item"> link</a>
	<a href="/nf/adfsaf" class="item"> link</a>
	<a href="/erwf/adsdaf" class="item"> link</a>
</div>

<div class="handle">
	<div></div>
</div>

<style>
	.handle {
		width: 1rem;
		grid-row: 2;
		/* opacity: 0; */
		outline: 4px solid transparent;
		display: flex;
		justify-content: center;
		transition: background-color 100ms 80ms ease-out;

		&:hover {
			animation: delayed-resize 0ms 150ms ease-out forwards;
			background: oklch(0.24 0 89.88);
			/* outline: 4px solid oklch(.3 0 0); */
			/* delay 200ms then transition cursor to resize */
			/* width: 4px; */
			opacity: 1;
		}
		& div {
			width: 1px;
			height: 100%;
			background: var(--line);
			opacity: 1;
		}
	}

	@keyframes delayed-resize {
		from {
			pointer-events: none;
		}
		to {
			pointer-events: auto;
			cursor: col-resize;
		}
	}
	.pane {
		display: flex;
		flex-direction: column;
		/* border-inline-end: 1px solid hsl(0 0% 24%); */
		/* padding: .5em; */
		grid-row-start: 2;
		/* width: 1fr; */
		.item {
			/* border-block: 1px solid ; */
			padding: 0.25em 0.75em;
			&:hover,
			&:focus {
				background: red;
			}
		}
	}
	.pane.left { 
		grid-column: full-start / chan-end;
		min-width: fit-content;
		width: 20ch;
		} 
		
		.pane.right {
			/* min-width: fit-content; */
			/* width: 40ch; */
		/* background: brown; */
		/* width: 100%; */
	}
</style>
