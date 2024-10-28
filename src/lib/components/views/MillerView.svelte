<script lang="ts">
	import { Block, Channel, type BlocksRow } from '$lib/database/schema'
	import { resizer, key } from '$lib/actions'
	import { pushState } from '$app/navigation'
	// import { page } from '$app/stores'
	import { pool } from '$lib/database/connectionPool.svelte'
	import BlockDetail from '$lib/components/BlockDetails.svelte'
	import { getTree } from '$lib/stores.svelte'
	import { first } from '$lib/utils/queryProcess'

	let { ...data }: BlocksRow[] = $props()
	$inspect(data)
	const tree = getTree()

	const addItem = (e: MouseEvent) => {
		pushState('', {
			show: 'add'
		})
	}

	let previous = $derived.by(() => {
		if ($tree.at(-1)?.route.id === '/')
			return pool.query<BlocksRow>(
				`select * from Blocks where type='channel' order by updated_at desc`
			)

		// if nested in a channel show the content of the parent channel
		// select all blocks with a connection (child id to the given channel
		if ($tree.at(-1) && 'channel' in $tree.at(-1)?.params)
			return pool.query<BlocksRow>(
				`
				SELECT b.* from Blocks b 
				JOIN Connections conn ON conn.child_id = b.id 
				JOIN Blocks ch ON conn.parent_id = ch.id
				WHERE ch.slug = ?
				ORDER by conn.position DESC, conn.connected_at
				`,
				[$tree.at(-1).params.channel]
			)

		return
	})
	// $inspect(previous)

	/**
	 * id of currently hovered item
	 */
	let col2Hover: string | undefined = $state(data[0]?.id)
</script>

<main>
	<div class="pane left">
		{#if previous && previous.data.length > 1}
			{#each previous.data as { id, user, slug, title }, i (id)}
				<a tabindex="-1" href="{user}/{slug}" class="item">{title}</a>
			{/each}
		{:else}
			<div class="item">///</div>
		{/if}
	</div>

	<div class="handle" draggable use:resizer><div></div></div>

	<div class="pane right">
		<button class="item" use:key={{ right: 'add' }} onclick={addItem}
			>+ Add Block</button
		>
		{#each data as { id, title, type, ...b }, i (id)}
			<a
				onmouseover={() => (col2Hover = id)}
				onfocus={() => (col2Hover = id)}
				href={type === 'channel' ? `/${b.author_id}/${b.slug}` : id}
				class="item"
				use:key>{title || '-'}</a
			>
		{:else}
			<button class="item" use:key={{ left: 'back' }} onclick={addItem}
				>..</button
			>
		{/each}
	</div>

	<div class="handle" draggable use:resizer><div></div></div>

	<div class="pane detail">
		{#if col2Hover}
			<BlockDetail id={col2Hover} />
		{/if}
	</div>
</main>

<style>
	main {
		min-height: 100dvh;
		max-width: 100svw;
		overflow-x: auto;
		display: grid;
		grid-template-rows: repeat(auto-fill, 2.5rem);
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
		grid-template-rows: subgrid;
		grid-row: 1 / -1;
		align-items: center;
		/* border-inline-end: 1px solid hsl(0 0% 24%); */
		/* padding: .5em; */
		/* width: 1fr; */
		padding: 0.75rem 0.15rem;
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
