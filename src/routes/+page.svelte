<script lang="ts">
  import BlockDetails from '$lib/components/blockDetails.svelte';
	// import GridView from '$lib/components/GridView.svelte'
	// import { channels } from '$lib/store/data.svelte.js'
	import type { Action } from 'svelte/action'

	const resizer: Action<HTMLDivElement> = el => {
		const left = el.previousElementSibling as HTMLDivElement
		const leftWidth = left.getBoundingClientRect().width

		const doc_mouseMove = (e: MouseEvent) => {
			const leftWidth = left.getBoundingClientRect().width
			left.style.width = `${leftWidth + e.movementX}px`
		}
		const doc_mouseUp = () => {
			document.body.style.removeProperty('cursor')
			document.body.style.removeProperty('user-select')
			// document.body.style.removeProperty('pointer-events')

			document.removeEventListener('mousemove', doc_mouseMove)
			document.removeEventListener('mouseup', doc_mouseUp)
		}

		const el_mouseDown = () => {
			document.body.style.cursor = 'col-resize'
			document.body.style.userSelect = 'none'
			// document.body.style.pointerEvents = 'none'
			document.addEventListener('mousemove', doc_mouseMove)
			document.addEventListener('mouseup', doc_mouseUp)
		}
		const el_dblclick = () => {
			left.style.width = `${leftWidth}px`
		}

		el.addEventListener('dblclick', el_dblclick)
		el.addEventListener('mousedown', el_mouseDown)

		return {
			destroy() {
				el.removeEventListener('dblclick', el_dblclick)
				el.removeEventListener('mousedown', el_mouseDown)
				document.removeEventListener('mousemove', doc_mouseMove)
				document.removeEventListener('mouseup', doc_mouseUp)
			},
		}
	}
	const key: Action<HTMLAnchorElement> = (a) => {
		const prev = a.previousElementSibling as HTMLAnchorElement | null
		const next = a.nextElementSibling as HTMLAnchorElement | null
		function keydown(e: KeyboardEvent) {
			console.log(e);
			console.log(next);
			if(e.key === "ArrowDown") {
				next.focus()
				return
			}
			if(e.key === "ArrowUp") {
				prev.focus()
				return
			}
		}
		a.addEventListener('keydown', keydown)
		return({
			destroy() {
				a.removeEventListener('keydown', keydown)
			},
		})
	}
</script>

<div class="pane left">
	<a href="/df/adsaf" class="item" tabindex="0">Convivially Situated</a>
	<a href="/gf/adsdsafdsf" class="item"
		>yet another UI Metachanel on are dot na</a
	>
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
	<a href="/df/adsaf" class="item" use:key> link</a>
	<a href="/gf/adsdsafdsf" class="item" use:key> link</a>
	<a href="/rtf/fsdsaf" class="item" use:key> link</a>
	<a href="/dhf/adsdsf" class="item" use:key> link</a>
	<a href="/dh/adsaf" class="item" use:key> link</a>
	<a href="/nf/adfsaf" class="item" use:key> link</a>
	<a href="/erwf/adsdaf" class="item" use:key> link</a>
</div>
<div class="handle" draggable use:resizer>
	<div></div>
</div>

<div class="pane detail">
	<BlockDetails/>	
</div>

<style>
	.handle {
		width: .5rem;
		grid-row: 2 /-1;
		/* opacity: 0; */
		outline: 4px solid transparent;
		display: flex;
		justify-content: center;

		&:hover {
			animation: delayed-resize 0ms 150ms ease-out forwards;
			/* background: oklch(0.24 0 89.88); */
			/* outline: 4px solid oklch(.3 0 0); */
			/* delay 200ms then transition cursor to resize */
			/* width: 4px; */
			opacity: 1;
			animation: delayed-resize 0ms 80ms ease-out forwards;
			div {
				background-color: color-mix(in oklch, var(--line), oklch(.7 0.2 80));
			}
		}
		& div {
			width: 1px;
			height: 100%;
			background: var(--line);
			opacity: 1;
			transition: background-color 100ms 80ms ease-out;
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
		display: grid;
		grid-template-rows: subgrid;
		grid-row: 2 / -1;
		align-items: center;
		/* border-inline-end: 1px solid hsl(0 0% 24%); */
		/* padding: .5em; */
		/* width: 1fr; */
		padding: 0.75rem 0.15rem;
		.item {
			/* border-block: 1px solid ; */
			width: 100%;
			font-size: 0.85rem;
			padding: 0.5em 0.5em;
			overflow: hidden;
			/* height: 1.1rem; */
			white-space: nowrap;
			text-overflow: ellipsis;
			/* margin: 0.25em 0.75em; */
			&:hover,
			&:focus {
				background: oklch(0.24 0 89.88);
			}
		}
	}
	.pane.left {
		grid-column: full-start / chan-end;
		padding-inline-start: 0.5rem;
		max-width: 35ch;
		min-width: 15ch;
		/* width: 25ch; */
	}

	.pane.right {
		/* grid-column: 3 / 4; */
		min-width: 10ch;
		max-width: 30ch;
		min-width: 1fr;
		/* width: 40ch; */
		/* background: brown; */
		width: 1fr;
	}
	.pane.detail {
		/* grid-column: 5 / full-end; */
		/* background: red; */
		min-width: 30ch;
		/* width: 40ch; */
		display: block;
		overflow-y: auto;
		/* flex-direction: column; */
	}
</style>
