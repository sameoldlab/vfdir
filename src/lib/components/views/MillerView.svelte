<script lang="ts">
	import { resizer, key } from '$lib/actions'
	import BlockDetail from '$lib/components/BlockDetails.svelte'
	import { getTree } from '$lib/stores.svelte'
	import {
		Block,
		blocks,
		Channel,
		channels,
		Connection,
		type Entry
	} from '$lib/pools/block.svelte'
	import { goto } from '$app/navigation'

	let { data }: { data: (Connection & Entry)[] } = $props()
	const tree = getTree()

	let previous = $derived.by(() => {
		if ($tree.at(-1)?.route.id === '/') return // all channels

		// if nested in a channel show the content of the parent channel
		// select all blocks with a connection (child id to the given channel
		if ($tree.at(-1) && 'channel' in $tree.at(-1)?.params)
			return channels.get($tree.at(-1).params.channel).blocks
		return
	})

	/** key of currently hovered item */
	let focused: Block['id'] | Channel['slug'] | undefined = $state()
	const detail = $derived(blocks.get(focused))
</script>

{#snippet entry(e)}
	<a
		tabindex="-1"
		href={e.type === 'channel'
			? `/${e.author?.slug}/${e.key}`
			: `/block/${e.key}`}
		class="item"
	>
		{e.title || '-'}
	</a>
{/snippet}
<main>
	<div class="pane left">
		{#if previous && previous.length > 1}
			{#each previous as { author, title, ...p }, i (p.key)}
				{@render entry(p)}
			{/each}
		{:else}
			<div class="item">//</div>
		{/if}
	</div>

	<div class="handle" draggable use:resizer><div></div></div>

	<div class="pane right">
		{#each data as b, i (b.key)}
			<a
				onclick={(e) => {
					e.preventDefault()
					focused = b.key
				}}
				ondblclick={(e) => {
					goto(e.target.href)
				}}
				onfocus={() => {
					focused = b.key
				}}
				href="/{b.type === 'channel' ? b.author.slug : 'block'}/{b.key}"
				class="item"
				use:key>{b.title || '-'}</a
			>
		{/each}
	</div>

	<div class="handle" draggable use:resizer><div></div></div>

	<div class="pane extra">
		{#if detail && !(detail.type === 'channel')}
			<div class="detail">
				<BlockDetail block={detail} />
			</div>
		{:else if detail}
			{#each channels.get(focused)?.blocks as b (b.key)}
				{@render entry(b)}
			{/each}
		{/if}
	</div>
</main>

<style>
	main {
		height: 100dvh;
		overflow-y: hidden;
		display: grid;
		grid-template-rows: repeat(auto-fill, minmax(1.75rem, 1fr));
		grid-template-columns: [full-start] minmax(15ch, min-content) [chan-end] 0.5rem auto 0.5rem 4fr [full-end];
	}
	.handle {
		width: 0.5rem;
		grid-row: 1 / -1;
		/* opacity: 0; */
		outline: 4px solid transparent;
		display: flex;
		justify-content: center;

		&:hover {
			animation: delayed-resize 0ms 80ms ease-out forwards;
			div {
				background-color: color-mix(in oklch, var(--line), oklch(0.7 0.2 80));
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
		/* grid-template-rows: subgrid; */
		grid-auto-rows: 1.75rem;
		grid-row: 1 / -1;
		gap: 1px;
		overflow-y: scroll;
		align-items: center;
		height: 100%;
		/* border-inline-end: 1px solid hsl(0 0% 24%); */
		/* padding: .5em; */
		/* width: 1fr; */
		padding: 0.5rem 0.15rem;
		.item {
			/* border-block: 1px solid ; */
			background: none;
			text-align: inherit;
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
		max-width: 50ch;
		/* width: 40ch; */
		/* background: brown; */
		width: 2fr;
	}
	.pane.extra {
		/* grid-column: 5 / full-end; */
		/* background: red; */
		min-width: 30ch;
		/* width: 40ch; */
		overflow-y: scroll;
		height: 100%;
		/* flex-direction: column; */
	}
	.pane:has(div.detail) {
		display: block;
	}
	.detail {
		display: flex;
		flex-direction: column;
		justify-content: start;
		align-items: start;
		height: 100%;
	}
</style>
