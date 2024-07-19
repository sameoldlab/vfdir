<script lang="ts">
  import BlockDetails from '$lib/components/BlockDetails.svelte';
	// import GridView from '$lib/components/GridView.svelte'
	import {resizer, key} from '$lib/actions'
  import type { Channel } from '$lib/store/data.svelte';
  import { pushState } from '$app/navigation'
  import { page } from '$app/stores'
	import { db } from '$lib/store/sqlite.svelte'
  import { channels} from '$lib/store/daa.s elte';

	// let channels = {list: []}
	const addItem = (e: MouseEvent) => {
		pushState('', {
			show: true
		})
	}

	const addChannel = (channel: Partial<Channel>) => {
		if(!channels) return
		const {
			title,
			status,
			author_slug,
			flags
		} = {
			...channel,
			status: 'local',
			author_slug: 'local',
			flags: [],
			} as Channel
		console.log('channel', title, status, author_slug, flags)
		const sanitize = (str: string): string => str.replaceAll(' ', '-')
		
		channels.push(db.db, [{
			slug: sanitize(title)+(new Date().getMilliseconds().toString()),
			title,
			created_at: new Date().toISOString(),
			status,
			author_slug,
			flags
		}])
	}

</script>

<div class="pane left">
	{#each channels.list as [key, {slug, title}]}
		<a href={slug} class="item">{title}</a>
		{:else}
			<div class="item">empty</div>
	{/each} 
	<a href="/df/adsaf" class="item" tabindex="0">Convivially Situated</a>
	<a href="/gf/adsdsafdsf" class="item"
		>yet another UI Metachanel on are dot na</a
	>
	<a href="/rtf/fsdsaf" class="item">link</a>
	<a href="/dhf/adsdsf" class="item">link</a>
	<a href="/dh/adsaf" class="item">link</a>
	<a href="/nf/adfsaf" class="item">link</a>
	<a href="/erwf/adsdaf" class="item">link</a>
</div>
<div class="handle" draggable use:resizer>
	<div></div>
</div>
<div class="pane right">
	<button onclick={addItem}>New Channel</button>

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
